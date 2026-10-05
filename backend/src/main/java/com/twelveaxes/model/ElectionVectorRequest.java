package com.twelveaxes.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.Map;

public record ElectionVectorRequest(
        @NotBlank String modelId,
        @NotEmpty Map<String, Double> scores)
{
}
