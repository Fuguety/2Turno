import site from '../site.json';
import type { ElectionComparison } from '../types/election';

export const ELECTION_MODEL_ID = 'brazil-presidential-2026-v2';

export function validateElectionComparison(comparison: ElectionComparison): ElectionComparison
{
  const expectedCandidates = new Set(site.candidates.map(candidate => candidate.id));
  if (comparison.modelId !== ELECTION_MODEL_ID
    || comparison.candidates.length !== expectedCandidates.size
    || new Set(comparison.candidates.map(candidate => candidate.id)).size !== expectedCandidates.size
    || comparison.candidates.some(candidate => !expectedCandidates.has(candidate.id))
    || comparison.axes.some(axis => Object.keys(axis.candidateScores).length !== expectedCandidates.size
      || Object.keys(axis.candidateScores).some(identifier => !expectedCandidates.has(identifier)))
    || comparison.closestCandidateIds.some(identifier => !expectedCandidates.has(identifier)))
  {
    throw new Error('Resposta incompatível com o modelo eleitoral brasileiro.');
  }
  return comparison;
}
