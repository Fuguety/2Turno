package com.twelveaxes.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ElectionAnswerRequest(
        @NotBlank String modelId,
        @NotBlank String variant,
        @NotEmpty @Size(max = 72) List<@NotNull @Valid SubmittedAnswer> answers)
{
}
