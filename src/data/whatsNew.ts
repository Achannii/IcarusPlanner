export interface WhatsNewAnnouncement {
    id: string;
    version: string;
    title: string;
    items: Array<{
        lead: string;
        detail: string;
    }>;
}

export const WHATS_NEW_ENABLED = true;
export const WHATS_NEW_STORAGE_KEY = 'icarus-planner-whats-new-seen';

export const CURRENT_WHATS_NEW: WhatsNewAnnouncement = {
    id: '1.1',
    version: '1.1.0',
    title: "What's New",
    items: [
        {
            lead: 'Plan complete builds',
            detail: 'across player, Solo, Mount, Pet, and Livestock talent trees with independent point pools.',
        },
        {
            lead: 'Click locked talents',
            detail: 'to highlight valid unlock paths and see how many additional points are required.',
        },
        {
            lead: 'Review active build effects',
            detail: 'and live creature Bloodline bonuses as you allocate points.',
        },
        {
            lead: 'Save and pin builds locally,',
            detail: 'import or export build data, and share builds through compact URLs.',
        },
        {
            lead: 'Live point totals',
            detail: 'are now displayed in General talent-tree headers.',
        },
        {
            lead: 'Loaded saves now appear green',
            detail: 'when unchanged and yellow when the current build has unsaved changes.',
        },
        {
            lead: 'Responsive scaling',
            detail: 'now keeps the planner usable across ultrawide, 1080p, and mobile displays.',
        },
        {
            lead: 'Pet and Livestock panels',
            detail: 'now align with Mount and Bloodline panels, with improved in-game-inspired talent layouts.',
        },
    ],
};
