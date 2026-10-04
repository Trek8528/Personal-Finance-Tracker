package com.financetracker.service;

import com.financetracker.dto.*;
import com.financetracker.entity.User;
import com.financetracker.exception.ApiException;
import com.financetracker.repository.BudgetRepository;
import com.financetracker.repository.GoalRepository;
import com.financetracker.repository.TransactionRepository;
import com.financetracker.repository.UserRepository;
import com.financetracker.security.JwtService;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final GoalRepository goalRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            TransactionRepository transactionRepository,
            BudgetRepository budgetRepository,
            GoalRepository goalRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.budgetRepository = budgetRepository;
        this.goalRepository = goalRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse signup(SignupRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT.value(), "An account with this email already exists");
        }
        User user = User.builder()
                .firstName(request.firstName().trim())
                .lastName(request.lastName().trim())
                .phone(request.phone().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .memberSince(LocalDate.now())
                .currency("INR")
                .theme("dark")
                .notifications(true)
                .build();
        user = userRepository.save(user);
        return toAuth(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email().trim().toLowerCase())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED.value(), "Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED.value(), "Invalid email or password");
        }
        return toAuth(user);
    }

    public UserResponse me(User user) {
        return toUserResponse(user);
    }

    public UserResponse updateProfile(User user, ProfileUpdateRequest request) {
        String email = request.email().trim().toLowerCase();
        if (!email.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT.value(), "An account with this email already exists");
        }
        String[] parts = request.name().trim().split("\\s+", 2);
        user.setFirstName(parts[0]);
        user.setLastName(parts.length > 1 ? parts[1] : "");
        user.setEmail(email);
        return toUserResponse(userRepository.save(user));
    }

    public void changePassword(User user, PasswordChangeRequest request) {
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST.value(), "Current password is incorrect");
        }
        if (!request.newPassword().matches("^(?=.*[a-zA-Z])(?=.*\\d)(?=.*[!@#$%^&*(),.?\":{}|<>]).+$")) {
            throw new ApiException(HttpStatus.BAD_REQUEST.value(), "Password must contain a letter, a number and a special character");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    public UserResponse updatePrefs(User user, PrefsUpdateRequest request) {
        user.setCurrency(request.currency());
        user.setTheme(request.theme());
        user.setNotifications(Boolean.TRUE.equals(request.notifs()));
        return toUserResponse(userRepository.save(user));
    }

    @Transactional
    public void clearData(User user) {
        transactionRepository.deleteByUser(user);
        budgetRepository.deleteByUser(user);
        goalRepository.deleteByUser(user);
    }

    private AuthResponse toAuth(User user) {
        return new AuthResponse(jwtService.generateToken(user.getId(), user.getEmail()), toUserResponse(user));
    }

    public static UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.fullName(),
                user.getEmail(),
                user.getPhone(),
                user.getMemberSince().toString(),
                user.getCurrency(),
                user.getTheme(),
                user.isNotifications()
        );
    }
}
