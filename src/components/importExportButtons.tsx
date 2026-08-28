import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField
} from '@mui/material';
import { Download, Upload, Save } from '@mui/icons-material';
import {
    buildShareUrl,
    exportToJson,
    ExportedTalentState,
    calculatePointsSpent,
} from '../utils/exportImport';
import { GAME_VERSION } from '../constants/gameVersion';
import { clampCharacterLevel, DEFAULT_CHARACTER_LEVEL } from '../data/points.ts';

interface ImportExportProps {
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
    importDialogOpen: boolean;
    setImportDialogOpen: (val: boolean) => void;
    exportDialogOpen: boolean;
    setExportDialogOpen: (val: boolean) => void;
    importText: string;
    setImportText: (text: string) => void;
    exportText: string;
    setExportText: (text: string) => void;
    onOpenSaveDialog: () => void;
    onImportComplete: () => void;
}

const ACTION_BUTTON_WIDTH = 118;
const CYAN_COLOR = 'info.main';

export default function ImportExportButtons({
    talentPoints,
    characterLevel,
    selectedBonusTalents,
    setTalentPoints,
    setTalentPointsSpent,
    setCharacterLevel,
    setSelectedBonusTalents,
    snackbar,
    importDialogOpen,
    setImportDialogOpen,
    exportDialogOpen,
    setExportDialogOpen,
    importText,
    setImportText,
    exportText,
    setExportText,
    onOpenSaveDialog,
    onImportComplete,
}: ImportExportProps) {
    const handleCopyURL = () => {
        const url = buildShareUrl(
            talentPoints,
            'full',
            {
                characterLevel,
                selectedBonusTalents,
            }
        );
        navigator.clipboard.writeText(url);
        snackbar.setMessage('Build URL copied to clipboard!');
        snackbar.setOpen(true);
    };

    const handleImport = () => {
        try {
            const parsed = JSON.parse(importText) as ExportedTalentState;
            if (!parsed.talentPoints || !parsed.gameVersion) {
                throw new Error('Invalid format');
            }

            let completedMessage;
            if (parsed.gameVersion !== GAME_VERSION) {
                completedMessage = "Version mismatch. We'll match what we can, but review your Trees.";
            } else {
                completedMessage = "Build imported successfully.";
            }

            setTalentPoints(parsed.talentPoints);
            setTalentPointsSpent(calculatePointsSpent(parsed.talentPoints));
            setCharacterLevel(clampCharacterLevel(parsed.characterLevel ?? DEFAULT_CHARACTER_LEVEL));
            setSelectedBonusTalents(parsed.selectedBonusTalents ?? {});
            onImportComplete();

            setImportDialogOpen(false);
            snackbar.setMessage(completedMessage);
            snackbar.setOpen(true);
        } catch {
            snackbar.setMessage('Invalid JSON. Please check your input.');
            snackbar.setOpen(true);
        }
    };

    const buildButtonSx = {
        minWidth: ACTION_BUTTON_WIDTH,
        px: 1.25,
        fontSize: '0.8rem',
        whiteSpace: 'nowrap',
        color: CYAN_COLOR,
        borderColor: CYAN_COLOR,
        '& .MuiButton-startIcon': {
            marginRight: '4px',
        },
        '&:hover': {
            borderColor: CYAN_COLOR,
            backgroundColor: 'rgba(142, 203, 255, 0.08)',
        }
    };

    return (
        <>
            <Box sx={{ display: 'contents' }}>
                <Button
                    variant="outlined"
                    startIcon={<Upload />}
                    onClick={() => setImportDialogOpen(true)}
                    sx={buildButtonSx}
                >
                    Import Build
                </Button>

                <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => {
                        const data = exportToJson(
                            talentPoints,
                            'full',
                            {
                                characterLevel,
                                selectedBonusTalents,
                            }
                        );
                        setExportText(data);
                        setExportDialogOpen(true);
                    }}
                    sx={buildButtonSx}
                >
                    Export Build
                </Button>

                <Button
                    variant="outlined"
                    startIcon={<Save />}
                    onClick={onOpenSaveDialog}
                    sx={buildButtonSx}
                >
                    Save Build
                </Button>

                <Button
                    variant="outlined"
                    onClick={handleCopyURL}
                    sx={buildButtonSx}
                >
                    Copy URL
                </Button>
            </Box>

            <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Export Build</DialogTitle>
                <DialogContent>
                    <TextField
                        value={exportText}
                        multiline
                        fullWidth
                        minRows={10}
                        slotProps={{ input: { readOnly: true } }}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        navigator.clipboard.writeText(exportText);
                        snackbar.setMessage('Build copied to clipboard!');
                        snackbar.setOpen(true);
                    }}>
                        Copy to Clipboard
                    </Button>
                    <Button onClick={() => setExportDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Import Build</DialogTitle>
                <DialogContent>
                    <TextField
                        value={importText}
                        onChange={e => setImportText(e.target.value)}
                        multiline
                        fullWidth
                        minRows={10}
                        placeholder="Paste your exported build JSON here..."
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleImport}>Load Build</Button>
                    <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
