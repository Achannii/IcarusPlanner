import { Box } from '@mui/material';
import { TalentData, FullTrack } from '../../constants/treeStructures.ts';
import { getPoolForTree, isAutoOwnedCreatureTalent, isPoolPerTreeCap, pointPools } from '../../data/points.ts';
import { getPointsSpentInPool, getPointsSpentInTree } from '../../utils/pointsSpent.ts';
import { getGateRequirement } from '../../data/ranks.ts';
import { TALENT_ICON_HEIGHT, TALENT_ICON_WIDTH, TREE_COLUMN_WIDTH, TREE_ROW_HEIGHT } from "../../data/dimension.ts";
import { GuidanceState } from '../../utils/guidance.ts';

interface TalentTrackProps {
    fullTracks: FullTrack[];
    talents: TalentData[];
    talentPoints: Record<string, Record<string, number>>;
    treeKey: string;
    generalCap: number;
    guidanceState?: GuidanceState | null;
}

export default function TalentTrack({ fullTracks, talents, talentPoints, treeKey, generalCap, guidanceState }: TalentTrackProps) {
    const treeTalentPoints = talentPoints[treeKey] || {};
    const pointsSpentInTree = Object.values(treeTalentPoints).reduce((sum, pts) => sum + pts, 0);

    const talentMap = Object.fromEntries(talents.map(t => [t.name, t]));
    const hasPointsIn = (name: string) => (treeTalentPoints[name] || 0) > 0 || isAutoOwnedCreatureTalent(treeKey, name);

    const isTalentReachable = (talent: TalentData): boolean => {
        if (isAutoOwnedCreatureTalent(treeKey, talent.name)) return true;

        const requiredPoints = getGateRequirement(talent.rank);
        if (pointsSpentInTree < requiredPoints) return false;

        const pool = getPoolForTree(treeKey as any);
        const perTreePoints = isPoolPerTreeCap(pool);

        if (pool) {
            const poolCap = pool === 'General' ? generalCap : pointPools[pool].cap;

            if (perTreePoints) {
                const spentInTree = getPointsSpentInTree(treeKey, talentPoints);
                if (spentInTree >= poolCap) return false;
            } else {
                const unspentPoints = poolCap - getPointsSpentInPool(pool, talentPoints);
                if (unspentPoints <= 0) return false;
            }
        }

        const prereqs = talent.prerequisites ?? [];
        return prereqs.length === 0 || prereqs.some(req => {
            if (typeof req === 'string') {
                return hasPointsIn(req);
            } else if (Array.isArray(req)) {
                return req.every(inner => hasPointsIn(inner));
            }
            return false;
        });
    };

    const allRows: number[] = talents.map(t => t.position[0]);
    const allCols: number[] = talents.map(t => t.position[1]);

    for (const track of fullTracks) {
        if (track.path && Array.isArray(track.path)) {
            for (const point of track.path) {
                if (Array.isArray(point) && point.length >= 2) {
                    allRows.push(point[0]);
                    allCols.push(point[1]);
                }
            }
        }
    }

    const minRow = Math.min(...allRows);
    const maxRow = Math.max(...allRows);
    const minCol = Math.min(...allCols);
    const maxCol = Math.max(...allCols);

    const normalizedMinRow = Math.floor(minRow);
    const normalizedMaxRow = Math.ceil(maxRow);
    const normalizedMinCol = Math.floor(minCol);
    const normalizedMaxCol = Math.ceil(maxCol);

    const horizontalGutter = TREE_COLUMN_WIDTH;
    const verticalGutter = TREE_ROW_HEIGHT * 0.25;

    const treeWidth =
        ((normalizedMaxCol - normalizedMinCol) + 1) * TREE_COLUMN_WIDTH + horizontalGutter * 2;

    const treeHeight =
        ((normalizedMaxRow - normalizedMinRow) + 1) * TREE_ROW_HEIGHT + verticalGutter * 2;

    const getTalentCenter = ([row, col]: [number, number]): [number, number] => {
        const x =
            (col - normalizedMinCol) * TREE_COLUMN_WIDTH +
            horizontalGutter +
            TALENT_ICON_WIDTH / 2;

        const y =
            (row - normalizedMinRow) * TREE_ROW_HEIGHT +
            verticalGutter +
            TALENT_ICON_HEIGHT / 2;

        return [x, y];
    };

    const drawTrack = (
        track: FullTrack,
        color: string,
        index: number,
        strokeWidth = 3,
        opacity = 1,
        animated = false
    ) => {
        const startPos = talentMap[track.start]?.position;
        const endPos = talentMap[track.end]?.position;
        if (!startPos || !endPos) return null;

        const pathCoords = track.path
            ? [startPos, ...track.path, endPos]
            : [startPos, endPos];

        const [start, ...rest] = pathCoords.map(getTalentCenter);
        const pathD = rest.reduce(
            (d, [x, y]) => `${d} L${x},${y}`,
            `M${start[0]},${start[1]}`
        );

        return (
            <path
                key={index}
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity={opacity}
                style={animated ? { animation: 'guidanceFadeIn 160ms ease-out' } : undefined}
            />
        );
    };

    const dimmed: FullTrack[] = [];
    const highlighted: FullTrack[] = [];

    for (const track of fullTracks) {
        const fromTaken = hasPointsIn(track.start);
        const toReachable = isTalentReachable(talentMap[track.end]);

        (fromTaken && toReachable ? highlighted : dimmed).push(track);
    }

    const routeColorMap: Record<string, string> = {
        green: '#35d07f',
        yellow: '#f3d24f',
        cyan: '#3fd5ff',
    };

    const guidanceTrackColorMap = new Map<string, string>();
    if (guidanceState?.treeKey === treeKey) {
        for (const route of guidanceState.routes) {
            const color = routeColorMap[route.color];
            for (const key of route.trackKeys) {
                if (!guidanceTrackColorMap.has(key)) {
                    guidanceTrackColorMap.set(key, color);
                }
            }
        }
    }

    return (
        <Box
            sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${treeWidth}px`,
                height: `${treeHeight}px`,
                zIndex: 0,
                pointerEvents: 'none',
                '@keyframes guidanceFadeIn': {
                    '0%': { opacity: 0 },
                    '100%': { opacity: 1 },
                },
            }}
        >
            <svg width={treeWidth} height={treeHeight}>
                {guidanceState?.treeKey === treeKey ? (
                    <>
                        {fullTracks.map((t, i) => drawTrack(t, '#444', i, 3, 0.7))}
                        {fullTracks.map((t, i) => {
                            const color = guidanceTrackColorMap.get(`${t.start}=>${t.end}`);
                            return color
                                ? drawTrack(t, color, i + fullTracks.length, 4, 1, true)
                                : null;
                        })}
                    </>
                ) : (
                    <>
                        {dimmed.map((t, i) => drawTrack(t, '#444', i))}
                        {highlighted.map((t, i) => drawTrack(t, '#fff', i + dimmed.length))}
                    </>
                )}
            </svg>
        </Box>
    );
}