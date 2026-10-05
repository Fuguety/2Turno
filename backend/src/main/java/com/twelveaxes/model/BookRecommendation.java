package com.twelveaxes.model;

/**
 * Livro recomendado no resultado, ja no idioma pedido e com o link de afiliado montado.
 *
 * @param compatibility compatibilidade do usuario com a personalidade autora
 */
public record BookRecommendation(
        String personalityId,
        String personalityName,
        String imagePath,
        String title,
        Integer year,
        String url,
        double compatibility
) {
}
