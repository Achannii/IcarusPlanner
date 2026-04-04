import {
    buildShareUrl,
    calculatePointsSpent,
    exportToJson,
    exportToQueryParam,
    importFromQueryParam,
    importFromUrlSearch,
    isVersionMismatch,
} from '../exportImport';
import { GAME_VERSION } from '../../constants/gameVersion';
import { compressToEncodedURIComponent } from 'lz-string';

describe('Export/Import Utilities', () => {
    const sampleTalentPoints = {
        Resources: {
            'Lumber Yield': 1,
            'Wood Breakdown': 2,
        },
        Bows: {
            Sharpshooter: 1,
        },
        Wolf: {
            Wolf: 1,
            'Natural Ferocity': 2,
        },
    };

    const progression = {
        characterLevel: 42,
        selectedBonusTalents: {
            olympus_nightfall: true,
            great_hunt_quarrite: true,
        },
    };

    it('exports to JSON correctly', () => {
        const json = exportToJson(sampleTalentPoints, 'full', progression);
        const parsed = JSON.parse(json);

        expect(parsed).toHaveProperty('gameVersion', GAME_VERSION);
        expect(parsed).toHaveProperty('talentPoints');
        expect(parsed.talentPoints.Resources['Lumber Yield']).toBe(1);
        expect(parsed.characterLevel).toBe(42);
    });

    it('exports and imports the new compact query param without data loss', () => {
        const param = exportToQueryParam(sampleTalentPoints, 'full', progression);
        const imported = importFromQueryParam(param);

        expect(imported).not.toBeNull();
        expect(imported?.gameVersion).toBe(GAME_VERSION);
        expect(imported?.talentPoints.Resources['Wood Breakdown']).toBe(2);
        expect(imported?.talentPoints.Wolf.Wolf).toBe(1);
        expect(imported?.talentPoints.Wolf['Natural Ferocity']).toBe(2);
        expect(imported?.characterLevel).toBe(42);
        expect(imported?.selectedBonusTalents?.olympus_nightfall).toBe(true);
        expect(imported?.selectedBonusTalents?.great_hunt_quarrite).toBe(true);
    });

    it('keeps compact URLs shorter than the legacy payload format', () => {
        const legacyPayload = compressToEncodedURIComponent(
            JSON.stringify({
                gameVersion: GAME_VERSION,
                talentPoints: sampleTalentPoints,
                characterLevel: progression.characterLevel,
                selectedBonusTalents: progression.selectedBonusTalents,
            }),
        );

        const compactPayload = exportToQueryParam(sampleTalentPoints, 'full', progression);

        expect(compactPayload.length).toBeLessThan(legacyPayload.length);
    });

    it('imports legacy compressed build payloads for backward compatibility', () => {
        const legacyPayload = compressToEncodedURIComponent(
            JSON.stringify({
                gameVersion: GAME_VERSION,
                talentPoints: sampleTalentPoints,
                characterLevel: progression.characterLevel,
                selectedBonusTalents: progression.selectedBonusTalents,
            }),
        );

        const imported = importFromQueryParam(legacyPayload);

        expect(imported).not.toBeNull();
        expect(imported?.talentPoints.Bows.Sharpshooter).toBe(1);
        expect(imported?.talentPoints.Wolf.Wolf).toBe(1);
        expect(imported?.characterLevel).toBe(42);
        expect(imported?.selectedBonusTalents?.olympus_nightfall).toBe(true);
    });

    it('imports from either ?b= or legacy ?build=', () => {
        const compactParam = exportToQueryParam(sampleTalentPoints, 'full', progression);
        const compactImported = importFromUrlSearch(`?b=${compactParam}`);
        const legacyImported = importFromUrlSearch(`?build=${compactParam}`);

        expect(compactImported?.talentPoints.Resources['Lumber Yield']).toBe(1);
        expect(legacyImported?.talentPoints.Resources['Lumber Yield']).toBe(1);
    });

    it('returns null for invalid compressed data', () => {
        const result = importFromQueryParam('notAValidParam');
        expect(result).toBeNull();
    });

    it('detects version mismatches correctly', () => {
        expect(isVersionMismatch('1.0.0')).toBe(GAME_VERSION !== '1.0.0');
        expect(isVersionMismatch(GAME_VERSION)).toBe(false);
    });

    it('calculates points spent correctly', () => {
        const spent = calculatePointsSpent(sampleTalentPoints);

        expect(spent.Resources).toBe(3);
        expect(spent.Bows).toBe(1);
        expect(spent.Wolf).toBe(3);
    });

    it('builds share URLs with the new compact query parameter', () => {
        const originalWindow = globalThis.window;

        Object.defineProperty(globalThis, 'window', {
            value: {
                location: {
                    origin: 'https://www.icarusplanner.app',
                    pathname: '/',
                },
            },
            configurable: true,
        });

        try {
            const url = buildShareUrl(sampleTalentPoints, 'full', progression);
            expect(url).toContain('?b=');
            expect(url).not.toContain('?build=');
        } finally {
            Object.defineProperty(globalThis, 'window', {
                value: originalWindow,
                configurable: true,
            });
        }
    });
});