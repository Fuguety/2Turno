import type { Axis } from '../types/quiz';

interface PoliticalClassification
{
    family: string;
    subtype: string;
    index: number | null;
    traits: { axisId: string; side: string }[];
}

declare const presentation:
{
    axisIdentifiers: string[];
    familyLabels: Record<string, string[]>;
    subtypeLabels: Record<string, string[]>;
    percentagePair(score: number | undefined): { left: number; right: number; displayLeft: number; displayRight: number; position: number } | null;
    classifyProfile(scores: Record<string, number> | undefined): PoliticalClassification;
    classificationLabels(scores: Record<string, number> | undefined, language?: string): PoliticalClassification & { familyLabel: string; subtypeLabel: string; color: string; background: string };
    ideologyHeaderMarkup(scores: Record<string, number> | undefined, language?: string): string;
    axisExplanation(axisIdentifier: string, score: number | undefined, language?: string): string;
    axisBarMarkup(axis: Axis, score: number | undefined, language?: string): string;
    axisProfileMarkup(axes: Axis[], scores: Record<string, number> | undefined, language?: string, explainUser?: boolean): string;
    comparisonAxisMarkup(axis: Axis, markers: { name: string; symbol: string; score?: number }[], language?: string): string;
    runningMateMarkup(runningMate: unknown, language?: string): string;
};
export default presentation;
