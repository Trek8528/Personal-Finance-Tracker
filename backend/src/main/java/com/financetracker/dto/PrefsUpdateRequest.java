package com.financetracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PrefsUpdateRequest(
        @NotBlank String currency,
        @NotBlank String theme,
        @NotNull Boolean notifs
) {}
