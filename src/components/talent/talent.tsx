import {Box} from '@mui/material';
import TalentIcon from './talentIcon.tsx';
import RankIcon from './rankIcon.tsx';
import PointsLabel from './pointsLabel.tsx';
import TooltipWrapper from './tooltipWrapper.tsx';
import {canRefundTalent} from '../../utils/refund.ts';
import {TalentData} from "../../constants/treeStructures.ts";
import {getPoolForTree, isAutoOwnedCreatureTalent, isPoolPerTreeCap, pointPools} from '../../data/points.ts';
import {getPointsSpentInPool, getPointsSpentInTree} from '../../utils/pointsSpent.ts';
import {Trees} from "../../data/talentTreeMap.ts";
import { GuidanceState } from '../../utils/guidance.ts';

interface TalentProps {
    talent: TalentData;
    treeKey: keyof typeof Trees;
    currentPoints: number;
    maxPoints: number;
    pointsSpent: number;
    isUnlocked: boolean;
    allTalents: TalentData[];
    talentPoints: Record<string, Record<string, number>>;
    onRankChange: (talentName: string, delta: number) => void;
    onShowError: (msg: string) => void;
    blockingTalents: Set<string>;
    setBlockingTalents: (talents: Set<string>) => void;
    generalCap: number;
    guidanceState?: GuidanceState | null;
    onLockedTalentClick: (talent: TalentData) => void;
    onClearGuidance: () => void;
}

export default function Talent({
                                   talent,
                                   treeKey,
                                   currentPoints,
                                   maxPoints,
                                   pointsSpent,
                                   isUnlocked,
                                   allTalents,
                                   talentPoints,
                                   onRankChange,
                                   onShowError,
                                   blockingTalents,
                                   setBlockingTalents,
                                   generalCap,
                                   guidanceState,
                                   onLockedTalentClick,
                                   onClearGuidance,
                               }: TalentProps) {
    const isAutoOwned = isAutoOwnedCreatureTalent(treeKey, talent.name);
    const displayPoints = isAutoOwned ? Math.max(currentPoints, 1) : currentPoints;
    const displayUnlocked = isAutoOwned ? true : isUnlocked;
    const activeGuidanceForTree = guidanceState?.treeKey === treeKey ? guidanceState : null;
    const isGuidanceTarget = activeGuidanceForTree?.targetTalentName === talent.name;
    const routeColor = activeGuidanceForTree?.routes.find(route => route.nodeNames.includes(talent.name))?.color ?? null;

    const handleLeftMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        if (isAutoOwned) return;

        if (currentPoints < maxPoints && isUnlocked) {
            onClearGuidance();
            onRankChange(talent.name, 1);
            return;
        }

        if (!displayUnlocked) {
            onLockedTalentClick(talent);
            return;
        }

        onClearGuidance();
    };

    const handleRightClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (isAutoOwned) return;

        if (activeGuidanceForTree && !isGuidanceTarget) {
            onClearGuidance();
        }

        const nextPoints = currentPoints - 1;
        if (currentPoints === 0) return;

        const isOwnedInTree = (name: string) => (talentPoints[talent.tree]?.[name] || 0) > 0 || isAutoOwnedCreatureTalent(talent.tree, name);

        const isBlockedByDownstream = nextPoints === 0 && allTalents.some((other) => {
            const otherPoints = (talentPoints[other.tree]?.[other.name] || 0) > 0 || isAutoOwnedCreatureTalent(other.tree, other.name);
            if (!otherPoints) return false;

            const prerequisites = other.prerequisites || [];

            const referencesTalent = prerequisites.some(req =>
                typeof req === 'string'
                    ? req === talent.name
                    : Array.isArray(req) && req.includes(talent.name)
            );
            if (!referencesTalent) return false;

            const isClauseSatisfied = (req: string | string[]) => {
                if (typeof req === 'string') {
                    return req === talent.name
                        ? nextPoints > 0
                        : isOwnedInTree(req);
                }
                return req.every(inner =>
                    inner === talent.name
                        ? nextPoints > 0
                        : isOwnedInTree(inner)
                );
            };

            const atLeastOneClauseStillValid = prerequisites.some(isClauseSatisfied);

            return !atLeastOneClauseStillValid;
        });

        if (isBlockedByDownstream) {
            const blocking = allTalents
                .filter(other => {
                    const otherPoints = (talentPoints[other.tree]?.[other.name] || 0) > 0 || isAutoOwnedCreatureTalent(other.tree, other.name);
                    if (!otherPoints) return false;

                    const referencesTalent = other.prerequisites?.some(req =>
                        typeof req === 'string'
                            ? req === talent.name
                            : Array.isArray(req) && req.includes(talent.name)
                    );

                    if (!referencesTalent) return false;

                    const nextPoints = currentPoints - 1;
                    const isClauseSatisfied = (req: string | string[]) => {
                        if (typeof req === 'string') {
                            return req === talent.name
                                ? nextPoints > 0
                                : isOwnedInTree(req);
                        }
                        return req.every(inner =>
                            inner === talent.name
                                ? nextPoints > 0
                                : isOwnedInTree(inner)
                        );
                    };

                    const atLeastOneClauseStillValid = other.prerequisites.some(isClauseSatisfied);
                    return !atLeastOneClauseStillValid;
                })
                .map(t => t.name);

            if (typeof onShowError === 'function') {
                onShowError(`${talent.name} is a prerequisite for another talent you still own.`);
            }

            setBlockingTalents(new Set(blocking));
            setTimeout(() => setBlockingTalents(new Set()), 3000);

            return;
        }

        if (!canRefundTalent(talent, currentPoints, talentPoints, allTalents)) {
            onShowError(`You must maintain enough points in lower ranks to support your current rank.`);
            const remainingTalents = allTalents.filter(t => (talentPoints[treeKey]?.[t.name] || 0) > 0);
            const highestRank = Math.max(...remainingTalents.map(t => t.rank));

            const blockingByRankGate = allTalents
                .filter(t => t.rank === highestRank && (talentPoints[treeKey]?.[t.name] || 0) > 0)
                .map(t => t.name);

            setBlockingTalents(new Set(blockingByRankGate));
            setTimeout(() => setBlockingTalents(new Set()), 3000);

            return;
        }

        onRankChange(talent.name, -1);
    };

    const pool = getPoolForTree(talent.tree);
    const perTreePoints = isPoolPerTreeCap(pool);
    const poolCap = pool ? (pool === 'General' ? generalCap : pointPools[pool].cap) : 0;
    const unspentPoints = pool ? poolCap - getPointsSpentInPool(pool, talentPoints) : 0;
    const hasPointsToSpend = isAutoOwned
        ? true
        : perTreePoints ? getPointsSpentInTree(treeKey, talentPoints) < poolCap : unspentPoints > 0;

    return (
        <div
            key={talent.name}
            style={{ gridRow: talent.position[0] + 1, gridColumn: talent.position[1] + 1 }}
        >
            <TooltipWrapper talent={talent} currentPoints={displayPoints}>
                <Box
                    key={talent.name}
                    className={displayPoints > 0 ? 'owned' : displayUnlocked ? 'can-buy' : 'locked'}
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        position: 'relative',
                        cursor: isAutoOwned ? 'default' : 'pointer',
                        userSelect: 'none'
                    }}
                    onMouseDown={handleLeftMouseDown}
                    onContextMenu={handleRightClick}
                >
                    <PointsLabel currentPoints={displayPoints} maxPoints={maxPoints} isUnlocked={displayUnlocked} />
                    <RankIcon rank={talent.rank} pointsSpent={pointsSpent} />
                    <TalentIcon
                        talent={talent}
                        currentPoints={displayPoints}
                        isUnlocked={displayUnlocked}
                        hasPointsToSpend={hasPointsToSpend}
                        isBlocking={blockingTalents?.has(talent.name)}
                        routeColor={routeColor}
                        isGuidanceTarget={isGuidanceTarget}
                    />
                </Box>
            </TooltipWrapper>
        </div>
    );
}