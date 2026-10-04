package com.financetracker.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record GoalRequest(
        @NotBlank String name,
        @NotNull @DecimalMin("1") BigDecimal target,
        @DecimalMin("0") BigDecimal saved,
        String icon,
        LocalDate deadline
) {}
