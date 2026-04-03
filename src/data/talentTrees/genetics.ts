import { FullTrack } from "../../constants/treeStructures.ts";
import { defineTalentTree } from "../../utils/defineTalentTree.ts";

export const geneticsTree = {
    talents: defineTalentTree("Genetics", [
        {
            name: "Rapid Breeder",
            description: "Faster Tamed Creature Gestation",
            rank: 1,
            prerequisites: [],
            benefits: [
                [{ value: 5, desc: "+{0}% Tamed Creature Gestation Speed", category: "Genetics" }],
                [{ value: 10, desc: "+{0}% Tamed Creature Gestation Speed", category: "Genetics" }],
                [{ value: 25, desc: "+{0}% Tamed Creature Gestation Speed", category: "Genetics" }],
            ],
            position: [0.0, 2.0],
            imageName: "Genetics/T_Talent_Genetic_RapidBreeder",
        },
        {
            name: "Guided Growth",
            description: "Tamed Creatures will gain more Experience",
            rank: 1,
            prerequisites: ["Rapid Breeder", "Beast Whisperer"],
            benefits: [
                [{ value: 3, desc: "+{0}% Tamed Creature Experience Gained", category: "Experience" }],
                [{ value: 5, desc: "+{0}% Tamed Creature Experience Gained", category: "Experience" }],
                [{ value: 10, desc: "+{0}% Tamed Creature Experience Gained", category: "Experience" }],
            ],
            position: [1.0, 3.5],
            imageName: "Genetics/T_Talent_Genetic_GuidedGrowth",
        },
        {
            name: "Beast Whisperer",
            description: "Reduced Aggression from Wild Creatures",
            rank: 1,
            prerequisites: [],
            benefits: [
                [{ value: -3, desc: "+{0}% Animal Threat", category: "Threat" }],
                [{ value: -5, desc: "+{0}% Animal Threat", category: "Threat" }],
                [{ value: -10, desc: "+{0}% Animal Threat", category: "Threat" }],
            ],
            position: [0.0, 5.0],
            imageName: "Genetics/T_Talent_Genetic_BeastWhisperers",
        },

        {
            name: "Bounce Back",
            description: "Fertilization Recovery Speed is Increased after Fertilization or Gestation",
            rank: 1,
            prerequisites: ["Rapid Breeder"],
            benefits: [
                [{ value: 5, desc: "+{0}% Fertilization Recovery Speed", category: "Genetics" }],
                [{ value: 10, desc: "+{0}% Fertilization Recovery Speed", category: "Genetics" }],
                [{ value: 25, desc: "+{0}% Fertilization Recovery Speed", category: "Genetics" }],
            ],
            position: [1.5, 1.0],
            imageName: "Genetics/T_Talent_Genetic_BounceBack",
        },
        {
            name: "Hormones",
            description: "During Gestation, Creatures gain Increased Damage Resistance",
            rank: 1,
            prerequisites: ["Bounce Back"],
            benefits: [
                [{ value: 1, desc: "Creatures gain Increased Damage Resistance During Gestation", category: "Genetics" }],
            ],
            position: [3.0, 1.0],
            imageName: "Genetics/T_Talent_Genetic_Hormones",
        },
        {
            name: "Mother's Care",
            description: "Mothers will Provide Resistances and Buffs to Nearby Juveniles after Birth",
            rank: 1,
            prerequisites: ["Hormones"],
            benefits: [
                [{ value: 1, desc: "Mothers Provide Resistances and Buffs to Nearby Juveniles After Birth", category: "Flag" }],
            ],
            position: [5.0, 1.0],
            imageName: "Genetics/T_Talent_Genetic_MothersCare",
        },
        {
            name: "Father's Strength",
            description: "Fathers gain Strength and Speed after Fertilization",
            rank: 1,
            prerequisites: ["Mother's Care"],
            benefits: [
                [{ value: 1, desc: "Fathers gain Strength and Speed after Fertilization", category: "Flag" }],
            ],
            position: [6.5, 1.0],
            imageName: "Genetics/T_Talent_Genetic_FathersStrength",
        },

        {
            name: "Wildcard",
            description: "Increased Genotype Mutation (Creature Stats) chance during Fertilization",
            rank: 2,
            prerequisites: ["Guided Growth"],
            benefits: [
                [{ value: 2, desc: "+{0}% Genotype Mutation Chance", category: "Genetics" }],
                [{ value: 4, desc: "+{0}% Genotype Mutation Chance", category: "Genetics" }],
                [{ value: 10, desc: "+{0}% Genotype Mutation Chance", category: "Genetics" }],
            ],
            position: [3.5, 2.5],
            imageName: "Genetics/T_Talent_Genetic_WildCard",
        },
        {
            name: "Visual Anomaly",
            description: "Increased Phenotype Mutation (Color Coatings) chance During Fertilization",
            rank: 2,
            prerequisites: ["Guided Growth"],
            benefits: [
                [{ value: 2, desc: "+{0}% Phenotype Mutation Chance", category: "Genetics" }],
                [{ value: 4, desc: "+{0}% Phenotype Mutation Chance", category: "Genetics" }],
                [{ value: 10, desc: "+{0}% Phenotype Mutation Chance", category: "Genetics" }],
            ],
            position: [3.5, 4.5],
            imageName: "Genetics/T_Talent_Genetic_VisualAnomaly",
        },
        {
            name: "Genetic Volatility",
            description: "Increased Genotype Mutation (Creature Stats) chance During Fertilization",
            rank: 3,
            prerequisites: ["Wildcard"],
            benefits: [
                [{ value: 5, desc: "+{0}% Genotype Mutation Chance", category: "Genetics" }],
                [{ value: 10, desc: "+{0}% Genotype Mutation Chance", category: "Genetics" }],
                [{ value: 25, desc: "+{0}% Genotype Mutation Chance", category: "Genetics" }],
            ],
            position: [5.5, 2.5],
            imageName: "Genetics/T_Talent_Genetic_GeneticVolatility",
        },
        {
            name: "Prime Variants",
            description: "Increased Phenotype Mutation (Color Coatings) chance During Fertilization",
            rank: 3,
            prerequisites: ["Visual Anomaly"],
            benefits: [
                [{ value: 5, desc: "+{0}% Phenotype Mutation Chance", category: "Genetics" }],
                [{ value: 10, desc: "+{0}% Phenotype Mutation Chance", category: "Genetics" }],
                [{ value: 25, desc: "+{0}% Phenotype Mutation Chance", category: "Genetics" }],
            ],
            position: [5.5, 4.5],
            imageName: "Genetics/T_Talent_Genetic_PrimedVariant",
        },

        {
            name: "Ranger's Sense",
            description: "Wild Creatures when Captured or Tamed have a chance to gain better stats",
            rank: 1,
            prerequisites: ["Beast Whisperer"],
            benefits: [
                [{ value: 5, desc: "+{0}% Chance for Better Wild Creature Genetics", category: "Genetics" }],
                [{ value: 10, desc: "+{0}% Chance for Better Wild Creature Genetics", category: "Genetics" }],
                [{ value: 25, desc: "+{0}% Chance for Better Wild Creature Genetics", category: "Genetics" }],
            ],
            position: [1.5, 6.0],
            imageName: "Genetics/T_Talent_Genetic_TraitSense",
        },
        {
            name: "Hunter's Eye",
            description: "Wild Creatures when Captured or Tamed have a chance to gain rare colors",
            rank: 3,
            prerequisites: ["Ranger's Sense"],
            benefits: [
                [{ value: 5, desc: "+{0}% Chance for Rarer Wild Creature Cosmetics", category: "Genetics" }],
                [{ value: 10, desc: "+{0}% Chance for Rarer Wild Creature Cosmetics", category: "Genetics" }],
                [{ value: 25, desc: "+{0}% Chance for Rarer Wild Creature Cosmetics", category: "Genetics" }],
            ],
            position: [4.5, 6.0],
            imageName: "Genetics/T_Talent_Genetic_CoatHunter",
        },

        {
            name: "Seeing Double",
            description: "Chance for Tamed Creatures to Birth Twins",
            rank: 4,
            prerequisites: ["Father's Strength"],
            benefits: [
                [{ value: 15, desc: "+{0}% Chance for Tamed Creatures to Birth Twins", category: "Genetics" }],
                [{ value: 30, desc: "+{0}% Chance for Tamed Creatures to Birth Twins", category: "Genetics" }],
            ],
            position: [8.0, 1.0],
            imageName: "Genetics/T_Talent_Genetic_SeeingDouble",
        },
        {
            name: "Forced Evolution",
            description: "Increased Bloodline Mutation (Creature Growth Trait) chance During Fertilization",
            rank: 4,
            prerequisites: ["Genetic Volatility", "Prime Variants"],
            benefits: [
                [{ value: 10, desc: "+{0}% Bloodline Mutation Chance", category: "Genetics" }],
                [{ value: 25, desc: "+{0}% Bloodline Mutation Chance", category: "Genetics" }],
            ],
            position: [8.0, 3.5],
            imageName: "Genetics/T_Talent_Genetic_ForcedEvo",
        },
        {
            name: "Scout's Intuition",
            description: "Wild Creatures when Captured or Tamed have a chance to gain rarer Bloodlines",
            rank: 4,
            prerequisites: ["Hunter's Eye"],
            benefits: [
                [{ value: 10, desc: "+{0}% Chance for Rarer Wild Creature Bloodlines", category: "Genetics" }],
                [{ value: 25, desc: "+{0}% Chance for Rarer Wild Creature Bloodlines", category: "Genetics" }],
            ],
            position: [8.0, 6.0],
            imageName: "Companion/T_Talent_Wolf_BleedOnHit",
        },
    ]),
    fullTracks: [
        { start: "Rapid Breeder", path: [[0.0, 3.5]], end: "Guided Growth" },
        { start: "Beast Whisperer", path: [[0.0, 3.5]], end: "Guided Growth" },

        { start: "Rapid Breeder", path: [[0.0, 1.0]], end: "Bounce Back" },
        { start: "Bounce Back", end: "Hormones" },
        { start: "Hormones", end: "Mother's Care" },
        { start: "Mother's Care", end: "Father's Strength" },

        { start: "Guided Growth", path: [[3.5, 3.5]], end: "Wildcard" },
        { start: "Guided Growth", path: [[3.5, 3.5]], end: "Visual Anomaly" },
        { start: "Wildcard", end: "Genetic Volatility" },
        { start: "Visual Anomaly", end: "Prime Variants" },

        { start: "Beast Whisperer", path: [[0.0, 6.0]], end: "Ranger's Sense" },
        { start: "Ranger's Sense", end: "Hunter's Eye" },

        { start: "Father's Strength", path: [[8.0, 1.0]], end: "Seeing Double" },
        { start: "Genetic Volatility", path: [[5.5, 3.5]], end: "Forced Evolution" },
        { start: "Prime Variants", path: [[5.5, 3.5]], end: "Forced Evolution" },
        { start: "Hunter's Eye", path: [[8.0, 6.0]], end: "Scout's Intuition" },
    ] as FullTrack[],
};