package com.twelveaxes.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.Map;

/**
 * Livro de referencia de uma personalidade (um por personalidade).
 *
 * @param title titulo por idioma ("pt", "en")
 * @param url link direto de afiliado por idioma; vazio cai numa busca na Amazon
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record Book(
        String personalityId,
        Map<String, String> title,
        Integer year,
        Map<String, String> url
) {
}
