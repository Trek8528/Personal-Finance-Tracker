package com.financetracker.dto;

import com.financetracker.entity.TransactionType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record TransactionResponse(
        String id,
        LocalDate date,
        TransactionType type,
        String description,
        String category,
        BigDecimal amount,
        String note,
        Instant createdAt
) {}
