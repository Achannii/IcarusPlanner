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

const SHARE_QUERY_PARAM = 'b';
const LEGACY_SHARE_QUERY_PARAM = 'build';
const COMPACT_URL_SCHEMA_VERSION = 1;

interface CompactUrlPayload {
    v: number;
    g: string;
    l?: number;
    b?: number[];
    t: Record<string, number[]>;
}

const CREATURE_CATEGORIES = new Set<Categories>([
    Categories.Mounts,
    Categories.Pets,
    Categories.Livestock,
]);

const TREE_KEYS = Object.keys(Trees) as (keyof typeof Trees)[];
const TREE_KEY_TO_ID = new Map<string, string>(
    TREE_KEYS.map((treeKey, index) => [treeKey, index.toString(36)]),
);
const TREE_ID_TO_KEY = new Map<string, string>(
    TREE_KEYS.map((treeKey, index) => [index.toString(36), treeKey]),
);

const BONUS_KEY_ORDER = [
    'olympus_nightfall',
    'styx_ironclad',
    'prometheus_null_sector',
    'elysium_reckoning',
    'elysium_trials',
    'great_hunt_quarrite',
    'great_hunt_garganutan',
    'great_hunt_rimetusk',
    'great_hunt_elysium_soon',
] as const;

const BONUS_KEY_TO_INDEX = new Map<string, number>(
    BONUS_KEY_ORDER.map((key, index) => [key, index]),
);

const BONUS_INDEX_TO_KEY = new Map<number, string>(
    BONUS_KEY_ORDER.map((key, index) => [index, key]),
);

const TALENT_NAME_TO_INDEX_BY_TREE = new Map<string, Map<string, number>>();
const TALENT_INDEX_TO_NAME_BY_TREE = new Map<string, string[]>();

for (const [treeKey, entry] of Object.entries(talentTreeMap)) {
    if (!entry) continue;

    const nameToIndex = new Map<string, number>();
    const indexToName: string[] = [];

    entry.talents.forEach((talent, index) => {
        nameToIndex.set(talent.name, index);
        indexToName[index] = talent.name;
    });

    TALENT_NAME_TO_INDEX_BY_TREE.set(treeKey, nameToIndex);
    TALENT_INDEX_TO_NAME_BY_TREE.set(treeKey, indexToName);
}

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

function buildExportedTalentState(
    talentPoints: Record<string, Record<string, number>>,
    scope: ExportScope,
    progression?: {
        characterLevel: number;
        selectedBonusTalents: Record<string, boolean>;
    },
): ExportedTalentState {
    return {
        gameVersion: GAME_VERSION,
        talentPoints: filterTalentPointsByScope(talentPoints, scope),
        characterLevel: progression?.characterLevel,
        selectedBonusTalents: cleanSelectedBonusTalents(progression?.selectedBonusTalents),
    };
}

function encodeCompactPayload(exportedState: ExportedTalentState): CompactUrlPayload {
    const cleanedTalentPoints = cleanTalentPoints(exportedState.talentPoints);
    const cleanedBonuses = cleanSelectedBonusTalents(exportedState.selectedBonusTalents);

    const compactTalentPoints: Record<string, number[]> = {};

    for (const [treeKey, talents] of Object.entries(cleanedTalentPoints)) {
        const treeId = TREE_KEY_TO_ID.get(treeKey);
        const talentNameToIndex = TALENT_NAME_TO_INDEX_BY_TREE.get(treeKey);
        if (!treeId || !talentNameToIndex) continue;

        const compactTalents: number[] = [];

        for (const [talentName, points] of Object.entries(talents)) {
            const talentIndex = talentNameToIndex.get(talentName);
            if (talentIndex === undefined) continue;
            compactTalents.push(talentIndex, points);
        }

        if (compactTalents.length > 0) {
            compactTalentPoints[treeId] = compactTalents;
        }
    }

    const compactBonusIndices = Object.keys(cleanedBonuses)
        .map(key => BONUS_KEY_TO_INDEX.get(key))
        .filter((index): index is number => index !== undefined)
        .sort((a, b) => a - b);

    const payload: CompactUrlPayload = {
        v: COMPACT_URL_SCHEMA_VERSION,
        g: exportedState.gameVersion,
        t: compactTalentPoints,
    };

    if (typeof exportedState.characterLevel === 'number') {
        payload.l = exportedState.characterLevel;
    }

    if (compactBonusIndices.length > 0) {
        payload.b = compactBonusIndices;
    }

    return payload;
}

function decodeCompactPayload(payload: CompactUrlPayload): ExportedTalentState | null {
    if (!payload || typeof payload !== 'object') return null;
    if (payload.v !== COMPACT_URL_SCHEMA_VERSION) return null;
    if (!payload.t || typeof payload.t !== 'object') return null;

    const talentPoints: Record<string, Record<string, number>> = {};

    for (const [treeId, compactTalents] of Object.entries(payload.t)) {
        if (!Array.isArray(compactTalents)) continue;

        const treeKey = TREE_ID_TO_KEY.get(treeId);
        const talentIndexToName = treeKey ? TALENT_INDEX_TO_NAME_BY_TREE.get(treeKey) : undefined;
        if (!treeKey || !talentIndexToName) continue;

        const talentsForTree: Record<string, number> = {};

        for (let i = 0; i < compactTalents.length; i += 2) {
            const talentIndex = compactTalents[i];
            const points = compactTalents[i + 1];

            if (typeof talentIndex !== 'number' || typeof points !== 'number' || points <= 0) {
                continue;
            }

            const talentName = talentIndexToName[talentIndex];
            if (!talentName) continue;

            talentsForTree[talentName] = points;
        }

        if (Object.keys(talentsForTree).length > 0) {
            talentPoints[treeKey] = talentsForTree;
        }
    }

    const selectedBonusTalents: Record<string, boolean> = {};
    for (const bonusIndex of payload.b ?? []) {
        const bonusKey = BONUS_INDEX_TO_KEY.get(bonusIndex);
        if (bonusKey) {
            selectedBonusTalents[bonusKey] = true;
        }
    }

    return {
        gameVersion: typeof payload.g === 'string' ? payload.g : GAME_VERSION,
        talentPoints,
        characterLevel: typeof payload.l === 'number' ? payload.l : undefined,
        selectedBonusTalents,
    };
}

function isCompactUrlPayload(value: unknown): value is CompactUrlPayload {
    if (!value || typeof value !== 'object') return false;

    const candidate = value as Partial<CompactUrlPayload>;
    return (
        typeof candidate.v === 'number'
        && typeof candidate.g === 'string'
        && typeof candidate.t === 'object'
        && candidate.t !== null
    );
}

function isExportedTalentState(value: unknown): value is ExportedTalentState {
    if (!value || typeof value !== 'object') return false;

    const candidate = value as Partial<ExportedTalentState>;
    return typeof candidate.gameVersion === 'string' && typeof candidate.talentPoints === 'object' && candidate.talentPoints !== null;
}

export function exportToQueryParam(
    talentPoints: Record<string, Record<string, number>>,
    scope: ExportScope = 'full',
    progression?: {
        characterLevel: number;
        selectedBonusTalents: Record<string, boolean>;
    },
): string {
    const compactPayload = encodeCompactPayload(buildExportedTalentState(talentPoints, scope, progression));
    return compressToEncodedURIComponent(JSON.stringify(compactPayload));
}

export function importFromQueryParam(param: string): ExportedTalentState | null {
    try {
        const json = decompressFromEncodedURIComponent(param);
        if (!json) return null;

        const parsed = JSON.parse(json) as unknown;

        if (isCompactUrlPayload(parsed)) {
            return decodeCompactPayload(parsed);
        }

        if (isExportedTalentState(parsed)) {
            return {
                gameVersion: parsed.gameVersion,
                talentPoints: cleanTalentPoints(parsed.talentPoints),
                characterLevel: parsed.characterLevel,
                selectedBonusTalents: cleanSelectedBonusTalents(parsed.selectedBonusTalents),
            };
        }

        return null;
    } catch {
        return null;
    }
}

export function importFromUrlSearch(search: string): ExportedTalentState | null {
    const params = new URLSearchParams(search);
    const compactParam = params.get(SHARE_QUERY_PARAM);

    if (compactParam) {
        return importFromQueryParam(compactParam);
    }

    const legacyParam = params.get(LEGACY_SHARE_QUERY_PARAM);
    if (legacyParam) {
        return importFromQueryParam(legacyParam);
    }

    return null;
}

export function buildShareUrl(
    talentPoints: Record<string, Record<string, number>>,
    scope: ExportScope = 'full',
    progression?: {
        characterLevel: number;
        selectedBonusTalents: Record<string, boolean>;
    },
): string {
    const encoded = exportToQueryParam(talentPoints, scope, progression);
    return `${window.location.origin}${window.location.pathname}?${SHARE_QUERY_PARAM}=${encoded}`;
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
