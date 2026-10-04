package com.financetracker.dto;

import com.financetracker.entity.TransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionRequest(
        @NotNull LocalDate date,
        @NotNull TransactionType type,
        @NotBlank String description,
        @NotBlank String category,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        String note
) {}
