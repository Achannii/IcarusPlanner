import { Box, Typography } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    BLOODLINES,
    BLOODLINES_PER_COLUMN,
    calculateBloodlineGrowthValue,
    formatBloodlineGrowthValue,
    type BloodlineDefinition,
} from '../data/bloodlines.ts';

interface CreatureBloodlineOverlayProps {
    creatureLevel: number;
    side: 'left' | 'right';
}

type ValueMap = Record<string, number>;

const BLOODLINE_PANEL_HEIGHT = 567;

function BloodlineEntry({
    bloodline,
    values,
    changedValueIds,
}: {
    bloodline: BloodlineDefinition;
    values: ValueMap;
    changedValueIds: Set<string>;
}) {
    return (
        <Box
            sx={{
                flex: 1,
                minHeight: 0,
                px: 1,
                py: 0.7,
                borderBottom: '1px solid #303030',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                overflow: 'hidden',
                '&:last-of-type': { borderBottom: 'none' },
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 1,
                    minWidth: 0,
                }}
            >
                <Typography
                    sx={{
                        color: 'warning.main',
                        fontWeight: 700,
                        fontSize: '0.79rem',
                        lineHeight: 1.1,
                        letterSpacing: '0.03em',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                    }}
                >
                    {bloodline.name.toUpperCase()}
                </Typography>

                {bloodline.fixedEffects.length === 1 && (
                    <Typography
                        sx={{
                            color: '#9d9d9d',
                            fontSize: '0.7rem',
                            lineHeight: 1.1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            textAlign: 'right',
                        }}
                    >
                        {bloodline.fixedEffects[0].valueText} {bloodline.fixedEffects[0].label}
                    </Typography>
                )}
            </Box>

            {bloodline.fixedEffects.length > 1 && (
                <Typography
                    sx={{
                        mt: 0.22,
                        color: '#9d9d9d',
                        fontSize: '0.68rem',
                        lineHeight: 1.15,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {bloodline.fixedEffects.map(effect => `${effect.valueText} ${effect.label}`).join(' · ')}
                </Typography>
            )}

            {bloodline.growthEffects.map(effect => {
                const value = values[effect.id] ?? 0;
                const isChanged = changedValueIds.has(effect.id);

                return (
                    <Typography
                        key={effect.id}
                        sx={{
                            mt: 0.24,
                            color: '#cfcfcf',
                            fontSize: '0.72rem',
                            lineHeight: 1.15,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <Box
                            component="span"
                            sx={{
                                display: 'inline-block',
                                minWidth: 34,
                                mr: 0.45,
                                px: 0.22,
                                borderRadius: 0.5,
                                color: isChanged ? '#fff0b8' : '#e0e0e0',
                                backgroundColor: isChanged ? 'rgba(237, 173, 50, 0.22)' : 'transparent',
                                fontWeight: 700,
                                transition: 'background-color 500ms ease, color 500ms ease',
                            }}
                        >
                            {formatBloodlineGrowthValue(effect, value)}
                        </Box>
                        {effect.label}
                    </Typography>
                );
            })}
        </Box>
    );
}

function BloodlineColumn({
    bloodlines,
    values,
    changedValueIds,
}: {
    bloodlines: BloodlineDefinition[];
    values: ValueMap;
    changedValueIds: Set<string>;
}) {
    return (
        <Box
            sx={{
                width: 200,
                minWidth: 200,
                height: BLOODLINE_PANEL_HEIGHT,
                border: '1px solid #3b3b3b',
                borderRadius: 1.5,
                backgroundColor: 'rgba(24,24,24,0.96)',
                color: '#ccc',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            {bloodlines.map(bloodline => (
                <BloodlineEntry
                    key={bloodline.name}
                    bloodline={bloodline}
                    values={values}
                    changedValueIds={changedValueIds}
                />
            ))}
        </Box>
    );
}

export default function CreatureBloodlineOverlay({ creatureLevel, side }: CreatureBloodlineOverlayProps) {
    const values = useMemo<ValueMap>(() => {
        const next: ValueMap = {};

        for (const bloodline of BLOODLINES) {
            for (const effect of bloodline.growthEffects) {
                next[effect.id] = calculateBloodlineGrowthValue(effect, creatureLevel);
            }
        }

        return next;
    }, [creatureLevel]);

    const previousValuesRef = useRef<ValueMap | null>(null);
    const [changedValueIds, setChangedValueIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const previousValues = previousValuesRef.current;

        if (previousValues) {
            const changed = new Set<string>();

            for (const [id, value] of Object.entries(values)) {
                if (previousValues[id] !== value) {
                    changed.add(id);
                }
            }

            if (changed.size > 0) {
                setChangedValueIds(changed);
                const timeout = window.setTimeout(() => {
                    setChangedValueIds(new Set());
                }, 650);

                previousValuesRef.current = values;
                return () => window.clearTimeout(timeout);
            }
        }

        previousValuesRef.current = values;
        setChangedValueIds(new Set());
        return undefined;
    }, [values]);

    const bloodlines =
        side === 'left'
            ? BLOODLINES.slice(0, BLOODLINES_PER_COLUMN)
            : BLOODLINES.slice(BLOODLINES_PER_COLUMN);

    return (
        <BloodlineColumn
            bloodlines={bloodlines}
            values={values}
            changedValueIds={changedValueIds}
        />
    );
}
