package com.twelveaxes.model;

import java.util.Map;

public record CountryMatch(
        String countryId,
        String name,
        String category,
        String description,
        String flagPath,
        String flagKind,
        String flagSourceName,
        String flagSourceUrl,
        String flagNote,
        boolean historical,
        String period,
        double compatibility,
        double compatibilityPercentile,
        // Vetor de 12 eixos (leftPercent) do pais, usado pelo front para
        // mostrar os eixos que aproximam o usuario dele.
        Map<String, Double> vector
) {
}
