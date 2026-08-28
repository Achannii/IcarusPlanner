import { Dialog, DialogTitle, DialogContent, Box, Button } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import info from '../data/info.md?raw';

export default function InfoDialog({
    open,
    onClose,
    onShowWhatsNew,
}: {
    open: boolean;
    onClose: () => void;
    onShowWhatsNew: () => void;
}) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>Info</DialogTitle>
            <DialogContent dividers>
                <Box
                    sx={{
                        '& a': {
                            color: 'warning.main',
                            textDecoration: 'none',
                            fontWeight: 600,
                        },
                        '& a:hover': {
                            color: 'warning.light',
                            textDecoration: 'underline',
                        },
                    }}
                >
                    <ReactMarkdown
                        components={{
                            a: ({ href, children, ...props }) => href === '#whats-new' ? (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={onShowWhatsNew}
                                    sx={{ ml: 1.5, py: 0, minHeight: 26, verticalAlign: 'middle' }}
                                >
                                    {children}
                                </Button>
                            ) : (
                                <a
                                    {...props}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {children}
                                </a>
                            ),
                        }}
                    >
                        {info}
                    </ReactMarkdown>
                </Box>
            </DialogContent>
        </Dialog>
    );
}
