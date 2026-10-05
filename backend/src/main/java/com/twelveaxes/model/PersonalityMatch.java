package com.twelveaxes.model;

import java.util.Map;

public record PersonalityMatch(
        String personalityId,
        String name,
        String role,
        String category,
        String lifespan,
        String description,
        String imagePath,
        String imageSourceName,
        String imageSourceUrl,
        String imageNote,
        double compatibility,
        double compatibilityPercentile,
        // Vetor de 12 eixos (leftPercent) da personalidade, usado pelo front para
        // mostrar os eixos que aproximam o usuario dela.
        Map<String, Double> vector
) {
}
