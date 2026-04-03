import {
    Box,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Stack
} from '@mui/material';
import {
    Categories,
    CREATURE_CATEGORY_OPTIONS,
    Trees,
    getCategoryIcon
} from '../data/talentTreeMap';

interface CategoryRibbonProps {
    selectedCategory: Categories | null;
    selectedTree: string | null;
    setSelectedCategory: (category: Categories) => void;
    setSelectedTree: (tree: string | null) => void;
}

type CreatureCategory = Categories.Mounts | Categories.Pets | Categories.Livestock;
type TreeKey = keyof typeof Trees;

const PLAYER_CATEGORY_ORDER: Categories[] = [
    Categories.Survival,
    Categories.Adventure,
    Categories.Habitation,
    Categories.Combat,
    Categories.Solo,
];

const CREATURE_CATEGORY_ORDER: CreatureCategory[] = [
    Categories.Mounts,
    Categories.Pets,
    Categories.Livestock,
];

const flattenedCategories = new Set<Categories>([
    Categories.Survival,
    Categories.Adventure,
    Categories.Habitation,
    Categories.Combat,
]);

const YELLOW_COLOR = 'warning.main';

export default function CategoryRibbon({
    selectedCategory,
    selectedTree,
    setSelectedCategory,
    setSelectedTree,
}: CategoryRibbonProps) {
    const handlePlayerCategoryClick = (category: Categories) => {
        setSelectedCategory(category);

        if (flattenedCategories.has(category)) {
            setSelectedTree(null);
            return;
        }

        if (category === Categories.Solo) {
            setSelectedTree('Solo');
            return;
        }

        setSelectedTree(null);
    };

    const handleCreatureChange =
        (category: CreatureCategory) =>
        (event: SelectChangeEvent<string>) => {
            const tree = event.target.value;

            if (!tree) {
                setSelectedCategory(category);
                setSelectedTree(null);
                return;
            }

            setSelectedCategory(category);
            setSelectedTree(tree);
        };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2.5, gap: 1.5 }}>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap justifyContent="center">
                {PLAYER_CATEGORY_ORDER.map(category => {
                    const isSelected = selectedCategory === category;
                    const iconSrc = getCategoryIcon(category);

                    return (
                        <Button
                            key={category}
                            variant={isSelected ? 'contained' : 'outlined'}
                            onClick={() => handlePlayerCategoryClick(category)}
                            startIcon={
                                iconSrc ? (
                                    <img
                                        src={iconSrc}
                                        alt={category}
                                        style={{
                                            width: 12,
                                            height: 12,
                                            filter: isSelected
                                                ? 'brightness(0) saturate(100%) opacity(0.78)'
                                                : 'none',
                                            transition: 'filter 120ms ease-out',
                                        }}
                                    />
                                ) : undefined
                            }
                            sx={{
                                minWidth: 108,
                                color: isSelected ? '#111' : YELLOW_COLOR,
                                borderColor: YELLOW_COLOR,
                                backgroundColor: isSelected ? YELLOW_COLOR : 'transparent',
                                '&:hover': {
                                    borderColor: YELLOW_COLOR,
                                    backgroundColor: isSelected
                                        ? YELLOW_COLOR
                                        : 'rgba(255, 186, 39, 0.08)',
                                }
                            }}
                        >
                            {category}
                        </Button>
                    );
                })}
            </Stack>

            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap justifyContent="center">
                {CREATURE_CATEGORY_ORDER.map(category => {
                    const options = CREATURE_CATEGORY_OPTIONS[category] as TreeKey[];
                    const isActive = selectedCategory === category;
                    const selectValue =
                        isActive && selectedTree && options.includes(selectedTree as TreeKey)
                            ? selectedTree
                            : '';

                    return (
                        <FormControl
                            key={category}
                            size="small"
                            sx={{
                                minWidth: 166,
                                '& .MuiInputLabel-root': {
                                    color: isActive ? YELLOW_COLOR : '#bbb',
                                },
                                '& .MuiOutlinedInput-root': {
                                    color: YELLOW_COLOR,
                                    backgroundColor: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                                    '& fieldset': {
                                        borderColor: YELLOW_COLOR,
                                    },
                                    '&:hover fieldset': {
                                        borderColor: YELLOW_COLOR,
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: YELLOW_COLOR,
                                    },
                                },
                                '& .MuiSvgIcon-root': {
                                    color: YELLOW_COLOR,
                                },
                            }}
                        >
                            <InputLabel>{category}</InputLabel>
                            <Select
                                value={selectValue}
                                label={category}
                                displayEmpty={false}
                                onChange={handleCreatureChange(category)}
                            >
                                {options.map((treeKey: TreeKey) => (
                                    <MenuItem key={treeKey} value={treeKey}>
                                        {Trees[treeKey].name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    );
                })}
            </Stack>
        </Box>
    );
}