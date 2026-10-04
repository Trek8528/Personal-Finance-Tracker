package com.financetracker.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;

public record BudgetRequest(
        @NotBlank String category,
        @NotBlank @Pattern(regexp = "^\\d{4}-\\d{2}$") String month,
        @NotNull @DecimalMin("1") BigDecimal limit
) {}
