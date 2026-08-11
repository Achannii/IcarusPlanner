import { Dialog, DialogTitle, DialogContent, Box } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import info from '../data/info.md?raw';

export default function InfoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
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
                            a: ({ ...props }) => (
                                <a
                                    {...props}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                />
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