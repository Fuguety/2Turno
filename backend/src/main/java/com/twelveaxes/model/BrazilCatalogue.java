package com.twelveaxes.model;

import java.util.List;
import java.util.Map;

public record BrazilCatalogue(String countryCode, String electionId,
        List<String> primaryCandidateIds, List<String> profileIds)
{
    public record Item(String id, String name, String role, String category, String description,
            String imagePath, String countryCode, boolean primaryCandidate)
    {
    }

    public record Profile(Item person, String modelId, List<Axis> axes, Map<String, Double> scores)
    {
    }
}
