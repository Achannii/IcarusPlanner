import { useEffect, useMemo, useRef, useState } from 'react';
import { computeGuidanceState, GuidanceState } from './utils/guidance.ts';
import { Categories, talentTreeMap, Trees } from "./data/talentTreeMap.ts";
import {
    Alert,
    Box,
    Snackbar,
    Typography,
    Button,
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import RankProgressBar from "./components/talentTree/rankProgressBar.tsx";
import PointTotals from './components/pointTotals';
import BonusPanel, { BONUS_TALENT_OPTIONS, type BonusTalentSelections } from './components/bonusPanel.tsx';
import SavedBuildsPanel from './components/savedBuildsPanel.tsx';
import EffectsPanel from './components/effectsPanel.tsx';
import {
    clampCharacterLevel,
    DEFAULT_CHARACTER_LEVEL,
    getGeneralCap,
    getPoolForTree,
    getSoloCap,
    isPoolPerTreeCap,
    pointPools,
} from "./data/points.ts";
import InfoDialog from './components/infoDialog.tsx';
import {
    buildShareUrl,
    calculatePointsSpent,
    cleanSelectedBonusTalents,
    cleanTalentPoints,
    importFromUrlSearch,
    isVersionMismatch
} from './utils/exportImport';
import './talentTree.css';
import { TalentTree } from "./components/talentTree/talentTree.tsx";
import ResetButtons from "./components/resetButtons.tsx";
import ImportExportButtons from "./components/importExportButtons.tsx";
import CategoryRibbon from "./components/categoryRibbon.tsx";
import ConfirmDialog from "./components/confirmDialog.tsx";
import CreatureBloodlineOverlay from "./components/creatureBloodlineOverlay.tsx";
import WhatsNewDialog from "./components/whatsNewDialog.tsx";
import '@fontsource/barlow';
import '@fontsource/tomorrow';
import { getPointsSpentInPool, getPointsSpentInTree } from "./utils/pointsSpent.ts";

const FLATTENED_CATEGORY_TREES: Partial<Record<Categories, (keyof typeof Trees)[]>> = {
    [Categories.Survival]: ['Resources', 'Hunting', 'Cooking'],
    [Categories.Adventure]: ['Exploration', 'Husbandry', 'Genetics', 'Fishing'],
    [Categories.Habitation]: ['Repairing', 'Tools', 'Building'],
    [Categories.Combat]: ['Bows', 'Spears', 'Blades', 'Firearms'],
};

const FLATTENED_CATEGORIES = new Set<Categories>([
    Categories.Survival,
    Categories.Adventure,
    Categories.Habitation,
    Categories.Combat,
]);

const CREATURE_CATEGORIES = new Set<Categories>([
    Categories.Mounts,
    Categories.Pets,
    Categories.Livestock,
]);

const RESPONSIVE_DESIGN_WIDTH = 2400;
const MIN_APP_SCALE = 0.5;

function getResponsiveAppScale(): number {
    if (typeof window === 'undefined') {
        return 1;
    }

    return Math.min(1, Math.max(MIN_APP_SCALE, window.innerWidth / RESPONSIVE_DESIGN_WIDTH));
}

function getTreeGridColumns(selectedCategory: Categories | null) {
    switch (selectedCategory) {
        case Categories.Survival:
        case Categories.Habitation:
            return 'repeat(3, minmax(0, 550px))';
        case Categories.Adventure:
        case Categories.Combat:
            return 'repeat(4, minmax(0, 550px))';
        default:
            return 'max-content';
    }
}

function isTreeInCategory(treeKey: keyof typeof Trees | null, category: Categories | null) {
    if (!treeKey || !category) return false;
    return Trees[treeKey]?.category === category;
}

function getTreeBackgroundPath(treeKey: keyof typeof Trees): string | null {
    const category = Trees[treeKey]?.category;

    // Creature trees
    if (category === Categories.Mounts) {
        return `/images/backgrounds/creatures/mounts/${treeKey}.webp`;
    }

    if (category === Categories.Pets) {
        return `/images/backgrounds/creatures/pets/${treeKey}.webp`;
    }

    if (category === Categories.Livestock) {
        return `/images/backgrounds/creatures/livestock/${treeKey}.webp`;
    }

    // Player trees (existing behavior)
    return `/images/backgrounds/${treeKey.toLowerCase()}.webp`;
}

function getBonusTalentTotal(selectedBonuses: BonusTalentSelections): number {
    return BONUS_TALENT_OPTIONS.reduce((total, option) => {
        if (option.disabled || !selectedBonuses[option.key]) {
            return total;
        }

        return total + option.points;
    }, 0);
}

function createPlannerStateFingerprint(
    talentPoints: Record<string, Record<string, number>>,
    characterLevel: number,
    selectedBonusTalents: BonusTalentSelections,
): string {
    const sortedTalentPoints = Object.fromEntries(
        Object.entries(cleanTalentPoints(talentPoints))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([treeKey, treeTalents]) => [
                treeKey,
                Object.fromEntries(
                    Object.entries(treeTalents).sort(([left], [right]) => left.localeCompare(right))
                ),
            ])
    );
    const sortedBonusTalents = Object.fromEntries(
        Object.entries(cleanSelectedBonusTalents(selectedBonusTalents))
            .sort(([left], [right]) => left.localeCompare(right))
    );

    return JSON.stringify({
        talentPoints: sortedTalentPoints,
        characterLevel,
        selectedBonusTalents: sortedBonusTalents,
    });
}

export default function TalentTreeApp() {
    const [appScale, setAppScale] = useState(getResponsiveAppScale);
    const [selectedCategory, setSelectedCategory] = useState<Categories | null>(Categories.Survival);
    const [selectedTree, setSelectedTree] = useState<keyof typeof Trees | null>(null);
    const [talentPoints, setTalentPoints] = useState<Record<string, Record<string, number>>>({});
    const [talentPointsSpent, setTalentPointsSpent] = useState<Record<string, number>>({});
    const [characterLevel, setCharacterLevel] = useState(DEFAULT_CHARACTER_LEVEL);
    const [selectedBonusTalents, setSelectedBonusTalents] = useState<BonusTalentSelections>({});
    const [includeSoloEffects, setIncludeSoloEffects] = useState(true);
    const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
    const [guidanceState, setGuidanceState] = useState<GuidanceState | null>(null);
    const [isGuidanceMessage, setIsGuidanceMessage] = useState(false);
    const [confirmResetAllOpen, setConfirmResetAllOpen] = useState(false);
    const [treeToReset, setTreeToReset] = useState<keyof typeof Trees | null>(null);
    const [infoOpen, setInfoOpen] = useState(false);
    const [whatsNewRequestToken, setWhatsNewRequestToken] = useState(0);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [importText, setImportText] = useState('');
    const [exportText, setExportText] = useState('');
    const [blockingTalents, setBlockingTalents] = useState<Set<string>>(new Set());
    const [activeSavedBuild, setActiveSavedBuild] = useState<{
        id: string;
        fingerprint: string;
    } | null>(null);

    useEffect(() => {
        const updateAppScale = () => setAppScale(getResponsiveAppScale());

        window.addEventListener('resize', updateAppScale);
        return () => window.removeEventListener('resize', updateAppScale);
    }, []);
    const hasImportedRef = useRef(false);

    const bonusTalents = useMemo(
        () => getBonusTalentTotal(selectedBonusTalents),
        [selectedBonusTalents]
    );

    const generalCap = getGeneralCap(characterLevel, bonusTalents);
    const soloCap = getSoloCap(characterLevel);
    const currentStateFingerprint = useMemo(
        () => createPlannerStateFingerprint(talentPoints, characterLevel, selectedBonusTalents),
        [talentPoints, characterLevel, selectedBonusTalents]
    );
    const isActiveSavedBuildModified =
        !!activeSavedBuild && activeSavedBuild.fingerprint !== currentStateFingerprint;

    const activateSavedBuild = (
        id: string,
        buildTalentPoints: Record<string, Record<string, number>>,
        buildCharacterLevel: number,
        buildBonusTalents: BonusTalentSelections,
    ) => {
        setActiveSavedBuild({
            id,
            fingerprint: createPlannerStateFingerprint(
                buildTalentPoints,
                buildCharacterLevel,
                buildBonusTalents,
            ),
        });
    };

    useEffect(() => {
        (window as any).setBlockingTalents = setBlockingTalents;
        return () => {
            delete (window as any).setBlockingTalents;
        };
    }, []);

    const clearGuidance = () => {
        setGuidanceState(null);
        setIsGuidanceMessage(false);
    };

    useEffect(() => {
        const imported = importFromUrlSearch(window.location.search);
        if (imported) {
            if (isVersionMismatch(imported.gameVersion)) {
                setSnackbarMessage("Version mismatch. We'll match what we can, but review your Trees.");
            }

            setTalentPoints(imported.talentPoints);
            setTalentPointsSpent(calculatePointsSpent(imported.talentPoints));
            setCharacterLevel(clampCharacterLevel(imported.characterLevel ?? DEFAULT_CHARACTER_LEVEL));
            setSelectedBonusTalents(imported.selectedBonusTalents ?? {});
        }

        hasImportedRef.current = true;
    }, []);

    useEffect(() => {
        if (!hasImportedRef.current) return;

        const hasPoints = Object.values(talentPoints).some(tree =>
            Object.values(tree).some(points => points > 0)
        );
        const hasBonuses = Object.values(selectedBonusTalents).some(Boolean);
        const hasNonDefaultLevel = characterLevel !== DEFAULT_CHARACTER_LEVEL;

        if (hasPoints || hasBonuses || hasNonDefaultLevel) {
            const newUrl = buildShareUrl(
                talentPoints,
                'full',
                {
                    characterLevel,
                    selectedBonusTalents,
                }
            );
            window.history.replaceState({}, '', newUrl);
        } else {
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [talentPoints, characterLevel, selectedBonusTalents]);

    useEffect(() => {
        if (!selectedCategory) {
            setSelectedCategory(Categories.Survival);
            setSelectedTree(null);
            return;
        }

        if (FLATTENED_CATEGORIES.has(selectedCategory)) {
            setSelectedTree(null);
            return;
        }

        if (selectedCategory === Categories.Solo) {
            setSelectedTree('Solo');
            return;
        }

        if (CREATURE_CATEGORIES.has(selectedCategory) && !isTreeInCategory(selectedTree, selectedCategory)) {
            setSelectedTree(null);
        }
    }, [selectedCategory, selectedTree]);

    const handleResetTree = (treeKey: keyof typeof Trees) => {
        const treeData = talentTreeMap[treeKey];
        if (!treeData) return;

        const talentsInTree = treeData.talents;

        setTalentPoints(prev => {
            if (!prev?.[treeKey]) return prev;

            const updated = { ...prev };
            const updatedTree = { ...(updated[treeKey] || {}) };

            for (const talent of talentsInTree) {
                delete updatedTree[talent.name];
            }

            updated[treeKey] = updatedTree;
            return updated;
        });

        setTalentPointsSpent(prev => ({
            ...prev,
            [treeKey]: 0,
        }));

        setSnackbarMessage(`Reset all points from the ${Trees[treeKey].name} tree.`);
    };

    const handleLockedTalentClick = (treeKey: keyof typeof Trees, talentName: string) => {
        const treeData = talentTreeMap[treeKey];
        if (!treeData) return;

        const nextGuidanceState = computeGuidanceState(
            treeKey,
            treeData.talents,
            treeData.fullTracks,
            talentPoints,
            talentName,
        );

        if (!nextGuidanceState) {
            setGuidanceState(null);
            return;
        }

        setGuidanceState(nextGuidanceState);
        setIsGuidanceMessage(true);
        setSnackbarMessage(`Talent requires ${nextGuidanceState.unlockCost} more point${nextGuidanceState.unlockCost === 1 ? '' : 's'} to unlock.`);
    };

    const visibleTrees = useMemo(() => {
        if (!selectedCategory) return [];

        if (FLATTENED_CATEGORIES.has(selectedCategory)) {
            return (FLATTENED_CATEGORY_TREES[selectedCategory] || []).filter(tree => !!talentTreeMap[tree]);
        }

        if (selectedCategory === Categories.Solo) {
            return ['Solo'];
        }

        if (CREATURE_CATEGORIES.has(selectedCategory)) {
            return selectedTree && Trees[selectedTree]?.category === selectedCategory ? [selectedTree] : [];
        }

        return selectedTree ? [selectedTree] : [];
    }, [selectedCategory, selectedTree]);

    return (
        <Box
            sx={{
                minHeight: '100vh',
                position: 'relative',
                backgroundColor: '#0b0b0b',
                '&::before': {
                    content: '""',
                    position: 'fixed',
                    inset: 0,
                    zIndex: 0,
                    pointerEvents: 'none',
                    backgroundImage: 'url(/images/splash.webp)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                },
            }}
        >
            <Box
                sx={{
                    position: 'relative',
                    zIndex: 1,
                    width: '100%',
                    zoom: appScale,
                    minWidth: 0,
                    display: 'flex',
                    justifyContent: 'center',
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        maxWidth: 2680,
                        minWidth: 0,
                        display: 'grid',
                        gridTemplateColumns: '650px minmax(760px, 1fr) 650px',
                        gap: 2.25,
                        alignItems: 'start',
                    }}
                >
                    {/* Top row */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1,
                            minWidth: 0,
                        }}
                    >
                        <BonusPanel
                            selectedBonuses={selectedBonusTalents}
                            onToggleBonus={(key, checked) => {
                                setSelectedBonusTalents(prev => {
                                    if (checked) {
                                        return { ...prev, [key]: true };
                                    }

                                    const next = { ...prev };
                                    delete next[key];
                                    return next;
                                });
                            }}
                            onResetBonuses={() => {
                                setSelectedBonusTalents({});
                                setSnackbarMessage('Bonus talents have been reset.');
            
                            }}
                            totalBonusTalents={bonusTalents}
                        />

                        <SavedBuildsPanel
                            talentPoints={talentPoints}
                            characterLevel={characterLevel}
                            selectedBonusTalents={selectedBonusTalents}
                            setTalentPoints={setTalentPoints}
                            setTalentPointsSpent={setTalentPointsSpent}
                            setCharacterLevel={setCharacterLevel}
                            setSelectedBonusTalents={setSelectedBonusTalents}
                            snackbar={{ setMessage: setSnackbarMessage, setOpen: () => {} }}
                            saveDialogOpen={saveDialogOpen}
                            setSaveDialogOpen={setSaveDialogOpen}
                            activeBuildId={activeSavedBuild?.id ?? null}
                            activeBuildModified={isActiveSavedBuildModified}
                            onBuildLoaded={activateSavedBuild}
                            onBuildSaved={(id) => {
                                setActiveSavedBuild({ id, fingerprint: currentStateFingerprint });
                            }}
                            onBuildDeleted={(id) => {
                                setActiveSavedBuild(prev => prev?.id === id ? null : prev);
                            }}
                        />
                    </Box>

                    <Box
                        sx={{
                            width: '100%',
                            minWidth: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1.15,
                            backgroundColor: '#1e1e1e',
                            border: '1px solid #2e2e2e',
                            borderRadius: 2,
                            px: 2,
                            py: 1.5,
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1.5,
                                flexWrap: 'nowrap',
                                width: 'max-content',
                                minWidth: 'max-content',
                                overflowX: 'auto',
                            }}
                        >
                            <ResetButtons
                                onResetAll={() => {
                                    setTalentPoints({});
                                    setTalentPointsSpent({});
                                    setCharacterLevel(DEFAULT_CHARACTER_LEVEL);
                                    setActiveSavedBuild(null);
                                    clearGuidance();
                                    setSnackbarMessage("All points have been reset.");
                                }}
                                confirmResetAllOpen={confirmResetAllOpen}
                                setConfirmResetAllOpen={setConfirmResetAllOpen}
                            />

                            <ImportExportButtons
                                talentPoints={talentPoints}
                                characterLevel={characterLevel}
                                selectedBonusTalents={selectedBonusTalents}
                                setTalentPoints={setTalentPoints}
                                setTalentPointsSpent={setTalentPointsSpent}
                                setCharacterLevel={setCharacterLevel}
                                setSelectedBonusTalents={setSelectedBonusTalents}
                                snackbar={{ setMessage: setSnackbarMessage, setOpen: () => {} }}
                                importDialogOpen={importDialogOpen}
                                setImportDialogOpen={setImportDialogOpen}
                                exportDialogOpen={exportDialogOpen}
                                setExportDialogOpen={setExportDialogOpen}
                                importText={importText}
                                setImportText={setImportText}
                                exportText={exportText}
                                setExportText={setExportText}
                                onOpenSaveDialog={() => setSaveDialogOpen(true)}
                                onImportComplete={() => setActiveSavedBuild(null)}
                            />
                        </Box>

                        <CategoryRibbon
                            selectedCategory={selectedCategory}
                            selectedTree={selectedTree}
                            setSelectedCategory={setSelectedCategory}
                            setSelectedTree={setSelectedTree}
                        />

                        <Box
                            sx={{
                                width: '100%',
                                display: 'grid',
                                gridTemplateColumns: '1fr auto auto auto 1fr',
                                alignItems: 'center',
                                gap: 2,
                                mt: 0.25,
                            }}
                        >
                            <Button
                                variant="text"
                                size="small"
                                onClick={() => setInfoOpen(true)}
                                sx={{
                                    justifySelf: 'start',
                                    minWidth: 0,
                                    px: 0.5,
                                    color: 'error.main',
                                    textTransform: 'none',
                                    fontSize: '0.76rem',
                                    fontWeight: 600,
                                    '&:hover': {
                                        color: 'error.light',
                                        backgroundColor: 'transparent',
                                        textDecoration: 'underline',
                                    },
                                }}
                            >
                                About
                            </Button>
                            <Button
                                component="a"
                                href="https://icarus.wiki.gg/"
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="outlined"
                                size="small"
                                sx={{
                                    justifySelf: 'end',
                                    minWidth: 110,
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    color: '#d0d0d0',
                                    borderColor: '#555',
                                    '&:hover': {
                                        borderColor: 'warning.main',
                                        color: 'warning.main',
                                    },
                                }}
                            >
                                Official Wiki
                            </Button>

                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    lineHeight: 1,
                                    px: 1.5,
                                    userSelect: 'none',
                                }}
                            >
                                <Typography
                                    sx={{
                                        color: '#d6d6d6',
                                        fontFamily: '"Tomorrow", sans-serif',
                                        fontSize: '1.65rem',
                                        fontWeight: 700,
                                        letterSpacing: '0.22em',
                                        lineHeight: 1,
                                        textShadow: '0 1px 3px rgba(0,0,0,0.85)',
                                    }}
                                >
                                    ICARUS
                                </Typography>
                                <Typography
                                    sx={{
                                        mt: 0.35,
                                        color: 'warning.main',
                                        fontFamily: '"Barlow", sans-serif',
                                        fontSize: '0.62rem',
                                        fontWeight: 700,
                                        letterSpacing: '0.18em',
                                        lineHeight: 1,
                                        textTransform: 'uppercase',
                                        textShadow: '0 1px 2px rgba(0,0,0,0.85)',
                                    }}
                                >
                                    Dangerous Horizons
                                </Typography>
                            </Box>

                            <Button
                                component="a"
                                href="https://discord.com/invite/surviveicarus"
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="outlined"
                                size="small"
                                sx={{
                                    justifySelf: 'start',
                                    minWidth: 110,
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    color: '#d0d0d0',
                                    borderColor: '#555',
                                    '&:hover': {
                                        borderColor: 'warning.main',
                                        color: 'warning.main',
                                    },
                                }}
                            >
                                Official Discord
                            </Button>

                            <Button
                                component="a"
                                href="https://github.com/Achannii/IcarusPlanner/issues"
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="text"
                                size="small"
                                sx={{
                                    justifySelf: 'end',
                                    minWidth: 0,
                                    px: 0.5,
                                    color: 'error.main',
                                    textTransform: 'none',
                                    fontSize: '0.76rem',
                                    fontWeight: 600,
                                    '&:hover': {
                                        color: 'error.light',
                                        backgroundColor: 'transparent',
                                        textDecoration: 'underline',
                                    },
                                }}
                            >
                                Report
                            </Button>
                        </Box>
                    </Box>

                    <EffectsPanel
                        allTalents={talentTreeMap}
                        talentPoints={talentPoints}
                        selectedCategory={selectedCategory}
                        selectedTree={selectedTree}
                        includeSolo={includeSoloEffects}
                        onToggleIncludeSolo={setIncludeSoloEffects}
                    />

                    {/* Full-width tree section */}
                    <Box
                        sx={{
                            gridColumn: '1 / 4',
                            width: '100%',
                            minWidth: 0,
                            mt: 0.7,
                        }}
                    >
                        {/* Sticky cards, centered to middle-column width */}
                        <Box
                            sx={{
                                position: 'sticky',
                                top: 8,
                                zIndex: 30,
                                width: '100%',
                                display: 'grid',
                                gridTemplateColumns: '650px minmax(760px, 1fr) 650px',
                                gap: 2.25,
                                alignItems: 'start',
                                pt: 0.15,
                                pb: 0.45,
                                background: 'transparent',   // 👈 important
                                backdropFilter: 'none',      // 👈 remove blur completely
                                boxSizing: 'border-box',
                            }}
                        >
                            <Box />
                            <Box sx={{ display: 'flex', justifyContent: 'center', minWidth: 0 }}>
                                <PointTotals
                                    talentPoints={talentPoints}
                                    generalCap={generalCap}
                                    soloCap={soloCap}
                                    selectedTree={selectedTree}
                                    characterLevel={characterLevel}
                                    onCharacterLevelChange={(nextLevel) => {
                                        setCharacterLevel(clampCharacterLevel(nextLevel));
                                    }}
                                />
                            </Box>
                            <Box />
                        </Box>

                        {visibleTrees.length > 0 && (
                            <Box
                                sx={{
                                    width: '100%',
                                    pb: 1,
                                    mt: -0.15,
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: getTreeGridColumns(selectedCategory),
                                        gap: 2,
                                        justifyContent: 'center',
                                        alignItems: 'start',
                                        minWidth: 'max-content',
                                        width: '100%',
                                        mx: 'auto',
                                    }}
                                >
                                    {visibleTrees.map(treeKey => {
                                        const treeCategory = Trees[treeKey].category;
                                        const isCreatureTree = CREATURE_CATEGORIES.has(treeCategory);
                                        const isPlayerTree = !isCreatureTree;
                                        const isStandardizedPlayerPanel = isPlayerTree && treeKey !== 'Solo';
										const pointsSpentInCurrentTree = talentPointsSpent[treeKey] || 0;
										const isPetOrLivestock =
  										  treeCategory === Categories.Pets ||
  										  treeCategory === Categories.Livestock;
                                        const isCompactCreaturePanel = isPetOrLivestock;
                                        const hasNarrowCreatureTree = treeKey === 'Pig';
                                        const isSoloTree = treeKey === 'Solo';
                                        const backgroundPath = getTreeBackgroundPath(treeKey);

                                        const backgroundSize = isSoloTree ? '100% 400%' : 'cover';
                                        const backgroundPosition = isSoloTree ? 'top center' : 'center';
                                        const backgroundOpacity = isSoloTree ? 0.6 : 0.5;
                                        const backgroundOverlay = isSoloTree
                                            ? 'linear-gradient(180deg, rgba(8,8,8,0.08) 0%, rgba(8,8,8,0.22) 42%, rgba(8,8,8,0.50) 100%)'
                                            : 'linear-gradient(180deg, rgba(8,8,8,0.22) 0%, rgba(8,8,8,0.38) 40%, rgba(8,8,8,0.55) 100%)';

                                        const treePanel = (
                                            <Box
                                                sx={{
                                                    position: 'relative',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'stretch',
                                                    border: '1px solid #2e2e2e',
                                                    borderRadius: 2,
                                                    backgroundColor: '#1c1c1c',
                                                    overflow: 'hidden',
                                                    width: isStandardizedPlayerPanel
                                                        ? '100%'
                                                        : isCompactCreaturePanel
                                                            ? hasNarrowCreatureTree ? 632 : 'max-content'
                                                        : isPetOrLivestock
                                                            ? 635
                                                            : 'max-content',

                                                    maxWidth: isStandardizedPlayerPanel
                                                        ? 550
                                                        : isCompactCreaturePanel
                                                            ? hasNarrowCreatureTree ? 632 : 'none'
                                                        : isPetOrLivestock
                                                            ? 635
                                                            : 'none',

                                                    minHeight: isStandardizedPlayerPanel
                                                        ? 1000
                                                        : isCompactCreaturePanel
                                                            ? 'auto'
                                                        : isPetOrLivestock
                                                            ? 825
                                                            : 'auto',

                                                    maxHeight: isStandardizedPlayerPanel
                                                        ? 1000
                                                        : isCompactCreaturePanel
                                                            ? 'none'
                                                        : isPetOrLivestock
                                                            ? 825
                                                            : 'none',
                                                    boxSizing: 'border-box'
                                                }}
                                            >
                                                {backgroundPath && (
                                                    <>
                                                        <Box
                                                            sx={{
                                                                position: 'absolute',
                                                                inset: 0,
                                                                backgroundImage: `url(${backgroundPath})`,
                                                                backgroundSize,
                                                                backgroundPosition,
                                                                backgroundRepeat: 'no-repeat',
                                                                opacity: backgroundOpacity,
                                                                pointerEvents: 'none',
                                                                zIndex: 0
                                                            }}
                                                        />
                                                        <Box
                                                            sx={{
                                                                position: 'absolute',
                                                                inset: 0,
                                                                background: backgroundOverlay,
                                                                pointerEvents: 'none',
                                                                zIndex: 0
                                                            }}
                                                        />
                                                    </>
                                                )}

                                                <Box
                                                    sx={{
                                                        position: 'relative',
                                                        zIndex: 1,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'stretch',
                                                        px: 1.5,
                                                        py: 1.25,
                                                        height: '100%',
                                                        boxSizing: 'border-box'
                                                    }}
                                                >
                                                    {isPlayerTree ? (
                                                        <>
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    justifyContent: 'center',
                                                                    mb: 1
                                                                }}
                                                            >
                                                                <Button
                                                                    variant="outlined"
                                                                    color="info"
                                                                    size="small"
                                                                    startIcon={<RestartAltIcon />}
                                                                    onClick={() => setTreeToReset(treeKey)}
                                                                    sx={{ minWidth: 140 }}
                                                                >
                                                                    Reset Tree
                                                                </Button>
                                                            </Box>

                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    alignItems: 'center',
                                                                    mb: 0
                                                                }}
                                                            >
                                                                <Box
                                                                    sx={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        px: 2,
                                                                        py: 0.5,
                                                                        minHeight: 28,
                                                                        border: '1px solid #555',
                                                                        borderRadius: '4px 4px 0 0',
                                                                        borderBottom: 'none',
                                                                        backgroundColor: '#3a3a3a',
                                                                        zIndex: 1
                                                                    }}
                                                                >
                                                                    <Typography
                                                                        variant="subtitle2"
                                                                        sx={{
                                                                            color: '#ddd',
                                                                            fontWeight: 600,
                                                                            lineHeight: 1,
                                                                            textAlign: 'center',
                                                                            letterSpacing: '0.04em'
                                                                        }}
                                                                    >
                                                                        {Trees[treeKey].name}
                                                                        {isStandardizedPlayerPanel &&
                                                                            ` — ${pointsSpentInCurrentTree} ${pointsSpentInCurrentTree === 1 ? 'pt' : 'pts'}`}
                                                                    </Typography>
                                                                </Box>

                                                                <Box
                                                                    sx={{
                                                                        width: '100%',
                                                                        mt: 0
                                                                    }}
                                                                >
                                                                    <RankProgressBar pointsSpent={talentPointsSpent[treeKey] || 0} />
                                                                </Box>
                                                            </Box>
                                                        </>
                                                    ) : (
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                mb: 1,
                                                                gap: 1.5,
                                                                minHeight: 36
                                                            }}
                                                        >
                                                            <Typography
                                                                variant="subtitle1"
                                                                sx={{
                                                                    color: '#ccc',
                                                                    fontWeight: 600,
                                                                    lineHeight: 1.1
                                                                }}
                                                            >
                                                                {Trees[treeKey].name}
                                                            </Typography>

                                                            <Button
                                                                variant="outlined"
                                                                color="info"
                                                                size="small"
                                                                startIcon={<RestartAltIcon />}
                                                                onClick={() => setTreeToReset(treeKey)}
                                                                sx={{ flexShrink: 0 }}
                                                            >
                                                                Reset Tree
                                                            </Button>
                                                        </Box>
                                                    )}

                                                    <Box sx={{ overflow: 'visible', mt: 0.75 }}>
                                                        <TalentTree
                                                            treeKey={treeKey}
                                                            talents={talentTreeMap[treeKey]!.talents}
                                                            fullTracks={talentTreeMap[treeKey]!.fullTracks}
                                                            pointsSpent={talentPointsSpent[treeKey] || 0}
                                                            talentPoints={talentPoints}
                                                            generalCap={generalCap}
                                                            guidanceState={guidanceState}
                                                            onLockedTalentClick={(talent) => handleLockedTalentClick(treeKey, talent.name)}
                                                            onClearGuidance={clearGuidance}
                                                            onShowError={setSnackbarMessage}
                                                            onRankChange={(talentName, delta) => {
                                                                const talent = talentTreeMap[treeKey]!.talents.find(t => t.name === talentName);
                                                                if (!talent) return;

                                                                const pool = getPoolForTree(talent.tree);
                                                                if (!pool) return;

                                                                const perTreePoints = isPoolPerTreeCap(pool);
                                                                const poolCap =
                                                                    pool === 'General'
                                                                        ? generalCap
                                                                        : pool === 'Solo'
                                                                            ? soloCap
                                                                            : pointPools[pool].cap;

                                                                const totalPointsInPool = getPointsSpentInPool(pool, talentPoints);
                                                                const spentInTree = getPointsSpentInTree(treeKey, talentPoints);

                                                                const isSpending = delta > 0;
                                                                const currentTalentPoints = talentPoints[treeKey]?.[talentName] || 0;
                                                                const maxPoints = talent.benefits.length;

                                                                if (isSpending) {
                                                                    if (currentTalentPoints >= maxPoints) return;

                                                                    if (perTreePoints) {
                                                                        if (spentInTree >= poolCap) {
                                                                            setSnackbarMessage(`You’ve reached the ${treeKey} tree cap of ${poolCap} points.`);
                                                                            return;
                                                                        }
                                                                    } else {
                                                                        if (totalPointsInPool >= poolCap) {
                                                                            setSnackbarMessage(`You’ve reached the ${pool} pool cap of ${poolCap} points.`);
                                                                            return;
                                                                        }
                                                                    }
                                                                }

                                                                clearGuidance();

                                                                setTalentPoints(prev => {
                                                                    const treePoints = prev[treeKey] || {};
                                                                    const current = prev[treeKey]?.[talentName] || 0;
                                                                    const next = Math.max(0, current + delta);

                                                                    return {
                                                                        ...prev,
                                                                        [treeKey]: {
                                                                            ...treePoints,
                                                                            [talentName]: next
                                                                        }
                                                                    };
                                                                });

                                                                setTalentPointsSpent(prev => {
                                                                    const current = prev[treeKey] || 0;
                                                                    const next = Math.max(0, current + delta);
                                                                    return { ...prev, [treeKey]: next };
                                                                });
                                                            }}
                                                            blockingTalents={blockingTalents}
                                                            setBlockingTalents={setBlockingTalents}
                                                        />
                                                    </Box>
                                                </Box>
                                            </Box>
                                        );

                                        if (!isCreatureTree) {
                                            return (
                                                <Box key={treeKey}>
                                                    {treePanel}
                                                </Box>
                                            );
                                        }

                                        const creatureLevel = talentPointsSpent[treeKey] || 0;

                                        return (
                                            <Box
                                                key={treeKey}
                                                sx={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '200px max-content 200px',
                                                    gap: 1.5,
                                                    alignItems: 'start',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <CreatureBloodlineOverlay creatureLevel={creatureLevel} side="left" />
                                                {treePanel}
                                                <CreatureBloodlineOverlay creatureLevel={creatureLevel} side="right" />
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>

                <ConfirmDialog
                    open={!!treeToReset}
                    title="Reset This Tree?"
                    message={treeToReset ? `Are you sure you want to reset the ${Trees[treeToReset].name} tree?` : ''}
                    onConfirm={() => {
                        if (treeToReset) {
                            handleResetTree(treeToReset);
                            clearGuidance();
                        }
                        setTreeToReset(null);
                    }}
                    onCancel={() => setTreeToReset(null)}
                />

                <Snackbar
                    open={!!snackbarMessage}
                    autoHideDuration={4000}
                    onClose={() => {
                        setSnackbarMessage(null);
                        setIsGuidanceMessage(false);
                        setBlockingTalents(new Set());
                    }}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert
                        severity="warning"
                        variant="filled"
                        onClose={() => {
                            setSnackbarMessage(null);
                            setIsGuidanceMessage(false);
                        }}
                        sx={{
                            fontWeight: 600,
                            letterSpacing: '0.2px',
                            '& .MuiAlert-message': {
                                fontWeight: 600,
                                letterSpacing: '0.2px',
                            },
                        }}
                    >
                        <Box>
                            <Typography
                                component="div"
                                sx={{
                                    fontWeight: 600,
                                    letterSpacing: '0.2px',
                                }}
                            >
                                {snackbarMessage}
                            </Typography>
                            {isGuidanceMessage && (
                                <Typography
                                    component="div"
                                    variant="caption"
                                    sx={{
                                        mt: 0.35,
                                        fontWeight: 400,
                                        letterSpacing: 0,
                                        opacity: 0.9,
                                    }}
                                >
                                    Colored paths represent alternative routes and are not ranked by recommendation.
                                </Typography>
                            )}
                        </Box>
                    </Alert>
                </Snackbar>

                <InfoDialog
                    open={infoOpen}
                    onClose={() => setInfoOpen(false)}
                    onShowWhatsNew={() => {
                        setInfoOpen(false);
                        setWhatsNewRequestToken(previous => previous + 1);
                    }}
                />
                <WhatsNewDialog reopenRequestToken={whatsNewRequestToken} />
            </Box>
        </Box>
    );
}
