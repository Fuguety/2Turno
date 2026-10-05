import { describe, expect, it } from 'vitest';
import electionModel from '../../../backend/src/main/resources/data/elections/brazil-2026.json';
import type { Question, QuizPayload, QuizVariant } from '../types/quiz';
import { selectAllQuestionsBalanced, selectAndBalanceQuestions } from './quizSelection';

function electionPayload(variant: QuizVariant, questionsPerAxis: number): QuizPayload
{
  return {
    title: electionModel.title,
    description: electionModel.description,
    variant,
    questionCount: questionsPerAxis * 12,
    questionsPerAxis,
    axes: electionModel.axes,
    questions: electionModel.questions as Question[],
    answerOptions: [],
    archetypeQuestions: []
  };
}



describe('Brazilian election question selection', () =>
{
  it.each([['short', 3], ['extended', 5]] as const)(
    'selects %s questions with equal axis coverage and balanced poles', (variant, questionsPerAxis) =>
    {
      for (let attempt = 0; attempt < 30; attempt++)
      {
        const selected = selectAndBalanceQuestions(electionPayload(variant, questionsPerAxis));
        expect(selected.questions).toHaveLength(questionsPerAxis * 12);
        expect(new Set(selected.questions.map(question => question.id)).size).toBe(selected.questions.length);
        expect(new Set(selected.questions.map(question => question.topic)).size).toBe(selected.questions.length);
        expect(selected.questions.every(question => question.core && question.weight === 1)).toBe(true);
        for (const axis of selected.axes)
        {
          const questions = selected.questions.filter(question => question.axisId === axis.id);
          const leftCount = questions.filter(question => question.agreePole === 'LEFT').length;
          expect(questions).toHaveLength(questionsPerAxis);
          expect(Math.abs(2 * leftCount - questions.length)).toBe(1);
        }
        expect(selected.questions.filter(question => question.agreePole === 'LEFT'))
          .toHaveLength(selected.questions.length / 2);
      }
    }
  );

  it('uses all 72 questions for the complete election comparison', () =>
  {
    const selected = selectAllQuestionsBalanced(electionPayload('extreme', 6));
    expect(selected.questionCount).toBe(72);
    expect(selected.questionsPerAxis).toBe(0);
    expect(new Set(selected.questions.map(question => question.id)))
      .toEqual(new Set(electionModel.questions.map(question => question.id)));
    expect(selected.questions.filter(question => question.agreePole === 'LEFT')).toHaveLength(36);
  });
});
