package com.financetracker.dto;

public record UserResponse(
        Long id,
        String name,
        String email,
        String phone,
        String since,
        String currency,
        String theme,
        boolean notifs
) {}
