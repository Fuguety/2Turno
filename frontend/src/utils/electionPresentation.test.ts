import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import profiles from '../data/electionProfiles.generated.json';

const require = createRequire(import.meta.url);
const presentation = require('./electionPresentation.cjs');



function uniformScores(value: number)
{
    return Object.fromEntries(presentation.axisIdentifiers.map((identifier: string) => [identifier, value]));
}



describe('Shared election profile presentation', () =>
{
    it.each([0, 16.7, 29.2, 49.5, 50, 58.3, 66.7, 75, 100])('keeps complementary percentages and marker direction at %s', score =>
    {
        const pair = presentation.percentagePair(score);
        expect(pair.displayLeft + pair.displayRight).toBe(100);
        expect(pair.left + pair.right).toBeCloseTo(100, 8);
        expect(pair.position).toBeCloseTo(100 - pair.left, 8);
    });

    it.each([undefined, NaN, Infinity, -1, 101, null, '50'])('handles invalid scores %s', score =>
    {
        expect(presentation.percentagePair(score)).toBeNull();
    });

    it.each([[100, 'left'], [65, 'centre-left'], [50, 'centre'], [35, 'centre-right'], [0, 'right']])('calculates family from scores %s', (score, family) =>
    {
        expect(presentation.classifyProfile(uniformScores(Number(score))).family).toBe(family);
    });

    it('calculates candidate classification without names and changes styling when scores change', () =>
    {
        const lula = presentation.classificationLabels(profiles.candidates[0].scores, 'pt');
        const flavio = presentation.classificationLabels(profiles.candidates[1].scores, 'en');
        expect(lula.family).toBe('centre-left');
        expect(lula.subtype).toBe('social-democracy');
        expect(flavio.family).toBe('centre-right');
        expect(flavio.subtype).toBe('liberal-conservatism');
        expect(lula.background).not.toBe(flavio.background);
        expect(presentation.classificationLabels(uniformScores(0)).background).not.toBe(lula.background);
    });

    it('covers balanced, mixed, and incomplete profiles', () =>
    {
        expect(presentation.classifyProfile(uniformScores(50)).subtype).toBe('balanced-centrism');
        expect(presentation.classifyProfile({ ...uniformScores(50), coordenacao: 100, protecao_social: 100 }).subtype).toBe('developmentalism');
        expect(presentation.classifyProfile(uniformScores(60)).subtype).toBe('mixed-profile');
        expect(presentation.classifyProfile({ coordenacao: 50 }).family).toBe('unavailable');
    });

    it('explains all twelve axes in both languages using score direction and ranges', () =>
    {
        for (const identifier of presentation.axisIdentifiers)
        {
            for (const language of ['pt', 'en'])
            {
                const left = presentation.axisExplanation(identifier, 80, language);
                const right = presentation.axisExplanation(identifier, 20, language);
                expect(left).not.toEqual(right);
                expect(presentation.axisExplanation(identifier, 66.7, language)).toContain(language === 'pt' ? 'moderada' : 'moderate');
                expect(presentation.axisExplanation(identifier, 50, language)).toContain(language === 'pt' ? 'equilibram' : 'balance');
                expect(presentation.axisExplanation(identifier, undefined, language)).toContain(language === 'pt' ? 'Não há' : 'No score');
            }
        }
    });

    it('uses the same bar for profiles and preserves exact values in comparisons', () =>
    {
        for (const language of ['pt', 'en'] as const)
        {
            const axis = profiles.axes[language][0];
            const bar = presentation.axisBarMarkup(axis, 66.7, language);
            expect(bar).toContain('67%');
            expect(bar).toContain('33%');
            expect(bar).toContain('66.7%');
            expect(bar).toContain('33.3%');
            expect(presentation.axisProfileMarkup([axis], { [axis.id]: 66.7 }, language, true)).toContain(bar);
            const comparison = presentation.comparisonAxisMarkup(axis, [{ name: 'You', symbol: '★', score: 66.7 }, { name: 'Lula', symbol: '13', score: 75 }, { name: 'Flávio', symbol: '22', score: 29.2 }], language);
            expect(comparison).toContain('left:33.3%');
            expect(comparison).toContain('left:25%');
            expect(comparison).toContain('left:70.8%');
            expect(comparison).toContain('66.7% / 33.3%');
        }
    });

    it('escapes labels and names instead of interpreting them as HTML', () =>
    {
        const axis = { ...profiles.axes.pt[0], label: '<script>alert(1)</script>', leftPole: '<img onerror="bad">' };
        const output = presentation.axisBarMarkup(axis, 50);
        expect(output).not.toContain('<script>');
        expect(output).not.toContain('<img');
        expect(output).toContain('&lt;img');
    });

    it('provides translated missing or partial running-mate fallbacks', () =>
    {
        expect(presentation.runningMateMarkup(undefined, 'pt')).toContain('Candidato a vice não confirmado');
        expect(presentation.runningMateMarkup({ status: 'unconfirmed' }, 'en')).toContain('Running mate not confirmed');
        expect(presentation.runningMateMarkup({ status: 'confirmed', name: 'Test' }, 'en')).toContain('Test');
    });
});
