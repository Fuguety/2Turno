package com.twelveaxes.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.Map;

public record ResultRequest(
        @NotEmpty List<@Valid SubmittedAnswer> answers,
        String variant,
        // Perguntas de arquétipo do fim do quiz: id da pergunta -> id da alternativa.
        // Opcional: quem pula (ou clientes antigos) manda nulo ou vazio.
        Map<String, String> archetype
) {
    public ResultRequest(List<SubmittedAnswer> answers) {
        this(answers, "short", null);
    }

    public ResultRequest(List<SubmittedAnswer> answers, String variant) {
        this(answers, variant, null);
    }
}
