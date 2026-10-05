import { LANG } from '../i18n';
import type { ElectionAnswerRequest, ElectionComparison, ElectionQuiz } from '../types/election';
import type { QuizVariant } from '../types/quiz';
import { ELECTION_MODEL_ID, validateElectionComparison } from '../utils/brazilElection';

const apiAddress = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const electionPath = '/api/elections/brazil-2026';

async function request<Value>(path: string, body?: unknown): Promise<Value>
{
  const response = await fetch(`${apiAddress}${electionPath}${path}`, body === undefined ? undefined : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok)
  {
    throw new Error(LANG === 'pt' ? 'Não foi possível carregar os dados eleitorais.' : 'Unable to load election data.');
  }
  return response.json() as Promise<Value>;
}



export async function fetchElectionQuiz(variant: QuizVariant): Promise<ElectionQuiz>
{
  const response = await request<ElectionQuiz>(`/quiz?variant=${variant}&lang=${LANG}`);
  if (response.modelId !== ELECTION_MODEL_ID
    || response.quiz.questions.some(question => !question.id.startsWith('br2026_')))
  {
    throw new Error('Quiz incompatível com a versão eleitoral brasileira.');
  }
  return response;
}



export async function submitElectionAnswers(answers: ElectionAnswerRequest): Promise<ElectionComparison>
{
  return validateElectionComparison(await request<ElectionComparison>(`/results?lang=${LANG}`, answers));
}



export async function compareElectionVector(scores: Record<string, number>): Promise<ElectionComparison>
{
  return validateElectionComparison(await request<ElectionComparison>(`/compare?lang=${LANG}`, { modelId: ELECTION_MODEL_ID, scores }));
}
