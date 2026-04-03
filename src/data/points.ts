import { Trees } from "./talentTreeMap.ts";

export type TalentPool = 'General' | 'Solo' | 'Mounts' | 'Pets' | 'Livestock';

export const DEFAULT_CHARACTER_LEVEL = 60;
export const MAX_CHARACTER_LEVEL = 60;

export const pointPools: Record<TalentPool, {
    cap: number;
    trees: (keyof typeof Trees)[];
    perTreeCap?: boolean;
}> = {
    General: {
        cap: 90,
        trees: [
            'Resources', 'Hunting', 'Cooking',
            'Exploration', 'Husbandry', 'Genetics', 'Fishing',
            'Repairing', 'Tools', 'Building',
            'Bows', 'Spears', 'Blades', 'Firearms'
        ]
    },
    Solo: {
        cap: 30,
        trees: ['Solo']
    },
    Mounts: {
        cap: 50,
        trees: [
// ⚠️ SPECIAL CASE:
// Blueback is categorized as Livestock (UI/behavior),
// but uses the 50-point pool like Mounts.
// This is intentional and matches in-game behavior 
// as it is a non-combat, non-mount creature.
// Do NOT move this to the Livestock pool unless the game changes.		
            'Arctic_Moa', 'Blueback', 'Buffalo',
            'Horse', 'Moa', 'Shaggy_Zebra',
//            'Stryder', 
			'Terrenus', 'Tusker',
            'Zebra', 'Bull', 'Draven',
            'Dune_Raptor', 'Raptor', 'Slinker',
            'Ubis', 'Woolly_Mammoth'
        ],
        perTreeCap: true
    },
    Pets: {
        cap: 25,
        trees: [
            'Boar', 'Dog', 'Hyena',
            'Snow_Wolf', 'Wolf', 'Gribbler',
            'Skulk', 'Storca'
        ],
        perTreeCap: true
    },
    Livestock: {
        cap: 25,
        trees: [
            'Cat', 'Chicken', 'Cow',
            'Rooster', 'Sheep', 'Pig'
        ],
        perTreeCap: true
    }
};

export function getPoolForTree(tree: keyof typeof Trees): TalentPool | null {
    for (const pool of Object.keys(pointPools) as TalentPool[]) {
        if (pointPools[pool].trees.includes(tree)) return pool;
    }
    return null;
}

export function isPoolPerTreeCap(pool: TalentPool | null): boolean {
    if (!pool) return false;
    return pointPools[pool].perTreeCap || false;
}

export function clampCharacterLevel(level: number): number {
    if (!Number.isFinite(level)) return DEFAULT_CHARACTER_LEVEL;
    return Math.max(0, Math.min(MAX_CHARACTER_LEVEL, Math.floor(level)));
}

export function getGeneralBaseCap(characterLevel: number): number {
    const level = clampCharacterLevel(characterLevel);
    return Math.floor(level * 1.5);
}

export function getSoloCap(characterLevel: number): number {
    const level = clampCharacterLevel(characterLevel);
    return Math.floor(level * 0.5);
}

export function getGeneralCap(characterLevel: number, bonusTalents: number): number {
    const safeBonusTalents = Math.max(0, Math.floor(bonusTalents || 0));
    return getGeneralBaseCap(characterLevel) + safeBonusTalents;
}

export function isAutoOwnedCreatureTalent(treeKey: keyof typeof Trees | string, talentName: string): boolean {
    const normalizedTreeKey = treeKey as keyof typeof Trees;
    const pool = getPoolForTree(normalizedTreeKey);

    if (pool !== 'Pets' && pool !== 'Mounts' && pool !== 'Livestock') return false;

    const displayName = Trees[normalizedTreeKey]?.name;
    return talentName === displayName;
}