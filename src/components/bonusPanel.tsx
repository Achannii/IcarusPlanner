import { Box, Button, Checkbox, Typography } from '@mui/material';

export interface BonusTalentOption {
    key: string;
    label: string;
    points: number;
    disabled?: boolean;
}

export type BonusTalentSelections = Record<string, boolean>;

const GREAT_HUNTS_ELYSIUM_ENABLED = false;
const GREAT_HUNTS_ELYSIUM_POINTS = 2;

const LEFT_COLUMN_OPTIONS: BonusTalentOption[] = [
    { key: 'olympus_nightfall', label: 'Nightfall', points: 2 },
    { key: 'styx_ironclad', label: 'Ironclad', points: 2 },
    { key: 'prometheus_null_sector', label: 'Null Sector', points: 3 },
    { key: 'elysium_reckoning', label: 'Reckoning', points: 3 },
    { key: 'elysium_trials', label: 'Trials', points: 2 },
];

const RIGHT_COLUMN_OPTIONS: BonusTalentOption[] = [
    { key: 'great_hunt_quarrite', label: 'GH : Quarrite', points: 2 },
    { key: 'great_hunt_garganutan', label: 'GH : Garganutan', points: 2 },
    { key: 'great_hunt_rimetusk', label: 'GH : Rimetusk', points: 2 },
    {
        key: 'great_hunt_elysium_soon',
        label: GREAT_HUNTS_ELYSIUM_ENABLED ? 'GH : Elysium' : 'GH : Elysium (Soon)',
        points: GREAT_HUNTS_ELYSIUM_POINTS,
        disabled: !GREAT_HUNTS_ELYSIUM_ENABLED,
    },
];

export const BONUS_TALENT_OPTIONS: BonusTalentOption[] = [
    ...LEFT_COLUMN_OPTIONS,
    ...RIGHT_COLUMN_OPTIONS,
];

interface BonusPanelProps {
    selectedBonuses: BonusTalentSelections;
    onToggleBonus: (key: string, checked: boolean) => void;
    onResetBonuses: () => void;
    totalBonusTalents: number;
}

function BonusRow({
    option,
    checked,
    onToggle,
}: {
    option: BonusTalentOption;
    checked: boolean;
    onToggle: (key: string, checked: boolean) => void;
}) {
    const isDisabled = !!option.disabled;

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.45,
                px: 0.55,
                py: 0.18,
                border: '1px solid #333',
                borderRadius: 1,
                backgroundColor: isDisabled
                    ? '#121212'
                    : checked
                        ? '#1f1a0f'
                        : '#151515',
                minHeight: 31,
                boxSizing: 'border-box',
                overflow: 'hidden',
            }}
        >
            <Checkbox
                checked={checked}
                disabled={isDisabled}
                onChange={(event) => onToggle(option.key, event.target.checked)}
                size="small"
                sx={{
                    p: 0.1,
                    flexShrink: 0,
                    color: '#888',
                    '&.Mui-checked': {
                        color: 'warning.main',
                    },
                    '&.Mui-disabled': {
                        color: '#555',
                    },
                }}
            />

            <Box
                sx={{
                    minWidth: 0,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 0.75,
                }}
            >
                <Typography
                    variant="body2"
                    sx={{
                        color: isDisabled ? '#666' : checked ? '#e3c26d' : '#c6c6c6',
                        fontSize: '0.76rem',
                        lineHeight: 1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minWidth: 0,
                        flex: 1,
                    }}
                >
                    {option.label}
                </Typography>

                <Typography
                    variant="body2"
                    sx={{
                        color: isDisabled ? '#666' : checked ? 'warning.main' : '#999',
                        fontSize: '0.75rem',
                        lineHeight: 1,
                        fontWeight: 600,
                        flexShrink: 0,
                        textAlign: 'right',
                        minWidth: 22,
                    }}
                >
                    {option.points > 0 ? `+${option.points}` : ''}
                </Typography>
            </Box>
        </Box>
    );
}

export default function BonusPanel({
    selectedBonuses,
    onToggleBonus,
    onResetBonuses,
    totalBonusTalents,
}: BonusPanelProps) {
    const headerTitle =
        totalBonusTalents > 0
            ? `+${totalBonusTalents} Bonus Talents`
            : 'Bonus Talents';

    return (
        <Box
            sx={{
                width: 400,
                minWidth: 400,
                height: 260,
                border: '1px solid #444',
                borderRadius: 1.5,
                backgroundColor: '#1c1c1c',
                color: '#ccc',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            <Box
                sx={{
                    px: 2,
                    py: 0.75,
                    borderBottom: '1px solid #333',
                    backgroundColor: '#191919',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    minHeight: 40,
                }}
            >
                <Typography
                    variant="subtitle1"
                    sx={{ color: 'warning.main', fontWeight: 700, lineHeight: 1.1 }}
                >
                    {headerTitle}
                </Typography>

                <Button
                    size="small"
                    variant="outlined"
                    color="warning"
                    onClick={onResetBonuses}
                    sx={{
                        minWidth: 64,
                        px: 1,
                        py: 0.25,
                        fontSize: '0.7rem',
                        lineHeight: 1,
                        flexShrink: 0,
                    }}
                >
                    Reset
                </Button>
            </Box>

            <Box
                sx={{
                    px: 1,
                    py: 0.6,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 0.65,
                    flex: 1,
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.45,
                        minWidth: 0,
                    }}
                >
                    {LEFT_COLUMN_OPTIONS.map((option) => (
                        <BonusRow
                            key={option.key}
                            option={option}
                            checked={!!selectedBonuses[option.key]}
                            onToggle={onToggleBonus}
                        />
                    ))}
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.45,
                        minWidth: 0,
                    }}
                >
                    {RIGHT_COLUMN_OPTIONS.map((option) => (
                        <BonusRow
                            key={option.key}
                            option={option}
                            checked={!!selectedBonuses[option.key]}
                            onToggle={onToggleBonus}
                        />
                    ))}
                </Box>
            </Box>
        </Box>
    );
}