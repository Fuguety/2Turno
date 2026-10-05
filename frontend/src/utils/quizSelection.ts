import type { QuizPayload, Question } from '../types/quiz';

export function selectAndBalanceQuestions(payload: QuizPayload): QuizPayload {
  const { questions: pool } = payload;
  const questionsPerAxis = payload.questionsPerAxis > 0
    ? payload.questionsPerAxis
    : payload.variant === 'extended' ? 5 : 3;

  const byAxis = new Map<string, Question[]>();
  for (const q of pool) {
    const group = byAxis.get(q.axisId) ?? [];
    group.push(q);
    byAxis.set(q.axisId, group);
  }

  const selected: Question[] = [];
  let axisIndex = 0;
  for (const axisQuestions of byAxis.values()) {
    const extraLeft = axisIndex % 2 === 0;
    const leftCount = extraLeft
      ? Math.ceil(questionsPerAxis / 2)
      : Math.floor(questionsPerAxis / 2);
    const rightCount = questionsPerAxis - leftCount;
    selected.push(...pickAxisQuestions(axisQuestions, leftCount, rightCount));
    axisIndex++;
  }

  const leftQueue = shuffleArray(selected.filter((q) => q.agreePole === 'LEFT'));
  const rightQueue = shuffleArray(selected.filter((q) => q.agreePole === 'RIGHT'));
  const ordered: Question[] = [];
  let li = 0;
  let ri = 0;
  let pickLeft = Math.random() < 0.5;

  for (let i = 0; i < selected.length; i++) {
    if (pickLeft && li < leftQueue.length) {
      ordered.push(leftQueue[li++]);
    } else if (!pickLeft && ri < rightQueue.length) {
      ordered.push(rightQueue[ri++]);
    } else if (li < leftQueue.length) {
      ordered.push(leftQueue[li++]);
    } else {
      ordered.push(rightQueue[ri++]);
    }
    pickLeft = !pickLeft;
  }

  return { ...payload, questions: ordered };
}

/**
 * Versão extrema: usa TODAS as perguntas do pool (sem subselecionar), apenas
 * reordenando para intercalar afirmações LEFT/RIGHT como no quiz normal.
 */
export function selectAllQuestionsBalanced(payload: QuizPayload): QuizPayload {
  const pool = payload.questions;
  const leftQueue = shuffleArray(pool.filter((q) => q.agreePole === 'LEFT'));
  const rightQueue = shuffleArray(pool.filter((q) => q.agreePole === 'RIGHT'));
  const ordered: Question[] = [];
  let li = 0;
  let ri = 0;
  let pickLeft = Math.random() < 0.5;

  for (let i = 0; i < pool.length; i++) {
    if (pickLeft && li < leftQueue.length) {
      ordered.push(leftQueue[li++]);
    } else if (!pickLeft && ri < rightQueue.length) {
      ordered.push(rightQueue[ri++]);
    } else if (li < leftQueue.length) {
      ordered.push(leftQueue[li++]);
    } else {
      ordered.push(rightQueue[ri++]);
    }
    pickLeft = !pickLeft;
  }

  return {
    ...payload,
    variant: 'extreme',
    questions: ordered,
    questionCount: ordered.length,
    questionsPerAxis: 0
  };
}

// Reordena para alternar afirmações LEFT/RIGHT enquanto houver de ambos os lados.
export function interleaveByPole(questions: Question[]): Question[] {
  const leftQueue = shuffleArray(questions.filter((q) => q.agreePole === 'LEFT'));
  const rightQueue = shuffleArray(questions.filter((q) => q.agreePole === 'RIGHT'));
  const ordered: Question[] = [];
  let li = 0;
  let ri = 0;
  let pickLeft = Math.random() < 0.5;

  for (let i = 0; i < questions.length; i++) {
    if (pickLeft && li < leftQueue.length) {
      ordered.push(leftQueue[li++]);
    } else if (!pickLeft && ri < rightQueue.length) {
      ordered.push(rightQueue[ri++]);
    } else if (li < leftQueue.length) {
      ordered.push(leftQueue[li++]);
    } else {
      ordered.push(rightQueue[ri++]);
    }
    pickLeft = !pickLeft;
  }

  return ordered;
}

const PICK_ATTEMPTS = 30;

// Sorteia as perguntas de um eixo só entre as core (as que melhor medem o eixo,
// sem as extremas) e sem repetir tema — nem entre polos, já que um par invertido
// mede a mesma coisa duas vezes. Um sorteio pode travar sem tema livre, então
// tenta de novo; só recorre a perguntas fora do núcleo, e por fim a temas
// repetidos, se nenhuma tentativa fechar.
function pickAxisQuestions(axisQuestions: Question[], leftCount: number, rightCount: number): Question[] {
  const core = axisQuestions.filter((q) => q.core);
  for (const pool of [core, axisQuestions]) {
    for (let attempt = 0; attempt < PICK_ATTEMPTS; attempt++) {
      const picked = pickByPole(pool, leftCount, rightCount, true);
      if (picked) return picked;
    }
  }
  return pickByPole(axisQuestions, leftCount, rightCount, false) ?? [];
}

function pickByPole(
  pool: Question[],
  leftCount: number,
  rightCount: number,
  distinctTopics: boolean
): Question[] | null {
  const queues = {
    LEFT: shuffleArray(pool.filter((q) => q.agreePole === 'LEFT')),
    RIGHT: shuffleArray(pool.filter((q) => q.agreePole === 'RIGHT'))
  };
  const remaining = { LEFT: leftCount, RIGHT: rightCount };
  const usedTopics = new Set<string>();
  const picked: Question[] = [];
  // Alterna os polos para nenhum deles ficar com todos os temas.
  let pole: Question['agreePole'] = Math.random() < 0.5 ? 'LEFT' : 'RIGHT';

  while (remaining.LEFT + remaining.RIGHT > 0) {
    if (remaining[pole] === 0) pole = pole === 'LEFT' ? 'RIGHT' : 'LEFT';
    const index = queues[pole].findIndex((q) => !distinctTopics || !q.topic || !usedTopics.has(q.topic));
    if (index === -1) return distinctTopics ? null : picked;
    const [question] = queues[pole].splice(index, 1);
    if (question.topic) usedTopics.add(question.topic);
    picked.push(question);
    remaining[pole]--;
    pole = pole === 'LEFT' ? 'RIGHT' : 'LEFT';
  }
  return picked;
}

function shuffleArray<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
