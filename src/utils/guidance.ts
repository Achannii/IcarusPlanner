import { TalentData, FullTrack } from '../constants/treeStructures.ts';
import { getGateRequirement } from '../data/ranks.ts';
import { isAutoOwnedCreatureTalent } from '../data/points.ts';
import { Trees } from '../data/talentTreeMap.ts';

export type GuidanceRouteColor = 'green' | 'yellow' | 'cyan';

export interface GuidanceRoute {
  color: GuidanceRouteColor;
  nodeNames: string[];
  trackKeys: string[];
}

export interface GuidanceState {
  treeKey: keyof typeof Trees;
  targetTalentName: string;
  unlockCost: number;
  routes: GuidanceRoute[];
}

interface RoutePlan {
  totalAddedPoints: number;
  routeNodeNames: string[];
}

interface InternalRoute extends RoutePlan {
  routeKey: string;
}

const ROUTE_COLORS: GuidanceRouteColor[] = ['green', 'yellow', 'cyan'];
const MAX_ROUTE_OPTIONS_PER_STEP = 8;

function buildTrackKey(track: FullTrack): string {
  return `${track.start}=>${track.end}`;
}

function sortNames(names: string[], talentIndexByName: Map<string, number>): string[] {
  return names.slice().sort((a, b) => {
    const aIndex = talentIndexByName.get(a) ?? Number.MAX_SAFE_INTEGER;
    const bIndex = talentIndexByName.get(b) ?? Number.MAX_SAFE_INTEGER;
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.localeCompare(b);
  });
}

function uniqueSortedNames(names: Iterable<string>, talentIndexByName: Map<string, number>): string[] {
  return sortNames(Array.from(new Set(names)), talentIndexByName);
}

function dedupeAndTrimPlans(plans: RoutePlan[], talentIndexByName: Map<string, number>): RoutePlan[] {
  const unique = new Map<string, RoutePlan>();

  for (const plan of plans) {
    const normalizedNames = uniqueSortedNames(plan.routeNodeNames, talentIndexByName);
    const routeKey = normalizedNames.join('|');
    const normalizedPlan: RoutePlan = {
      totalAddedPoints: plan.totalAddedPoints,
      routeNodeNames: normalizedNames,
    };

    const existing = unique.get(routeKey);
    if (!existing || normalizedPlan.totalAddedPoints < existing.totalAddedPoints) {
      unique.set(routeKey, normalizedPlan);
    }
  }

  return Array.from(unique.values())
    .sort((a, b) => {
      if (a.totalAddedPoints !== b.totalAddedPoints) {
        return a.totalAddedPoints - b.totalAddedPoints;
      }
      if (a.routeNodeNames.length !== b.routeNodeNames.length) {
        return a.routeNodeNames.length - b.routeNodeNames.length;
      }
      return a.routeNodeNames.join('|').localeCompare(b.routeNodeNames.join('|'));
    })
    .slice(0, MAX_ROUTE_OPTIONS_PER_STEP);
}

function combinePlanLists(
  planLists: RoutePlan[][],
  talentIndexByName: Map<string, number>,
): RoutePlan[] {
  let combined: RoutePlan[] = [{ totalAddedPoints: 0, routeNodeNames: [] }];

  for (const plans of planLists) {
    const next: RoutePlan[] = [];
    for (const base of combined) {
      for (const plan of plans) {
        next.push({
          totalAddedPoints: base.totalAddedPoints + plan.totalAddedPoints,
          routeNodeNames: [...base.routeNodeNames, ...plan.routeNodeNames],
        });
      }
    }
    combined = dedupeAndTrimPlans(next, talentIndexByName);
  }

  return combined;
}

function isStrictSubsetOf(smaller: string[], larger: string[]): boolean {
  if (smaller.length >= larger.length) return false;
  const largerSet = new Set(larger);
  return smaller.every(name => largerSet.has(name));
}

function filterDominatedRoutes(routes: InternalRoute[]): InternalRoute[] {
  return routes.filter(route => {
    return !routes.some(other => {
      if (other.routeKey === route.routeKey) return false;
      if (other.totalAddedPoints !== route.totalAddedPoints) return false;
      return isStrictSubsetOf(other.routeNodeNames, route.routeNodeNames);
    });
  });
}

export function computeGuidanceState(
  treeKey: keyof typeof Trees,
  talents: TalentData[],
  fullTracks: FullTrack[],
  talentPoints: Record<string, Record<string, number>>,
  targetTalentName: string,
): GuidanceState | null {
  const targetIndex = talents.findIndex(t => t.name === targetTalentName);
  if (targetIndex === -1) return null;

  const talentIndexByName = new Map(talents.map((talent, index) => [talent.name, index]));
  const currentSpent = getCurrentSpentPoints(treeKey, talents, talentPoints);

  if (canAccessTalentNow(treeKey, talents, talentPoints, targetIndex)) {
    return null;
  }

  const targetTalent = talents[targetIndex];
  const currentPrereqSatisfied = prerequisiteMetNow(treeKey, targetTalent.prerequisites, talentPoints);
  const gateShortfall = Math.max(0, getGateRequirement(targetTalent.rank) - currentSpent);

  if (currentPrereqSatisfied) {
    return {
      treeKey,
      targetTalentName,
      unlockCost: gateShortfall,
      routes: [],
    };
  }

  const memo = new Map<string, RoutePlan[]>();
  const clausePlans: InternalRoute[] = [];

  for (const clause of targetTalent.prerequisites) {
    const requiredNames = typeof clause === 'string' ? [clause] : clause;
    const requiredPlanLists = requiredNames.map(name =>
      buildPlansToOwnTalent(
        name,
        treeKey,
        talents,
        talentPoints,
        currentSpent,
        memo,
        talentIndexByName,
        new Set([targetTalentName]),
      ),
    );

    const combinedPlans = combinePlanLists(requiredPlanLists, talentIndexByName);

    for (const combinedPlan of combinedPlans) {
      const totalCost = Math.max(
        combinedPlan.totalAddedPoints,
        getGateRequirement(targetTalent.rank) - currentSpent,
      );

      const routeNodeNames = uniqueSortedNames(combinedPlan.routeNodeNames, talentIndexByName);
      if (!routeNodeNames.length) continue;

      clausePlans.push({
        totalAddedPoints: totalCost,
        routeNodeNames,
        routeKey: routeNodeNames.join('|'),
      });
    }
  }

  if (!clausePlans.length) {
    return {
      treeKey,
      targetTalentName,
      unlockCost: gateShortfall,
      routes: [],
    };
  }

  const cheapestCost = Math.min(...clausePlans.map(plan => plan.totalAddedPoints));

  const cheapestDistinctRoutes = Array.from(
    clausePlans
      .filter(plan => plan.totalAddedPoints === cheapestCost)
      .reduce((map, plan) => {
        const existing = map.get(plan.routeKey);
        if (!existing || plan.routeNodeNames.length < existing.routeNodeNames.length) {
          map.set(plan.routeKey, plan);
        }
        return map;
      }, new Map<string, InternalRoute>())
      .values(),
  );

  const prunedRoutes = filterDominatedRoutes(cheapestDistinctRoutes);

  const finalRoutes = prunedRoutes
    .sort((a, b) => {
      if (a.routeNodeNames.length !== b.routeNodeNames.length) {
        return a.routeNodeNames.length - b.routeNodeNames.length;
      }
      return a.routeKey.localeCompare(b.routeKey);
    })
    .slice(0, ROUTE_COLORS.length);

  const routes = finalRoutes.map((route, index) => {
    const namesWithTarget = new Set([...route.routeNodeNames, targetTalentName]);
    return {
      color: ROUTE_COLORS[index],
      nodeNames: route.routeNodeNames,
      trackKeys: fullTracks
        .filter(track => namesWithTarget.has(track.start) && namesWithTarget.has(track.end))
        .map(buildTrackKey),
    };
  });

  return {
    treeKey,
    targetTalentName,
    unlockCost: cheapestCost,
    routes,
  };
}

function buildPlansToOwnTalent(
  talentName: string,
  treeKey: keyof typeof Trees,
  talents: TalentData[],
  talentPoints: Record<string, Record<string, number>>,
  currentSpent: number,
  memo: Map<string, RoutePlan[]>,
  talentIndexByName: Map<string, number>,
  ancestry: Set<string>,
): RoutePlan[] {
  const memoKey = `${treeKey}::${talentName}`;
  const cached = memo.get(memoKey);
  if (cached) return cached;

  if (isOwnedNow(treeKey, talentName, talentPoints)) {
    const plans = [{ totalAddedPoints: 0, routeNodeNames: [talentName] }];
    memo.set(memoKey, plans);
    return plans;
  }

  const talentIndex = talentIndexByName.get(talentName);
  if (talentIndex === undefined) {
    return [];
  }

  const talent = talents[talentIndex];

  const baseClauseOptions = talent.prerequisites.length ? talent.prerequisites : [[] as string[]];
  const candidatePlans: RoutePlan[] = [];

  for (const clause of baseClauseOptions) {
    const requiredNames = Array.isArray(clause) ? clause : [clause];
    const filteredRequiredNames = requiredNames.filter(name => !ancestry.has(name));
    if (filteredRequiredNames.length !== requiredNames.length) {
      continue;
    }

    const childPlanLists = filteredRequiredNames.map(name =>
      buildPlansToOwnTalent(
        name,
        treeKey,
        talents,
        talentPoints,
        currentSpent,
        memo,
        talentIndexByName,
        new Set([...ancestry, talentName]),
      ),
    );

    const combinedChildPlans = combinePlanLists(childPlanLists, talentIndexByName);

    for (const childPlan of combinedChildPlans) {
      const spentAfterChildren = currentSpent + childPlan.totalAddedPoints;
      const gateShortfall = Math.max(0, getGateRequirement(talent.rank) - spentAfterChildren);

      candidatePlans.push({
        totalAddedPoints: childPlan.totalAddedPoints + gateShortfall + 1,
        routeNodeNames: [...childPlan.routeNodeNames, talentName],
      });
    }
  }

  const normalizedPlans = dedupeAndTrimPlans(candidatePlans, talentIndexByName);
  memo.set(memoKey, normalizedPlans);
  return normalizedPlans;
}

function getCurrentSpentPoints(
  treeKey: keyof typeof Trees,
  talents: TalentData[],
  talentPoints: Record<string, Record<string, number>>,
): number {
  const pointsInTree = talentPoints[treeKey] || {};
  return talents.reduce((sum, talent) => {
    const current = pointsInTree[talent.name] || 0;
    const base = isAutoOwnedCreatureTalent(treeKey, talent.name) ? 1 : 0;
    return sum + Math.max(0, current - base);
  }, 0);
}

function isOwnedNow(
  treeKey: keyof typeof Trees,
  talentName: string,
  talentPoints: Record<string, Record<string, number>>,
): boolean {
  return (talentPoints[treeKey]?.[talentName] || 0) > 0 || isAutoOwnedCreatureTalent(treeKey, talentName);
}

function prerequisiteMetNow(
  treeKey: keyof typeof Trees,
  prerequisites: (string | string[])[],
  talentPoints: Record<string, Record<string, number>>,
): boolean {
  if (!prerequisites.length) return true;

  return prerequisites.some(req => {
    const names = typeof req === 'string' ? [req] : req;
    return names.every(name => isOwnedNow(treeKey, name, talentPoints));
  });
}

function canAccessTalentNow(
  treeKey: keyof typeof Trees,
  talents: TalentData[],
  talentPoints: Record<string, Record<string, number>>,
  talentIndex: number,
): boolean {
  const talent = talents[talentIndex];
  if (!talent) return false;
  if (isAutoOwnedCreatureTalent(treeKey, talent.name)) return true;

  const currentSpent = getCurrentSpentPoints(treeKey, talents, talentPoints);
  const requiredPoints = getGateRequirement(talent.rank);
  const hasEnoughPoints = currentSpent >= requiredPoints;
  const hasMetPrereqs = prerequisiteMetNow(treeKey, talent.prerequisites, talentPoints);

  return hasEnoughPoints && hasMetPrereqs;
}