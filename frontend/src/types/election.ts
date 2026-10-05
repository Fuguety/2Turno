import type { Axis, QuizPayload, QuizVariant, SubmittedAnswer } from './quiz';

export interface ElectionQuiz
{
  modelId: string;
  asOf: string;
  quiz: QuizPayload;
}

export interface ElectionAnswerRequest
{
  modelId: string;
  variant: QuizVariant;
  answers: SubmittedAnswer[];
}

export interface ElectionVectorRequest
{
  modelId: string;
  scores: Record<string, number>;
}

export interface ElectionAxisComparison
{
  axis: Axis;
  userScore: number;
  candidateScores: Record<string, number>;
}

export interface ElectionCandidateMatch
{
  id: string;
  name: string;
  party: string;
  number: number;
  distance: number;
  compatibility: number;
}

export interface ElectionComparison
{
  modelId: string;
  asOf: string;
  scoringMethod: 'mean-absolute-distance-v1';
  axes: ElectionAxisComparison[];
  candidates: ElectionCandidateMatch[];
  closestCandidateIds: string[];
  answeredQuestionCounts: Record<string, number>;
}
