import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import type { ElectionComparison } from '../types/election';
import { ELECTION_MODEL_ID, validateElectionComparison } from './brazilElection';
import electionModel from '../../../backend/src/main/resources/data/elections/brazil-2026.json';

const require = createRequire(import.meta.url);
const { candidateProfiles, electionScores } = require('../../scripts/brazil-catalogue.cjs');

function comparisonFixture(): ElectionComparison
{
  return {
    modelId: electionModel.modelId,
    asOf: electionModel.asOf,
    scoringMethod: 'mean-absolute-distance-v1',
    axes: electionModel.axes.map(axis => ({ axis, userScore: 50, candidateScores: { 'lula-da-silva': 50, 'flavio-bolsonaro': 50 } })),
    candidates: electionModel.candidates.map(candidate => ({ id: candidate.id, name: candidate.name, party: candidate.party, number: candidate.number, distance: 0, compatibility: 100 })),
    closestCandidateIds: electionModel.candidates.map(candidate => candidate.id),
    answeredQuestionCounts: {}
  };
}



describe('Brazilian election isolation', () =>
{
  it('publishes only the two runoff candidates, in ballot order, in both languages', () =>
  {
    for (const language of ['pt', 'en'])
    {
      const profiles = candidateProfiles(language);
      expect(profiles.map((person: { id: string }) => person.id)).toEqual(['lula-da-silva', 'flavio-bolsonaro']);
      expect(profiles.map((person: { number: number }) => person.number)).toEqual([13, 22]);
      expect(profiles.every((person: { description: string }) => person.description.length > 0)).toBe(true);
    }
    expect(candidateProfiles('en')[0].description).not.toEqual(candidateProfiles('pt')[0].description);
  });

  it('keeps the frontend model version in sync with the backend model', () =>
  {
    expect(electionModel.modelId).toBe(ELECTION_MODEL_ID);
    expect(electionModel.candidates.map(candidate => candidate.id)).toEqual(['lula-da-silva', 'flavio-bolsonaro']);
  });

  it('rejects leaked international matches, per-axis scores, and closest-candidate IDs', () =>
  {
    expect(validateElectionComparison(comparisonFixture()).candidates).toHaveLength(2);
    const foreignMatch = comparisonFixture();
    foreignMatch.candidates[0].id = 'donald-trump';
    expect(() => validateElectionComparison(foreignMatch)).toThrow();
    const foreignAxis = comparisonFixture();
    foreignAxis.axes[0].candidateScores['javier-milei'] = 50;
    expect(() => validateElectionComparison(foreignAxis)).toThrow();
    const foreignClosest = comparisonFixture();
    foreignClosest.closestCandidateIds = ['lenin'];
    expect(() => validateElectionComparison(foreignClosest)).toThrow();
    const legacy = comparisonFixture();
    legacy.modelId = '12axes-general';
    expect(() => validateElectionComparison(legacy)).toThrow();
  });

  it('static primary profiles preserve the backend election score scale', () =>
  {
    const lula = electionScores(electionModel.candidates[0], electionModel);
    const flavio = electionScores(electionModel.candidates[1], electionModel);
    expect(Object.values(lula)).toEqual([75, 66.7, 79.2, 62.5, 79.2, 70.8, 58.3, 83.3, 75, 58.3, 87.5, 58.3]);
    expect(Object.values(flavio)).toEqual([29.2, 45.8, 29.2, 16.7, 20.8, 33.3, 50, 16.7, 12.5, 20.8, 50, 33.3]);
  });
});
