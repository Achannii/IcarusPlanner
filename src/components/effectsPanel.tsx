import { Box, FormControlLabel, IconButton, Switch, Typography } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { Categories, Trees } from '../data/talentTreeMap.ts';
import { FullTrack, TalentData } from '../constants/treeStructures.ts';
import { normalizeBenefits } from '../utils/normalizeBenefits.ts';

interface EffectsPanelProps {
    allTalents: Partial<Record<string, { talents: TalentData[]; fullTracks: FullTrack[] }>>;
    talentPoints: Record<string, Record<string, number>>;
    selectedCategory: Categories | null;
    selectedTree: keyof typeof Trees | null;
    includeSolo: boolean;
    onToggleIncludeSolo: (value: boolean) => void;
    onOpenInfo: () => void;
}

type BucketName = 'Stats' | 'Combat' | 'Utility' | 'Flags';

type BenefitEntry = {
    desc: string;
    values: number[];
};

type DisplayEntry = {
    desc: string;
    total: number;
    displayText: string;
};

const CREATURE_CATEGORIES = new Set<Categories>([
    Categories.Mounts,
    Categories.Pets,
    Categories.Livestock,
]);

const PLAYER_TREES = new Set<keyof typeof Trees>([
    'Resources', 'Hunting', 'Cooking',
    'Exploration', 'Husbandry', 'Genetics', 'Fishing',
    'Repairing', 'Tools', 'Building',
    'Bows', 'Spears', 'Blades', 'Firearms',
]);

const BUCKET_ORDER: BucketName[] = ['Stats', 'Combat', 'Utility', 'Flags'];

function getRelevantTreeKeys(
    allTalents: Partial<Record<string, { talents: TalentData[]; fullTracks: FullTrack[] }>>,
    selectedCategory: Categories | null,
    selectedTree: keyof typeof Trees | null,
    includeSolo: boolean,
): string[] {
    if (selectedCategory && CREATURE_CATEGORIES.has(selectedCategory)) {
        return selectedTree ? [selectedTree] : [];
    }

    return Object.keys(allTalents).filter((treeKey): treeKey is keyof typeof Trees => {
        if (!(treeKey in Trees)) return false;
        if (treeKey === 'Solo') return includeSolo;
        return PLAYER_TREES.has(treeKey);
    });
}

function getBucket(category: string | undefined, desc: string): BucketName {
    const c = (category || '').toLowerCase().trim();
    const d = desc.toLowerCase().trim();

    if (c === 'flag' || c === 'flags') {
        return 'Flags';
    }

    if (c === 'combat') {
        return 'Combat';
    }

    if (c === 'stats' || c === 'stat') {
        return 'Stats';
    }

    if (c === 'utility') {
        return 'Utility';
    }

    const statsKeywords = [
        'health',
        'stamina',
        'regen',
        'regeneration',
        'movement speed',
        'move speed',
        'speed',
        'carry weight',
        'weight',
    ];

    const combatKeywords = [
        'damage',
        'critical',
        'crit',
        'melee',
        'ranged',
        'bow',
        'spear',
        'blade',
        'firearm',
        'weapon',
        'bleed',
        'poison',
        'burn',
        'buff',
        'debuff',
        'resistance',
        'armor',
        'armour',
        'defense',
        'defence',
        'attack',
    ];

    if (statsKeywords.some(keyword => c.includes(keyword) || d.includes(keyword))) {
        return 'Stats';
    }

    if (combatKeywords.some(keyword => c.includes(keyword) || d.includes(keyword))) {
        return 'Combat';
    }

    return 'Utility';
}

function formatBenefitText(desc: string, total: number): string {
    const formatted = desc.replace('{0}', Math.abs(total).toString());

    if (total < 0 && desc.startsWith('+')) {
        return formatted.replace('+', '-');
    }

    return formatted;
}

function getPanelTitle(
    isCreatureContext: boolean,
    selectedTree: keyof typeof Trees | null,
    includeSolo: boolean,
) {
    if (isCreatureContext) {
        return selectedTree ? `${Trees[selectedTree].name} Effects` : 'Creature Effects';
    }

    return includeSolo ? 'Player Effects + Solo' : 'Player Effects';
}

function getStableColumn(desc: string): 0 | 1 {
    let hash = 0;
    for (let i = 0; i < desc.length; i++) {
        hash = (hash * 31 + desc.charCodeAt(i)) >>> 0;
    }
    return (hash % 2) as 0 | 1;
}

export default function EffectsPanel({
    allTalents,
    talentPoints,
    selectedCategory,
    selectedTree,
    includeSolo,
    onToggleIncludeSolo,
    onOpenInfo,
}: EffectsPanelProps) {
    const isCreatureContext = !!selectedCategory && CREATURE_CATEGORIES.has(selectedCategory);
    const relevantTreeKeys = getRelevantTreeKeys(allTalents, selectedCategory, selectedTree, includeSolo);

    const bucketMap: Record<BucketName, BenefitEntry[]> = {
        Stats: [],
        Combat: [],
        Utility: [],
        Flags: [],
    };

    for (const treeKey of relevantTreeKeys) {
        const treeData = allTalents[treeKey];
        if (!treeData) continue;

        const pointsInTree = talentPoints[treeKey] || {};

        for (const talent of treeData.talents) {
            const spent = pointsInTree[talent.name] || 0;
            if (spent <= 0) continue;

            const normalizedBenefits = normalizeBenefits(talent.benefits ?? []);
            const activeTier = normalizedBenefits[spent - 1] ?? [];

            for (const benefit of activeTier) {
                const bucket = getBucket(benefit.category, benefit.desc);
                const existing = bucketMap[bucket].find(entry => entry.desc === benefit.desc);

                if (existing) {
                    existing.values.push(benefit.value);
                } else {
                    bucketMap[bucket].push({
                        desc: benefit.desc,
                        values: [benefit.value],
                    });
                }
            }
        }
    }

    const groupedEffects = BUCKET_ORDER.map(bucket => ({
        bucket,
        benefits: bucketMap[bucket]
            .map(({ desc, values }) => {
                const total = values.reduce((sum, value) => sum + value, 0);
                return {
                    desc,
                    total,
                    displayText: formatBenefitText(desc, total),
                };
            })
            .sort((a, b) => a.displayText.localeCompare(b.displayText)),
    }));

    const flatCreatureEffects: DisplayEntry[] = groupedEffects
        .flatMap(group => group.benefits)
        .sort((a, b) => a.displayText.localeCompare(b.displayText));

    const creatureLeftColumn = flatCreatureEffects.filter(entry => getStableColumn(entry.desc) === 0);
    const creatureRightColumn = flatCreatureEffects.filter(entry => getStableColumn(entry.desc) === 1);

    const totalEffects = isCreatureContext
        ? flatCreatureEffects.length
        : groupedEffects.reduce((sum, group) => sum + group.benefits.length, 0);

    const panelTitle = getPanelTitle(isCreatureContext, selectedTree, includeSolo);

    return (
        <Box
            sx={{
                width: 650,
                minWidth: 650,
                height: 220,
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
                    height: 40,
                    borderBottom: '1px solid #333',
                    backgroundColor: '#191919',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: isCreatureContext ? '1fr auto' : '1fr auto auto',
                        alignItems: 'center',
                        gap: 1,
                        width: '100%',
                    }}
                >
                    <Typography
                        variant="subtitle1"
                        sx={{
                            color: 'warning.main',
                            fontWeight: 700,
                            lineHeight: 1,
                            minWidth: 0,
                        }}
                    >
                        {panelTitle}
                    </Typography>

                    {!isCreatureContext && (
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={includeSolo}
                                    onChange={(_, checked) => onToggleIncludeSolo(checked)}
                                    color="warning"
                                    size="small"
                                />
                            }
                            label="Include Solo"
                            sx={{
                                m: 0,
                                '.MuiFormControlLabel-label': {
                                    color: '#ccc',
                                    fontSize: '0.84rem',
                                    fontWeight: 500,
                                },
                            }}
                        />
                    )}

                    <IconButton
                        size="small"
                        onClick={onOpenInfo}
                        sx={{
                            color: 'error.main',
                            border: '1px solid #444',
                            borderRadius: 1,
                            width: 26,
                            height: 26,
                            flexShrink: 0,
                            position: 'relative',
                            '&:hover': {
                                color: 'error.light',
                            },
                        }}
                    >
                        <FavoriteIcon fontSize="small" />
                        <Box
                            component="span"
                            sx={{
                                position: 'absolute',
                                fontSize: '0.55rem',
                                fontWeight: 700,
                                color: '#111',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -52%)',
                                lineHeight: 1,
                                pointerEvents: 'none',
                            }}
                        >
                            i
                        </Box>
                    </IconButton>
                </Box>
            </Box>

            <Box
                sx={{
                    px: 0.9,
                    py: 0.8,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    flex: 1,
                }}
            >
                {totalEffects === 0 ? (
                    <Typography variant="body2" sx={{ color: '#888', px: 0.5 }}>
                        No active effects.
                    </Typography>
                ) : isCreatureContext ? (
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                            gap: 0.9,
                            alignItems: 'start',
                        }}
                    >
                        {[creatureLeftColumn, creatureRightColumn].map((column, columnIndex) => (
                            <Box
                                key={`creature-column-${columnIndex}`}
                                sx={{
                                    border: '1px solid #333',
                                    borderRadius: 1,
                                    backgroundColor: '#151515',
                                    px: 0.95,
                                    py: 0.75,
                                    minHeight: '100%',
                                    boxSizing: 'border-box',
                                }}
                            >
                                {column.length === 0 ? (
                                    <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                                        None
                                    </Typography>
                                ) : (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.35 }}>
                                        {column.map((benefit, index) => (
                                            <Typography
                                                key={`creature-${columnIndex}-${benefit.desc}-${index}`}
                                                variant="body2"
                                                sx={{
                                                    color: '#d0d0d0',
                                                    lineHeight: 1.24,
                                                    wordBreak: 'break-word',
                                                    fontSize: '0.78rem',
                                                }}
                                            >
                                                {benefit.displayText}
                                            </Typography>
                                        ))}
                                    </Box>
                                )}
                            </Box>
                        ))}
                    </Box>
                ) : (
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                            gap: 0.75,
                        }}
                    >
                        {groupedEffects.map(group => (
                            <Box
                                key={group.bucket}
                                sx={{
                                    border: '1px solid #333',
                                    borderRadius: 1,
                                    backgroundColor: '#151515',
                                    overflow: 'hidden',
                                    minHeight: 0,
                                }}
                            >
                                <Box
                                    sx={{
                                        px: 0.85,
                                        py: 0.45,
                                        borderBottom: '1px solid #2b2b2b',
                                        backgroundColor: '#202020',
                                    }}
                                >
                                    <Typography
                                        variant="subtitle2"
                                        sx={{ color: '#b5b5b5', fontWeight: 700, lineHeight: 1.1 }}
                                    >
                                        {group.bucket}
                                    </Typography>
                                </Box>

                                <Box sx={{ px: 0.85, py: 0.55 }}>
                                    {group.benefits.length === 0 ? (
                                        <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                                            None
                                        </Typography>
                                    ) : (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                            {group.benefits.map((benefit, index) => (
                                                <Typography
                                                    key={`${group.bucket}-${benefit.desc}-${index}`}
                                                    variant="body2"
                                                    sx={{
                                                        color: '#d0d0d0',
                                                        lineHeight: 1.2,
                                                        wordBreak: 'break-word',
                                                        fontSize: '0.76rem',
                                                    }}
                                                >
                                                    {benefit.displayText}
                                                </Typography>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
}