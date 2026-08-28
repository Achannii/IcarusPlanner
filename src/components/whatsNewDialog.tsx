import { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    List,
    ListItem,
    ListItemText,
    Typography,
} from '@mui/material';
import {
    CURRENT_WHATS_NEW,
    WHATS_NEW_ENABLED,
    WHATS_NEW_STORAGE_KEY,
} from '../data/whatsNew.ts';

export default function WhatsNewDialog({ reopenRequestToken = 0 }: { reopenRequestToken?: number }) {
    const [open, setOpen] = useState(false);
    const [doNotShowAgain, setDoNotShowAgain] = useState(false);

    useEffect(() => {
        if (!WHATS_NEW_ENABLED) return;

        try {
            const acknowledgedId = localStorage.getItem(WHATS_NEW_STORAGE_KEY);
            setOpen(acknowledgedId !== CURRENT_WHATS_NEW.id);
        } catch {
            setOpen(true);
        }
    }, []);

    useEffect(() => {
        if (!WHATS_NEW_ENABLED || reopenRequestToken === 0) return;

        try {
            localStorage.removeItem(WHATS_NEW_STORAGE_KEY);
        } catch {
            // The dialog can still be reopened when storage is unavailable.
        }

        setDoNotShowAgain(false);
        setOpen(true);
    }, [reopenRequestToken]);

    const handleAcknowledge = () => {
        if (doNotShowAgain) {
            try {
                localStorage.setItem(WHATS_NEW_STORAGE_KEY, CURRENT_WHATS_NEW.id);
            } catch {
                // If storage is unavailable, dismiss the dialog for this session.
            }
        }

        setOpen(false);
    };

    if (!WHATS_NEW_ENABLED) return null;

    return (
        <Dialog
            open={open}
            disableEscapeKeyDown
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle
                sx={{
                    pb: 0.75,
                    textAlign: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                }}
            >
                Icarus Planner, {CURRENT_WHATS_NEW.title}!
            </DialogTitle>

            <DialogContent>
                <Typography
                    variant="subtitle2"
                    sx={{ color: 'warning.main', fontWeight: 700 }}
                >
                    Version {CURRENT_WHATS_NEW.version}
                </Typography>

                <List disablePadding sx={{ mt: 1 }}>
                    {CURRENT_WHATS_NEW.items.map(item => (
                        <ListItem
                            key={item.lead}
                            disableGutters
                            sx={{ alignItems: 'flex-start', py: 0.45 }}
                        >
                            <Box
                                component="span"
                                sx={{ color: 'warning.main', mr: 1, lineHeight: 1.5 }}
                            >
                                •
                            </Box>
                            <ListItemText
                                primary={(
                                    <Typography variant="body2">
                                        <Box component="span" sx={{ fontWeight: 700 }}>
                                            {item.lead}
                                        </Box>{' '}
                                        {item.detail}
                                    </Typography>
                                )}
                                sx={{ my: 0 }}
                            />
                        </ListItem>
                    ))}
                </List>
            </DialogContent>

            <DialogActions
                sx={{
                    px: 3,
                    pb: 2,
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 0.5,
                }}
            >
                <Button variant="contained" onClick={handleAcknowledge} autoFocus>
                    OK
                </Button>
                <Box
                    component="label"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                >
                    <Checkbox
                        size="small"
                        checked={doNotShowAgain}
                        onChange={(event) => setDoNotShowAgain(event.target.checked)}
                    />
                    <Typography
                        component="span"
                        sx={{ fontSize: '0.8rem', lineHeight: 1.15 }}
                    >
                        Do not show this message again
                    </Typography>
                </Box>
            </DialogActions>
        </Dialog>
    );
}
