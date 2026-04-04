import { Button } from "@mui/material";
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ConfirmDialog from "./confirmDialog";

interface ResetButtonsProps {
    onResetAll: () => void;
    confirmResetAllOpen: boolean;
    setConfirmResetAllOpen: (val: boolean) => void;
}

const CYAN_COLOR = 'info.main';

const buildButtonSx = {
    minWidth: 0,
    height: 32,
    px: 1,
    fontSize: '0.75rem',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    color: CYAN_COLOR,
    borderColor: CYAN_COLOR,
    '& .MuiButton-startIcon': {
        marginRight: '4px',
        '& > *:nth-of-type(1)': {
            fontSize: '1rem',
        },
    },
    '&:hover': {
        borderColor: CYAN_COLOR,
        backgroundColor: 'rgba(142, 203, 255, 0.08)',
    }
};

export default function ResetButtons({
    onResetAll,
    confirmResetAllOpen,
    setConfirmResetAllOpen
}: ResetButtonsProps) {
    return (
        <>
            <Button
                variant="outlined"
                size="small"
                startIcon={<RestartAltIcon />}
                onClick={() => setConfirmResetAllOpen(true)}
                sx={buildButtonSx}
            >
                Reset All
            </Button>

            <ConfirmDialog
                open={confirmResetAllOpen}
                title="Reset All Trees?"
                message="Are you sure you want to reset all talent trees? This cannot be undone."
                onConfirm={() => {
                    onResetAll();
                    setConfirmResetAllOpen(false);
                }}
                onCancel={() => setConfirmResetAllOpen(false)}
            />
        </>
    );
}