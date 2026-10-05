package com.twelveaxes.model;

import java.util.List;
import java.util.Map;

/** Election scores have their own axis meanings and must carry this model's identifier. */
public record ElectionModel(
        String modelId,
        String asOf,
        String title,
        String description,
        List<Axis> axes,
        List<Question> questions,
        List<Candidate> candidates,
        List<Source> sources)
{
    public ElectionModel
    {
        axes = List.copyOf(axes);
        questions = List.copyOf(questions);
        candidates = List.copyOf(candidates);
        sources = List.copyOf(sources);
    }

    public record Candidate(
            String id,
            String name,
            String party,
            int number,
            Map<String, AnswerValue> answers,
            List<String> uncertainQuestionIds,
            Map<String, Evidence> evidence)
    {
        public Candidate
        {
            answers = Map.copyOf(answers);
            uncertainQuestionIds = List.copyOf(uncertainQuestionIds);
            evidence = Map.copyOf(evidence);
        }
    }

    public record Evidence(
            String confidence,
            String summary,
            String summaryEnglish,
            List<String> sourceIds,
            String locator)
    {
        public Evidence
        {
            sourceIds = List.copyOf(sourceIds);
        }
    }

    public record Source(String id, String title, String url, String kind, String accessedAt)
    {
    }

    public record Translation(String title, String description, List<Axis> axes, List<QuestionText> questions)
    {
    }

    public record QuestionText(String id, String text)
    {
    }

    public record Quiz(String modelId, String asOf, QuizPayload quiz)
    {
    }
}
