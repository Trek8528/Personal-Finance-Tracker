package com.financetracker.dto;

import java.math.BigDecimal;

public record BudgetResponse(String id, String category, String month, BigDecimal limit) {}
