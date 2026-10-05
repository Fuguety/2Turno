package com.twelveaxes.model;

import java.util.List;
import java.util.Map;

public record ElectionComparison(
        String modelId,
        String asOf,
        String scoringMethod,
        List<AxisComparison> axes,
        List<CandidateMatch> candidates,
        List<String> closestCandidateIds,
        Map<String, Long> answeredQuestionCounts)
{
    public record AxisComparison(Axis axis, double userScore, Map<String, Double> candidateScores)
    {
    }

    public record CandidateMatch(
            String id, String name, String party, int number, double distance, double compatibility)
    {
    }
}
