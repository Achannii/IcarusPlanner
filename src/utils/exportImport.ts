import { GAME_VERSION } from '../constants/gameVersion';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { talentTreeMap, Categories, Trees } from '../data/talentTreeMap';

export interface ExportedTalentState {
    gameVersion: string;
    talentPoints: Record<string, Record<string, number>>;
    characterLevel?: number;
    selectedBonusTalents?: Record<string, boolean>;
}

export type ExportScope = 'player' | 'creatures' | 'full';

const CREATURE_CATEGORIES = new Set<Categories>([
    Categories.Mounts,
    Categories.Pets,
    Categories.Livestock,
]);

export function cleanTalentPoints(
    talentPoints: Record<string, Record<string, number>>,
): Record<string, Record<string, number>> {
    const cleaned: Record<string, Record<string, number>> = {};

    for (const [treeKey, talents] of Object.entries(talentPoints)) {
        const filteredTalents: Record<string, number> = {};

        for (const [talentName, points] of Object.entries(talents)) {
            if (points > 0) {
                filteredTalents[talentName] = points;
            }
        }

        if (Object.keys(filteredTalents).length > 0) {
            cleaned[treeKey] = filteredTalents;
        }
    }

    return cleaned;
}

export function cleanSelectedBonusTalents(
    selectedBonusTalents: Record<string, boolean> | undefined,
): Record<string, boolean> {
    const cleaned: Record<string, boolean> = {};

    if (!selectedBonusTalents || typeof selectedBonusTalents !== 'object') {
        return cleaned;
    }

    for (const [key, value] of Object.entries(selectedBonusTalents)) {
        if (value === true) {
            cleaned[key] = true;
        }
    }

    return cleaned;
}

export function filterTalentPointsByScope(
    talentPoints: Record<string, Record<string, number>>,
    scope: ExportScope,
): Record<string, Record<string, number>> {
    const cleaned = cleanTalentPoints(talentPoints);
    const filtered: Record<string, Record<string, number>> = {};

    for (const [treeKey, talents] of Object.entries(cleaned)) {
        const includeTree =
            scope === 'full'
                ? true
                : scope === 'player'
                    ? isPlayerTreeKey(treeKey)
                    : isCreatureTreeKey(treeKey);

        if (includeTree) {
            filtered[treeKey] = talents;
        }
    }

    return filtered;
}

export function nestTalentPoints(
    talentPoints: Record<string, number>,
): Record<string, Record<string, number>> {
    const nested: Record<string, Record<string, number>> = {};

    for (const [name, points] of Object.entries(talentPoints)) {
        const talent = findTalentByName(name);
        if (!talent) continue;

        if (!nested[talent.tree]) nested[talent.tree] = {};
        nested[talent.tree][name] = points;
    }

    return nested;
}

export function exportToJson(
    talentPoints: Record<string, Record<string, number>>,
    scope: ExportScope = 'full',
    progression?: {
        characterLevel: number;
        selectedBonusTalents: Record<string, boolean>;
    },
): string {
    const exportData: ExportedTalentState = {
        gameVersion: GAME_VERSION,
        talentPoints: filterTalentPointsByScope(talentPoints, scope),
        characterLevel: progression?.characterLevel,
        selectedBonusTalents: cleanSelectedBonusTalents(progression?.selectedBonusTalents),
    };

    return JSON.stringify(exportData, null, 2);
}

export function exportToQueryParam(
    talentPoints: Record<string, Record<string, number>>,
    scope: ExportScope = 'full',
    progression?: {
        characterLevel: number;
        selectedBonusTalents: Record<string, boolean>;
    },
): string {
    const data: ExportedTalentState = {
        gameVersion: GAME_VERSION,
        talentPoints: filterTalentPointsByScope(talentPoints, scope),
        characterLevel: progression?.characterLevel,
        selectedBonusTalents: cleanSelectedBonusTalents(progression?.selectedBonusTalents),
    };

    const json = JSON.stringify(data);
    return compressToEncodedURIComponent(json);
}

export function importFromQueryParam(param: string): ExportedTalentState | null {
    try {
        const json = decompressFromEncodedURIComponent(param);
        return json ? JSON.parse(json) : null;
    } catch {
        return null;
    }
}

export function isVersionMismatch(importedVersion: string): boolean {
    return importedVersion !== GAME_VERSION;
}

function findTalentByName(name: string) {
    for (const entry of Object.values(talentTreeMap)) {
        if (!entry) continue;
        const found = entry.talents.find(t => t.name === name);
        if (found) return found;
    }
    return null;
}

function isCreatureTreeKey(treeKey: string): boolean {
    if (!(treeKey in Trees)) return false;
    const typedTreeKey = treeKey as keyof typeof Trees;
    return CREATURE_CATEGORIES.has(Trees[typedTreeKey].category);
}

function isPlayerTreeKey(treeKey: string): boolean {
    if (!(treeKey in Trees)) return false;
    return !isCreatureTreeKey(treeKey);
}

export function calculatePointsSpent(
    talentPoints: Record<string, Record<string, number>>,
): Record<string, number> {
    const spent: Record<string, number> = {};
    for (const [treeKey, talents] of Object.entries(talentPoints)) {
        spent[treeKey] = Object.values(talents).reduce((sum, pts) => sum + pts, 0);
    }
    return spent;
}