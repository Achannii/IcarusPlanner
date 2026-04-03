import {Trees} from "../../data/talentTreeMap.ts";
import {TalentData, FullTrack} from "../../constants/treeStructures.ts";
import {prerequisiteMet} from "../../utils/refund.ts";
import {useRef} from "react";
import {Box} from "@mui/material";
import TalentTrack from "./talentTrack.tsx";
import Talent from "../talent/talent.tsx";
import {getGateRequirement} from "../../data/ranks.ts";
import {TREE_COLUMN_WIDTH, TREE_ROW_HEIGHT} from "../../data/dimension.ts";
import {isAutoOwnedCreatureTalent} from "../../data/points.ts";
import { GuidanceState } from '../../utils/guidance.ts';

export function TalentTree({
    treeKey,
    talents,
    fullTracks,
    pointsSpent,
    talentPoints,
    onRankChange,
    onShowError,
    blockingTalents,
    setBlockingTalents,
    generalCap,
    guidanceState,
    onLockedTalentClick,
    onClearGuidance,
}: {
    treeKey: keyof typeof Trees,
    talents: TalentData[],
    fullTracks: FullTrack[],
    pointsSpent: number,
    talentPoints: Record<string, Record<string, number>>,
    onRankChange: (talentName: string, rank: number) => void,
    onShowError: (message: string) => void;
    blockingTalents: Set<string>;
    setBlockingTalents: (talents: Set<string>) => void;
    generalCap: number;
    guidanceState?: GuidanceState | null;
    onLockedTalentClick: (talent: TalentData) => void;
    onClearGuidance: () => void;
}) {

    const canAccessTalent = (talent: TalentData): boolean => {
        if (isAutoOwnedCreatureTalent(treeKey, talent.name)) return true;

        const requiredPoints = getGateRequirement(talent.rank);
        const hasEnoughPoints = pointsSpent >= requiredPoints;

        const hasMetPrereqs =
            talent.prerequisites.length === 0 ||
            prerequisiteMet(talent.prerequisites, talentPoints, treeKey);

        return hasEnoughPoints && hasMetPrereqs;
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

    const gridRef = useRef<HTMLDivElement>(null);
    const tileRefs = useRef<Record<string, HTMLDivElement | null>>({});

    return (
        <Box
            sx={{
                position: 'relative',
                width: `${treeWidth}px`,
                height: `${treeHeight}px`,
                marginInline: 'auto',
                alignItems: 'center',
            }}
            ref={gridRef}
        >
            <TalentTrack
                fullTracks={fullTracks}
                talents={talents}
                talentPoints={talentPoints}
                treeKey={treeKey}
                generalCap={generalCap}
                guidanceState={guidanceState}
            />

            <div
                className="talent-tree-grid"
                style={{
                    position: 'relative',
                    width: `${treeWidth}px`,
                    height: `${treeHeight}px`,
                }}
            >
                {talents.map(talent => {
                    const currentPoints = isAutoOwnedCreatureTalent(treeKey, talent.name)
                        ? 1
                        : (talentPoints[treeKey]?.[talent.name] || 0);
                    const maxPoints = talent.benefits.length;
                    const isUnlocked = canAccessTalent(talent);

                    const normalizedLeft =
                        (talent.position[1] - normalizedMinCol) * TREE_COLUMN_WIDTH + horizontalGutter;

                    const normalizedTop =
                        (talent.position[0] - normalizedMinRow) * TREE_ROW_HEIGHT + verticalGutter;

                    return (
                        <div
                            key={talent.name}
                            ref={(el) => {
                                tileRefs.current[talent.name] = el;
                            }}
                            style={{
                                position: 'absolute',
                                top: `${normalizedTop}px`,
                                left: `${normalizedLeft}px`,
                            }}
                        >
                            <Talent
                                talent={talent}
                                treeKey={treeKey}
                                currentPoints={currentPoints}
                                maxPoints={maxPoints}
                                pointsSpent={pointsSpent}
                                isUnlocked={isUnlocked}
                                allTalents={talents}
                                talentPoints={talentPoints}
                                onRankChange={onRankChange}
                                onShowError={onShowError}
                                blockingTalents={blockingTalents}
                                setBlockingTalents={setBlockingTalents}
                                generalCap={generalCap}
                                guidanceState={guidanceState}
                                onLockedTalentClick={onLockedTalentClick}
                                onClearGuidance={onClearGuidance}
                            />
                        </div>
                    );
                })}
            </div>
        </Box>
    );
}
