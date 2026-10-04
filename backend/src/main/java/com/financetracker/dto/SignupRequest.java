package com.financetracker.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SignupRequest(
        @NotBlank @Size(max = 30) String firstName,
        @NotBlank @Size(max = 30) String lastName,
        @NotBlank @Pattern(regexp = "^\\d{10}$", message = "Phone must be 10 digits") String phone,
        @NotBlank @Email String email,
        @NotBlank
        @Pattern(
                regexp = "^(?=.*[a-zA-Z])(?=.*\\d)(?=.*[!@#$%^&*(),.?\":{}|<>]).+$",
                message = "Password must contain a letter, a number and a special character"
        )
        String password
) {}
