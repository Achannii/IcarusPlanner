import { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Radio,
    RadioGroup,
    TextField,
    Typography,
    FormControlLabel,
} from '@mui/material';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import PushPinIcon from '@mui/icons-material/PushPin';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import CloseIcon from '@mui/icons-material/Close';
import {
    deleteSavedBuild,
    findSavedBuildByName,
    getSavedBuilds,
    saveBuild,
    togglePinnedSavedBuild,
    type SaveScope,
    type SavedBuild,
} from '../utils/saveSystem.ts';
import {
    buildShareUrl,
    calculatePointsSpent,
    isVersionMismatch,
} from '../utils/exportImport';
import { DEFAULT_CHARACTER_LEVEL } from '../data/points.ts';

interface SavedBuildsPanelProps {
    talentPoints: Record<string, Record<string, number>>;
    characterLevel: number;
    selectedBonusTalents: Record<string, boolean>;
    setTalentPoints: (val: Record<string, Record<string, number>>) => void;
    setTalentPointsSpent: (val: Record<string, number>) => void;
    setCharacterLevel: (val: number) => void;
    setSelectedBonusTalents: (val: Record<string, boolean>) => void;
    snackbar: {
        setMessage: (msg: string) => void;
        setOpen: (open: boolean) => void;
    };
    saveDialogOpen: boolean;
    setSaveDialogOpen: (val: boolean) => void;
}

function getLoadScopeText(scope: SaveScope): string {
    switch (scope) {
        case 'player':
            return 'This will replace your current player-only talent allocations.';
        case 'creatures':
            return 'This will replace your current creature-only talent allocations.';
        case 'full':
            return 'This will replace your current player and creature talent allocations.';
        default:
            return 'This will replace your current talent allocations.';
    }
}

export default function SavedBuildsPanel({
    talentPoints,
    characterLevel,
    selectedBonusTalents,
    setTalentPoints,
    setTalentPointsSpent,
    setCharacterLevel,
    setSelectedBonusTalents,
    snackbar,
    saveDialogOpen,
    setSaveDialogOpen,
}: SavedBuildsPanelProps) {
    const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>([]);
    const [buildName, setBuildName] = useState('');
    const [saveScope, setSaveScope] = useState<SaveScope>('full');
    const [overwriteTarget, setOverwriteTarget] = useState<SavedBuild | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SavedBuild | null>(null);
    const [loadTarget, setLoadTarget] = useState<SavedBuild | null>(null);

    const refreshBuilds = () => {
        setSavedBuilds(getSavedBuilds());
    };

    useEffect(() => {
        refreshBuilds();
    }, []);

    useEffect(() => {
        if (!saveDialogOpen) {
            setBuildName('');
            setSaveScope('full');
            setOverwriteTarget(null);
        }
    }, [saveDialogOpen]);

    const hasAnyCurrentPoints = useMemo(() => {
        return Object.values(talentPoints).some(tree =>
            Object.values(tree).some(points => points > 0)
        );
    }, [talentPoints]);

    const sortedBuilds = useMemo(() => {
        return [...savedBuilds].sort((a, b) => {
            const aPinned = a.pinned ?? false;
            const bPinned = b.pinned ?? false;

            if (aPinned !== bPinned) {
                return aPinned ? -1 : 1;
            }

            return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        });
    }, [savedBuilds]);

    const normalizedTypedName = buildName.trim().toLowerCase();
    const isStillOverwriting =
        !!overwriteTarget &&
        overwriteTarget.name.trim().toLowerCase() === normalizedTypedName;

    const handleSave = () => {
        const trimmedName = buildName.trim();

        if (!trimmedName) {
            snackbar.setMessage('Enter a name for the saved build.');
            snackbar.setOpen(true);
            return;
        }

        if (!hasAnyCurrentPoints) {
            snackbar.setMessage('There are no points allocated to save.');
            snackbar.setOpen(true);
            return;
        }

        const existingByName = findSavedBuildByName(trimmedName);

        if (existingByName && !isStillOverwriting) {
            setOverwriteTarget(existingByName);
            return;
        }

        try {
            const saved = saveBuild({
                name: trimmedName,
                scope: saveScope,
                talentPoints,
                characterLevel,
                selectedBonusTalents,
                overwriteId: isStillOverwriting ? overwriteTarget?.id : undefined,
            });

            refreshBuilds();
            setSaveDialogOpen(false);
            setOverwriteTarget(null);

            snackbar.setMessage(
                isStillOverwriting
                    ? `Overwrote saved build: ${saved.name}`
                    : `Saved build: ${saved.name}`
            );
            snackbar.setOpen(true);
        } catch (error) {
            snackbar.setMessage(
                error instanceof Error ? error.message : 'Unable to save build.'
            );
            snackbar.setOpen(true);
        }
    };

    const handleShareClick = async (build: SavedBuild) => {
        try {
            const url = buildShareUrl(
                build.data.talentPoints,
                'full',
                {
                    characterLevel: build.data.characterLevel ?? DEFAULT_CHARACTER_LEVEL,
                    selectedBonusTalents: build.data.selectedBonusTalents ?? {},
                }
            );

            await navigator.clipboard.writeText(url);
            snackbar.setMessage(`Share URL copied for: ${build.name}`);
            snackbar.setOpen(true);
        } catch {
            snackbar.setMessage('Unable to copy share URL.');
            snackbar.setOpen(true);
        }
    };

    const handleLoadConfirmed = () => {
        if (!loadTarget) return;

        const importedPoints = loadTarget.data.talentPoints;
        setTalentPoints(importedPoints);
        setTalentPointsSpent(calculatePointsSpent(importedPoints));
        setCharacterLevel(loadTarget.data.characterLevel ?? DEFAULT_CHARACTER_LEVEL);
        setSelectedBonusTalents(loadTarget.data.selectedBonusTalents ?? {});

        if (isVersionMismatch(loadTarget.data.gameVersion)) {
            snackbar.setMessage("Version mismatch. We'll match what we can, but review your Trees.");
        } else {
            snackbar.setMessage(`Loaded build: ${loadTarget.name}`);
        }
        snackbar.setOpen(true);

        setLoadTarget(null);
    };

    const handleDeleteConfirmed = () => {
        if (!deleteTarget) return;

        deleteSavedBuild(deleteTarget.id);
        refreshBuilds();
        snackbar.setMessage(`Deleted saved build: ${deleteTarget.name}`);
        snackbar.setOpen(true);
        setDeleteTarget(null);
    };

    const handleTogglePinned = (build: SavedBuild) => {
        try {
            const updated = togglePinnedSavedBuild(build.id);
            refreshBuilds();
            snackbar.setMessage(
                updated.pinned
                    ? `Pinned saved build: ${updated.name}`
                    : `Unpinned saved build: ${updated.name}`
            );
            snackbar.setOpen(true);
        } catch (error) {
            snackbar.setMessage(
                error instanceof Error ? error.message : 'Unable to update pin.'
            );
            snackbar.setOpen(true);
        }
    };

    return (
        <>
            <Box
                sx={{
                    width: 250,
                    minWidth: 250,
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
                    <Typography
                        variant="subtitle1"
                        sx={{ color: 'warning.main', fontWeight: 700, lineHeight: 1 }}
                    >
                        Save Build Manager
                    </Typography>
                </Box>

                <Box
                    sx={{
                        px: 1.0,
                        py: 0.75,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.45,
                        flex: 1,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                    }}
                >
                    {sortedBuilds.length === 0 ? (
                        <Box
                            sx={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px dashed #333',
                                borderRadius: 1,
                                backgroundColor: '#151515',
                                px: 1,
                            }}
                        >
                            <Typography
                                variant="body2"
                                sx={{ color: '#777', fontSize: '0.8rem', textAlign: 'center' }}
                            >
                                No saved builds yet.
                            </Typography>
                        </Box>
                    ) : (
                        sortedBuilds.map((build) => {
                            const isPinned = build.pinned ?? false;

                            return (
                                <Box
                                    key={build.id}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 0.45,
                                        px: 0.65,
                                        py: 0.28,
                                        border: '1px solid #333',
                                        borderRadius: 1,
                                        backgroundColor: '#151515',
                                        minHeight: 31,
                                    }}
                                >
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography
                                            variant="body2"
                                            title={build.name}
                                            sx={{
                                                color: '#d6d6d6',
                                                fontSize: '0.76rem',
                                                lineHeight: 1,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            {build.name}
                                        </Typography>
                                    </Box>

                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.15,
                                            flexShrink: 0,
                                        }}
                                    >
                                        <IconButton
                                            size="small"
                                            onClick={() => handleTogglePinned(build)}
                                            sx={{
                                                width: 22,
                                                height: 22,
                                                color: isPinned ? '#d86a6a' : '#8a8a8a',
                                                p: 0.2,
                                            }}
                                            title={isPinned ? 'Unpin build' : 'Pin build'}
                                        >
                                            {isPinned ? (
                                                <PushPinIcon fontSize="inherit" />
                                            ) : (
                                                <PushPinOutlinedIcon fontSize="inherit" />
                                            )}
                                        </IconButton>

                                        <IconButton
                                            size="small"
                                            onClick={() => setLoadTarget(build)}
                                            sx={{
                                                width: 22,
                                                height: 22,
                                                color: 'info.main',
                                                p: 0.2,
                                            }}
                                            title="Load build"
                                        >
                                            <FolderOpenOutlinedIcon fontSize="inherit" />
                                        </IconButton>

                                        <IconButton
                                            size="small"
                                            onClick={() => void handleShareClick(build)}
                                            sx={{
                                                width: 22,
                                                height: 22,
                                                color: 'info.main',
                                                p: 0.2,
                                            }}
                                            title="Share build"
                                        >
                                            <ShareOutlinedIcon fontSize="inherit" />
                                        </IconButton>

                                        <IconButton
                                            size="small"
                                            onClick={() => setDeleteTarget(build)}
                                            sx={{
                                                width: 22,
                                                height: 22,
                                                color: '#d86a6a',
                                                p: 0.2,
                                            }}
                                            title="Delete build"
                                        >
                                            <CloseIcon fontSize="inherit" />
                                        </IconButton>
                                    </Box>
                                </Box>
                            );
                        })
                    )}
                </Box>
            </Box>

            <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Save Name and Scope</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.4, mt: 1 }}>
                        <TextField
                            label="Build Name"
                            value={buildName}
                            onChange={(e) => {
                                setBuildName(e.target.value);
                                setOverwriteTarget(null);
                            }}
                            fullWidth
                        />

                        <RadioGroup
                            row
                            value={saveScope}
                            onChange={(e) => setSaveScope(e.target.value as SaveScope)}
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: 1,
                                mt: 0.25,
                            }}
                        >
                            <FormControlLabel
                                value="player"
                                control={<Radio size="small" />}
                                label="Player Only"
                                sx={{
                                    m: 0,
                                    '.MuiFormControlLabel-label': {
                                        fontSize: '0.8rem',
                                        color: 'warning.main',
                                        fontWeight: 500,
                                    },
                                }}
                            />

                            <FormControlLabel
                                value="creatures"
                                control={<Radio size="small" />}
                                label="Creatures Only"
                                sx={{
                                    m: 0,
                                    '.MuiFormControlLabel-label': {
                                        fontSize: '0.8rem',
                                        color: 'warning.main',
                                        fontWeight: 500,
                                    },
                                }}
                            />

                            <FormControlLabel
                                value="full"
                                control={<Radio size="small" />}
                                label="Player and Creatures"
                                sx={{
                                    m: 0,
                                    '.MuiFormControlLabel-label': {
                                        fontSize: '0.8rem',
                                        color: 'warning.main',
                                        fontWeight: 600,
                                    },
                                }}
                            />
                        </RadioGroup>

                        {isStillOverwriting && (
                            <Box
                                sx={{
                                    border: '1px solid #4b3c15',
                                    borderRadius: 1,
                                    backgroundColor: '#2c2410',
                                    px: 1.1,
                                    py: 0.9,
                                }}
                            >
                                <Typography variant="body2" sx={{ color: '#ffcf6a' }}>
                                    A build named "{overwriteTarget.name}" already exists. Saving now will overwrite it.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">
                        {isStillOverwriting ? 'Overwrite' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={!!loadTarget} onClose={() => setLoadTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Load Saved Build?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        {loadTarget ? `Load "${loadTarget.name}"?` : ''}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        {loadTarget ? getLoadScopeText(loadTarget.scope) : ''}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLoadTarget(null)}>Cancel</Button>
                    <Button onClick={handleLoadConfirmed} variant="contained">
                        Load
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Delete Saved Build?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        {deleteTarget
                            ? `Delete "${deleteTarget.name}"? This cannot be undone.`
                            : ''}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
                    <Button onClick={handleDeleteConfirmed} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}