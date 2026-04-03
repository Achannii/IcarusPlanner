import {TalentData, FullTrack} from "../constants/treeStructures.ts";
import {resourcesTree} from "./talentTrees/resources.ts";
import {huntingTree} from "./talentTrees/hunting.ts";
import {cookingTree} from "./talentTrees/cooking.ts";
import {explorationTree} from "./talentTrees/exploration.ts";
import {husbandryTree} from "./talentTrees/husbandry.ts";
import {geneticsTree } from "../data/talentTrees/genetics.ts";
import {fishingTree} from "./talentTrees/fishing.ts";
import {repairingTree} from "./talentTrees/reparing.ts";
import {toolsTree} from "./talentTrees/tools.ts";
import {buildingTree} from "./talentTrees/building.ts";
import {bowsTree} from "./talentTrees/bows.ts";
import {spearsTree} from "./talentTrees/spears.ts";
import {bladesTree} from "./talentTrees/blades.ts";
import {firearmsTree} from "./talentTrees/firearms.ts";
import {soloTree} from "./talentTrees/solo.ts";
import {boarTree} from "./petTrees/boar.ts";
import {wolfTree} from "./petTrees/wolf.ts";
import {catTree} from "./petTrees/cat.ts";
import {chickenTree} from "./petTrees/chicken.ts";
import {cowTree} from "./petTrees/cow.ts";
import {hyenaTree} from "./petTrees/hyena.ts";
import {dogTree} from "./petTrees/dog.ts";
import {roosterTree} from "./petTrees/rooster.ts";
import {sheepTree} from "./petTrees/sheep.ts";
import {snowwolfTree} from "./petTrees/snowwolf.ts";
import {gribblerTree} from "./petTrees/gribbler.ts";
import {pigTree} from "./petTrees/pig.ts";
import {skulkTree} from "./petTrees/skulk.ts";
import {storcaTree} from "./petTrees/storca.ts";
import {bullTree} from "./mountTrees/bull.ts";
import {dravenTree} from "./mountTrees/draven.ts";
import {duneraptorTree} from "./mountTrees/duneraptor.ts";
import {raptorTree} from "./mountTrees/raptor.ts";
import {slinkerTree} from "./mountTrees/slinker.ts";
import {ubisTree} from "./mountTrees/ubis.ts";
import {woollymammothTree} from "./mountTrees/woollymammoth.ts";
import {arcticmoaTree} from "./mountTrees/arcticmoa.ts";
import {bluebackTree} from "./petTrees/blueback.ts";
import {buffaloTree} from "./mountTrees/buffalo.ts";
import {horseTree} from "./mountTrees/horse.ts";
import {moaTree} from "./mountTrees/moa.ts";
import {shaggyzebraTree} from "./mountTrees/shaggyzebra.ts";
// import {stryderTree} from "./mountTrees/stryder.ts";
import {terrenusTree} from "./mountTrees/terrenus.ts";
import {tuskerTree} from "./mountTrees/tusker.ts";
import {zebraTree} from "./mountTrees/zebra.ts";

export interface TreeInfo {
    name: string
    category: Categories
}

export enum Categories {
    Survival = "Survival",
    Adventure = "Adventure",
    Habitation = "Habitation",
    Combat = "Combat",
    Solo = "Solo",
    Mounts = "Mounts",
    Pets = "Pets",
    Livestock = "Livestock",
}

export const CategoryIcons: Record<string, string> = {
    Survival: 'images/category_icons/Category-Icon_Survival.webp',
    Adventure: 'images/category_icons/Category-Icon_Adventure.webp',
    Habitation: 'images/category_icons/Category-Icon_Habitation.webp',
    Combat: 'images/category_icons/Category-Icon_Combat.webp',
    Solo: 'images/category_icons/Category-Icon_Solo.webp'
};

export function getCategoryIcon(category: string): string | undefined {
    return CategoryIcons[category];
}

export const Trees: Record<string, TreeInfo> = {
    Resources: {name: "Resources", category: Categories.Survival},
    Hunting: {name: "Hunting", category: Categories.Survival},
    Cooking: {name: "Cooking/Farming", category: Categories.Survival},
    Exploration: {name: "Exploration", category: Categories.Adventure},
    Husbandry: {name: "Husbandry", category: Categories.Adventure},
    Genetics: {name: "Genetics", category: Categories.Adventure},
    Fishing: {name: "Fishing", category: Categories.Adventure},
    Repairing: {name: "Repairing", category: Categories.Habitation},
    Tools: {name: "Tools", category: Categories.Habitation},
    Building: {name: "Building", category: Categories.Habitation},
    Bows: {name: "Bows/Crossbows", category: Categories.Combat},
    Spears: {name: "Spears", category: Categories.Combat},
    Blades: {name: "Blades", category: Categories.Combat},
    Firearms: {name: "Firearms", category: Categories.Combat},
    Solo: {name: "Solo", category: Categories.Solo},

    Arctic_Moa: {name: "Arctic Moa", category: Categories.Mounts},
// ⚠️ SPECIAL CASE:
// Blueback is livestock (non-combat),
// but intentionally uses the 50-point pool.
// See points.ts for pool assignment.
    Blueback: {name: "Blueback", category: Categories.Livestock},
    Buffalo: {name: "Buffalo", category: Categories.Mounts},
    Horse: {name: "Horse", category: Categories.Mounts},
    Moa: {name: "Moa", category: Categories.Mounts},
    Shaggy_Zebra: {name: "Shaggy Zebra", category: Categories.Mounts},
//    Stryder: {name: "Stryder", category: Categories.Mounts},
    Terrenus: {name: "Terrenus", category: Categories.Mounts},
    Tusker: {name: "Tusker", category: Categories.Mounts},
    Zebra: {name: "Zebra", category: Categories.Mounts},
    Bull: {name: "Bull", category: Categories.Mounts},
    Draven: {name: "Draven", category: Categories.Mounts},
    Dune_Raptor: {name: "Dune Raptor", category: Categories.Mounts},
    Raptor: {name: "Raptor", category: Categories.Mounts},
    Slinker: {name: "Slinker", category: Categories.Mounts},
    Ubis: {name: "Ubis", category: Categories.Mounts},
    Woolly_Mammoth: {name: "Woolly Mammoth", category: Categories.Mounts},

    Boar: {name: "Boar", category: Categories.Pets},
    Dog: {name: "Dog", category: Categories.Pets},
    Hyena: {name: "Hyena", category: Categories.Pets},
    Snow_Wolf: {name: "Snow Wolf", category: Categories.Pets},
    Wolf: {name: "Wolf", category: Categories.Pets},
    Gribbler: {name: "Gribbler", category: Categories.Pets},
    Skulk: {name: "Skulk", category: Categories.Pets},
    Storca: {name: "Storca", category: Categories.Pets},

    Cat: {name: "Cat", category: Categories.Livestock},
    Chicken: {name: "Chicken", category: Categories.Livestock},
    Cow: {name: "Cow", category: Categories.Livestock},
    Rooster: {name: "Rooster", category: Categories.Livestock},
    Sheep: {name: "Sheep", category: Categories.Livestock},
    Pig: {name: "Pig", category: Categories.Livestock},
}

export const talentTreeMap: Partial<Record<keyof typeof Trees, { talents: TalentData[]; fullTracks: FullTrack[] }>> = {
    Resources: resourcesTree,
    Hunting: huntingTree,
    Cooking: cookingTree,
    Exploration: explorationTree,
    Husbandry: husbandryTree,
    Genetics: geneticsTree,
    Fishing: fishingTree,
    Repairing: repairingTree,
    Tools: toolsTree,
    Building: buildingTree,
    Bows: bowsTree,
    Spears: spearsTree,
    Blades: bladesTree,
    Firearms: firearmsTree,
    Solo: soloTree,

    Boar: boarTree,
    Cat: catTree,
    Chicken: chickenTree,
    Cow: cowTree,
    Dog: dogTree,
    Hyena: hyenaTree,
    Rooster: roosterTree,
    Sheep: sheepTree,
    Snow_Wolf: snowwolfTree,
    Wolf: wolfTree,
    Gribbler: gribblerTree,
    Pig: pigTree,
    Skulk: skulkTree,
    Storca: storcaTree,

    Arctic_Moa: arcticmoaTree,
    Blueback: bluebackTree,
    Buffalo: buffaloTree,
    Horse: horseTree,
    Moa: moaTree,
    Shaggy_Zebra: shaggyzebraTree,
//    Stryder: stryderTree,
    Terrenus: terrenusTree,
    Tusker: tuskerTree,
    Zebra: zebraTree,
    Bull: bullTree,
    Draven: dravenTree,
    Dune_Raptor: duneraptorTree,
    Raptor: raptorTree,
    Slinker: slinkerTree,
    Ubis: ubisTree,
    Woolly_Mammoth: woollymammothTree,
};

export const CREATURE_CATEGORY_OPTIONS: Record<Categories.Mounts | Categories.Pets | Categories.Livestock, (keyof typeof Trees)[]> = {
    [Categories.Mounts]: [
        'Arctic_Moa', 'Buffalo',
        'Horse', 'Moa', 'Shaggy_Zebra',
//        'Stryder',
		'Terrenus', 'Tusker',
        'Zebra', 'Bull', 'Draven',
        'Dune_Raptor', 'Raptor', 'Slinker',
        'Ubis', 'Woolly_Mammoth'
    ],
    [Categories.Pets]: [
        'Boar', 'Dog', 'Hyena',
        'Snow_Wolf', 'Wolf', 'Gribbler',
        'Skulk', 'Storca'
    ],
    [Categories.Livestock]: [
        'Cat', 'Chicken', 'Cow',
        'Rooster', 'Sheep', 'Pig', 'Blueback'
    ]
};