package com.financetracker.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record GoalResponse(
        String id,
        String name,
        BigDecimal target,
        BigDecimal saved,
        String icon,
        LocalDate deadline,
        Instant createdAt
) {}
