package com.twelveaxes.model;

/**
 * {@code topic} agrupa perguntas quase equivalentes do mesmo eixo (o sorteio não
 * repete tema); {@code core} marca as que entram nos quizzes curto e completo.
 */
public record Question(
        String id,
        String axisId,
        String text,
        Pole agreePole,
        double weight,
        String topic,
        boolean core
) {
}
