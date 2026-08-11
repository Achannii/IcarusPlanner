export type BloodlineEffectUnit = '%' | 'flat' | 'kg';

export interface BloodlineFixedEffect {
    id: string;
    label: string;
    valueText: string;
}

export interface BloodlineGrowthEffect {
    id: string;
    label: string;
    amountPerStep: number;
    levelsPerStep: number;
    unit: BloodlineEffectUnit;
    sign?: '+' | '-' | '';
}

export interface BloodlineDefinition {
    name: string;
    fixedEffects: BloodlineFixedEffect[];
    growthEffects: BloodlineGrowthEffect[];
}

export const BLOODLINES: BloodlineDefinition[] = [
    {
        name: 'Alpha',
        fixedEffects: [{ id: 'alpha-size', label: 'Size', valueText: '+20%' }],
        growthEffects: [
            { id: 'alpha-melee', label: 'Melee', amountPerStep: 1, levelsPerStep: 1, unit: 'flat', sign: '+' },
            { id: 'alpha-hp', label: 'Max HP', amountPerStep: 1, levelsPerStep: 1, unit: 'flat', sign: '+' },
        ],
    },
    {
        name: 'Ambitious',
        fixedEffects: [{ id: 'ambitious-xp', label: 'XP', valueText: '+50%' }],
        growthEffects: [],
    },
    {
        name: 'Bold',
        fixedEffects: [{ id: 'bold-phys-resist', label: 'Phys Resist', valueText: '-10' }],
        growthEffects: [
            { id: 'bold-stam', label: 'Max Stam', amountPerStep: 1, levelsPerStep: 2, unit: 'flat', sign: '+' },
        ],
    },
    {
        name: 'Brave',
        fixedEffects: [{ id: 'brave-stam', label: 'Max Stam', valueText: '-10%' }],
        growthEffects: [
            { id: 'brave-melee', label: 'Melee', amountPerStep: 1, levelsPerStep: 2, unit: 'flat', sign: '+' },
        ],
    },
    {
        name: 'Careful',
        fixedEffects: [{ id: 'careful-speed', label: 'Speed', valueText: '-10%' }],
        growthEffects: [
            { id: 'careful-threat', label: 'Threat', amountPerStep: 1, levelsPerStep: 1, unit: '%', sign: '-' },
        ],
    },
    {
        name: 'Hardy',
        fixedEffects: [{ id: 'hardy-food', label: 'Food Use', valueText: '+10%' }],
        growthEffects: [
            { id: 'hardy-hp', label: 'Max HP', amountPerStep: 1, levelsPerStep: 2, unit: 'flat', sign: '+' },
            { id: 'hardy-stam-regen', label: 'Stam Regen', amountPerStep: 1, levelsPerStep: 1, unit: '%', sign: '+' },
        ],
    },
    {
        name: 'Resolute',
        fixedEffects: [{ id: 'resolute-hp', label: 'Max HP', valueText: '-10%' }],
        growthEffects: [
            { id: 'resolute-stam-regen', label: 'Stam Regen', amountPerStep: 1, levelsPerStep: 1, unit: '%', sign: '+' },
            { id: 'resolute-fert-recovery', label: 'Fert Recovery', amountPerStep: 1, levelsPerStep: 1, unit: '%', sign: '+' },
        ],
    },
    {
        name: 'Stout',
        fixedEffects: [{ id: 'stout-threat', label: 'Threat', valueText: '+10%' }],
        growthEffects: [
            { id: 'stout-weight', label: 'Weight', amountPerStep: 1, levelsPerStep: 1, unit: 'kg', sign: '+' },
        ],
    },
    {
        name: 'Savage',
        fixedEffects: [{ id: 'savage-hp-regen', label: 'HP Regen', valueText: '-50%' }],
        growthEffects: [
            { id: 'savage-leech-chance', label: 'Leech Chance', amountPerStep: 1, levelsPerStep: 1, unit: '%', sign: '' },
            { id: 'savage-damage-leeched', label: 'Damage Leeched', amountPerStep: 1, levelsPerStep: 2, unit: '%', sign: '' },
        ],
    },
    {
        name: 'Timid',
        fixedEffects: [{ id: 'timid-melee', label: 'Melee', valueText: '-10%' }],
        growthEffects: [
            { id: 'timid-speed', label: 'Speed', amountPerStep: 1, levelsPerStep: 1, unit: 'flat', sign: '+' },
        ],
    },
    {
        name: 'Unstable',
        fixedEffects: [{ id: 'unstable-fert-recovery', label: 'Fert Recovery', valueText: '-50%' }],
        growthEffects: [
            { id: 'unstable-geno', label: 'Geno Mutation', amountPerStep: 1, levelsPerStep: 2, unit: '%', sign: '+' },
            { id: 'unstable-pheno', label: 'Pheno Mutation', amountPerStep: 1, levelsPerStep: 2, unit: '%', sign: '+' },
        ],
    },
    {
        name: 'Wild',
        fixedEffects: [{ id: 'wild-upkeep', label: 'Water/Food Use', valueText: '+5%' }],
        growthEffects: [
            { id: 'wild-bleed', label: 'Bleed Chance', amountPerStep: 1, levelsPerStep: 5, unit: '%', sign: '' },
        ],
    },
];

export const BLOODLINES_PER_COLUMN = 6;

export function calculateBloodlineGrowthValue(effect: BloodlineGrowthEffect, creatureLevel: number): number {
    const safeLevel = Math.max(0, Math.floor(creatureLevel));
    return Math.floor(safeLevel / effect.levelsPerStep) * effect.amountPerStep;
}

export function formatBloodlineGrowthValue(effect: BloodlineGrowthEffect, value: number): string {
    const sign = effect.sign ?? '+';
    const prefix = sign && value !== 0 ? sign : '';
    const suffix = effect.unit === '%' ? '%' : effect.unit === 'kg' ? 'kg' : '';
    return `${prefix}${value}${suffix}`;
}
