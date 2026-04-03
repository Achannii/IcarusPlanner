import { Categories, Trees } from '../data/talentTreeMap.ts';
import {
    ExportedTalentState,
    calculatePointsSpent,
    cleanSelectedBonusTalents,
    cleanTalentPoints,
} from './exportImport';
import { GAME_VERSION } from '../constants/gameVersion';
import { DEFAULT_CHARACTER_LEVEL } from '../data/points.ts';

export type SaveScope = 'player' | 'creatures' | 'full';

export interface SavedBuild {
    id: string;
    name: string;
    scope: SaveScope;
    createdAt: string;
    updatedAt: string;
    version: number;
    pinned?: boolean;
    data: ExportedTalentState;
}

const SAVE_STORAGE_KEY = 'icarusTalentTool.saves';
const SAVE_SCHEMA_VERSION = 3;

const CREATURE_CATEGORIES = new Set<Categories>([
    Categories.Mounts,
    Categories.Pets,
    Categories.Livestock,
]);

function isCreatureTreeKey(treeKey: string): boolean {
    if (!(treeKey in Trees)) return false;
    const typedTreeKey = treeKey as keyof typeof Trees;
    return CREATURE_CATEGORIES.has(Trees[typedTreeKey].category);
}

function isPlayerTreeKey(treeKey: string): boolean {
    if (!(treeKey in Trees)) return false;
    return !isCreatureTreeKey(treeKey);
}

export function filterTalentPointsByScope(
    talentPoints: Record<string, Record<string, number>>,
    scope: SaveScope,
): Record<string, Record<string, number>> {
    const cleaned = cleanTalentPoints(talentPoints);
    const filtered: Record<string, Record<string, number>> = {};

    for (const [treeKey, treeTalents] of Object.entries(cleaned)) {
        const includeTree =
            scope === 'full'
                ? true
                : scope === 'player'
                    ? isPlayerTreeKey(treeKey)
                    : isCreatureTreeKey(treeKey);

        if (!includeTree) continue;
        filtered[treeKey] = treeTalents;
    }

    return filtered;
}

export function buildExportedStateForScope(
    talentPoints: Record<string, Record<string, number>>,
    scope: SaveScope,
    progression?: {
        characterLevel: number;
        selectedBonusTalents: Record<string, boolean>;
    },
): ExportedTalentState {
    return {
        gameVersion: GAME_VERSION,
        talentPoints: filterTalentPointsByScope(talentPoints, scope),
        characterLevel: progression?.characterLevel ?? DEFAULT_CHARACTER_LEVEL,
        selectedBonusTalents: cleanSelectedBonusTalents(progression?.selectedBonusTalents),
    };
}

export function mergeImportedTalentPointsByScope(
    currentTalentPoints: Record<string, Record<string, number>>,
    importedTalentPoints: Record<string, Record<string, number>>,
    scope: SaveScope,
): Record<string, Record<string, number>> {
    const currentClean = cleanTalentPoints(currentTalentPoints);
    const importedClean = cleanTalentPoints(importedTalentPoints);

    if (scope === 'full') {
        return importedClean;
    }

    const merged: Record<string, Record<string, number>> = {};

    for (const [treeKey, treeTalents] of Object.entries(currentClean)) {
        const shouldKeepExisting =
            scope === 'player'
                ? isCreatureTreeKey(treeKey)
                : isPlayerTreeKey(treeKey);

        if (shouldKeepExisting) {
            merged[treeKey] = treeTalents;
        }
    }

    for (const [treeKey, treeTalents] of Object.entries(importedClean)) {
        const shouldApplyImported =
            scope === 'player'
                ? isPlayerTreeKey(treeKey)
                : isCreatureTreeKey(treeKey);

        if (shouldApplyImported) {
            merged[treeKey] = treeTalents;
        }
    }

    return cleanTalentPoints(merged);
}

export function getSavedBuilds(): SavedBuild[] {
    try {
        const raw = localStorage.getItem(SAVE_STORAGE_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed
            .filter(isSavedBuildLike)
            .sort((a, b) => {
                const aTime = Date.parse(a.updatedAt || a.createdAt || '');
                const bTime = Date.parse(b.updatedAt || b.createdAt || '');
                return bTime - aTime;
            });
    } catch {
        return [];
    }
}

export function getSavedBuildById(id: string): SavedBuild | null {
    return getSavedBuilds().find(build => build.id === id) ?? null;
}

export function findSavedBuildByName(name: string): SavedBuild | null {
    const normalized = normalizeBuildName(name);
    if (!normalized) return null;

    return (
        getSavedBuilds().find(
            build => normalizeBuildName(build.name) === normalized,
        ) ?? null
    );
}

export function saveBuild(params: {
    name: string;
    scope: SaveScope;
    talentPoints: Record<string, Record<string, number>>;
    characterLevel: number;
    selectedBonusTalents: Record<string, boolean>;
    overwriteId?: string | null;
}): SavedBuild {
    const trimmedName = params.name.trim();
    if (!trimmedName) {
        throw new Error('Build name is required.');
    }

    const builds = getSavedBuilds();
    const now = new Date().toISOString();
    const exportedState = buildExportedStateForScope(
        params.talentPoints,
        params.scope,
        {
            characterLevel: params.characterLevel,
            selectedBonusTalents: params.selectedBonusTalents,
        }
    );

    if (params.overwriteId) {
        const existingIndex = builds.findIndex(build => build.id === params.overwriteId);
        if (existingIndex >= 0) {
            const existing = builds[existingIndex];
            const updated: SavedBuild = {
                ...existing,
                name: trimmedName,
                scope: params.scope,
                updatedAt: now,
                version: SAVE_SCHEMA_VERSION,
                data: exportedState,
            };
            builds[existingIndex] = updated;
            persistBuilds(builds);
            return updated;
        }
    }

    const created: SavedBuild = {
        id: createBuildId(),
        name: trimmedName,
        scope: params.scope,
        createdAt: now,
        updatedAt: now,
        version: SAVE_SCHEMA_VERSION,
        pinned: false,
        data: exportedState,
    };

    builds.unshift(created);
    persistBuilds(builds);
    return created;
}

export function deleteSavedBuild(id: string): void {
    const builds = getSavedBuilds().filter(build => build.id !== id);
    persistBuilds(builds);
}

export function renameSavedBuild(id: string, name: string): SavedBuild {
    const trimmedName = name.trim();
    if (!trimmedName) {
        throw new Error('Build name is required.');
    }

    const builds = getSavedBuilds();
    const index = builds.findIndex(build => build.id === id);
    if (index < 0) {
        throw new Error('Saved build not found.');
    }

    const updated: SavedBuild = {
        ...builds[index],
        name: trimmedName,
        updatedAt: new Date().toISOString(),
    };

    builds[index] = updated;
    persistBuilds(builds);
    return updated;
}

export function togglePinnedSavedBuild(id: string): SavedBuild {
    const builds = getSavedBuilds();
    const index = builds.findIndex(build => build.id === id);
    if (index < 0) {
        throw new Error('Saved build not found.');
    }

    const updated: SavedBuild = {
        ...builds[index],
        pinned: !(builds[index].pinned ?? false),
        updatedAt: builds[index].updatedAt,
    };

    builds[index] = updated;
    persistBuilds(builds);
    return updated;
}

export function clearAllSavedBuilds(): void {
    localStorage.removeItem(SAVE_STORAGE_KEY);
}

export function getPointsSpentForSavedBuild(build: SavedBuild): Record<string, number> {
    return calculatePointsSpent(build.data.talentPoints);
}

export function getSaveScopeLabel(scope: SaveScope): string {
    switch (scope) {
        case 'player':
            return 'Player Only';
        case 'creatures':
            return 'Creatures Only';
        case 'full':
            return 'Player and Creatures';
        default:
            return scope;
    }
}

function persistBuilds(builds: SavedBuild[]): void {
    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(builds));
}

function createBuildId(): string {
    return `build_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeBuildName(name: string): string {
    return name.trim().toLowerCase();
}

function isSavedBuildLike(value: unknown): value is SavedBuild {
    if (!value || typeof value !== 'object') return false;

    const candidate = value as Partial<SavedBuild>;

    return (
        typeof candidate.id === 'string' &&
        typeof candidate.name === 'string' &&
        typeof candidate.scope === 'string' &&
        typeof candidate.createdAt === 'string' &&
        typeof candidate.updatedAt === 'string' &&
        typeof candidate.version === 'number' &&
        (
            candidate.pinned === undefined ||
            typeof candidate.pinned === 'boolean'
        ) &&
        !!candidate.data &&
        typeof candidate.data === 'object' &&
        typeof candidate.data.gameVersion === 'string' &&
        !!candidate.data.talentPoints &&
        typeof candidate.data.talentPoints === 'object'
    );
}