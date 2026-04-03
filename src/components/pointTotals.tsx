import type { ReactNode } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { pointPools, TalentPool } from '../data/points.ts';
import { getPointsSpentInPool, getPointsSpentInTree } from '../utils/pointsSpent.ts';

interface PointTotalsProps {
    talentPoints: Record<string, Record<string, number>>;
    generalCap: number;
    soloCap: number;
    selectedTree: string | null;
    characterLevel: number;
    onCharacterLevelChange: (nextLevel: number) => void;
}

const TAME_POOLS: TalentPool[] = ['Mounts', 'Pets', 'Livestock'];
const CARD_WIDTH = 176;
const CARD_HEIGHT = 76;

function StatCard({
    title,
    value,
    children,
}: {
    title: string;
    value?: string;
    children?: ReactNode;
}) {
    return (
        <Box
            sx={{
                width: CARD_WIDTH,
                height: CARD_HEIGHT,
                px: 1.25,
                py: 1,
                border: '1px solid #444',
                borderRadius: 1,
                backgroundColor: '#1c1c1c',
                color: '#ccc',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                textAlign: 'center',
                boxSizing: 'border-box',
            }}
        >
            <Typography variant="caption" sx={{ color: '#999', mb: 0.35 }}>
                {title}
            </Typography>

            {children ? (
                children
            ) : (
                <Typography
                    variant="body1"
                    sx={{
                        fontWeight: 'bold',
                        color: 'warning.main',
                        fontSize: '1.15rem',
                    }}
                >
                    {value}
                </Typography>
            )}
        </Box>
    );
}

export default function PointTotals({
    talentPoints,
    generalCap,
    soloCap,
    selectedTree,
    characterLevel,
    onCharacterLevelChange,
}: PointTotalsProps) {
    const generalSpent = getPointsSpentInPool('General', talentPoints);
    const soloSpent = getPointsSpentInPool('Solo', talentPoints);

    const selectedTamePool =
        selectedTree
            ? TAME_POOLS.find(pool => pointPools[pool].trees.includes(selectedTree as any)) ?? null
            : null;

    const selectedTameCap = selectedTamePool ? pointPools[selectedTamePool].cap : 0;
    const selectedTameSpent =
        selectedTree && selectedTamePool
            ? getPointsSpentInTree(selectedTree, talentPoints)
            : 0;

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'stretch',
                justifyContent: 'center',
                gap: 1.5,
                flexWrap: 'wrap',
                width: '100%',
            }}
        >
            <StatCard title="General Points">
                <Typography
                    variant="body1"
                    sx={{
                        fontWeight: 'bold',
                        color: generalSpent > generalCap ? 'red' : 'warning.main',
                        fontSize: '1.15rem',
                    }}
                >
                    {generalSpent} / {generalCap}
                </Typography>
            </StatCard>

            <StatCard title="Solo Points">
                <Typography
                    variant="body1"
                    sx={{
                        fontWeight: 'bold',
                        color: soloSpent > soloCap ? 'red' : 'warning.main',
                        fontSize: '1.15rem',
                    }}
                >
                    {soloSpent} / {soloCap}
                </Typography>
            </StatCard>

            <StatCard title="Character Level">
                <TextField
                    value={String(characterLevel)}
                    size="small"
                    onChange={(event) => {
                        const raw = event.target.value.replace(/[^\d]/g, '');

                        if (raw === '') {
                            onCharacterLevelChange(0);
                            return;
                        }

                        const parsed = Number.parseInt(raw, 10);
                        if (Number.isNaN(parsed)) return;

                        const clamped = Math.max(0, Math.min(60, parsed));
                        onCharacterLevelChange(clamped);
                    }}
                    inputProps={{
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                        maxLength: 2,
                        style: {
                            textAlign: 'center',
                            color: 'warning.main',
                            fontWeight: 700,
                            padding: '8px 6px',
                        },
                    }}
                    sx={{
                        width: 90,
                        mx: 'auto',
                        '& .MuiOutlinedInput-root': {
                            color: 'warning.main',
                            '& fieldset': {
                                borderColor: '#555',
                            },
                            '&:hover fieldset': {
                                borderColor: '#777',
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: 'warning.main',
                            },
                        },
                    }}
                />
            </StatCard>

            <StatCard
                title="Tame Points"
                value={selectedTamePool ? `${selectedTameSpent} / ${selectedTameCap}` : '— / —'}
            />
        </Box>
    );
}