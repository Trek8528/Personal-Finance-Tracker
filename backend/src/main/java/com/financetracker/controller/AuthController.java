package com.financetracker.controller;

import com.financetracker.dto.*;
import com.financetracker.entity.User;
import com.financetracker.security.AuthUtils;
import com.financetracker.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final AuthService authService;
    private final AuthUtils authUtils;

    public AuthController(AuthService authService, AuthUtils authUtils) {
        this.authService = authService;
        this.authUtils = authUtils;
    }

    @PostMapping("/auth/signup")
    public AuthResponse signup(@Valid @RequestBody SignupRequest request) {
        return authService.signup(request);
    }

    @PostMapping("/auth/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/auth/me")
    public UserResponse me() {
        return authService.me(authUtils.currentUser());
    }

    @PutMapping("/users/me")
    public UserResponse updateProfile(@Valid @RequestBody ProfileUpdateRequest request) {
        return authService.updateProfile(authUtils.currentUser(), request);
    }

    @PutMapping("/users/me/password")
    public ApiMessage changePassword(@Valid @RequestBody PasswordChangeRequest request) {
        authService.changePassword(authUtils.currentUser(), request);
        return new ApiMessage("Password updated");
    }

    @PutMapping("/users/me/prefs")
    public UserResponse updatePrefs(@Valid @RequestBody PrefsUpdateRequest request) {
        return authService.updatePrefs(authUtils.currentUser(), request);
    }

    @DeleteMapping("/users/me/data")
    public ApiMessage clearData() {
        authService.clearData(authUtils.currentUser());
        return new ApiMessage("All data cleared");
    }
}
