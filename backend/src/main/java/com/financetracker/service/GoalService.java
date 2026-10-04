package com.financetracker.service;

import com.financetracker.dto.GoalRequest;
import com.financetracker.dto.GoalResponse;
import com.financetracker.entity.Goal;
import com.financetracker.entity.User;
import com.financetracker.exception.ApiException;
import com.financetracker.repository.GoalRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
public class GoalService {

    private final GoalRepository goalRepository;

    public GoalService(GoalRepository goalRepository) {
        this.goalRepository = goalRepository;
    }

    public List<GoalResponse> list(User user) {
        return goalRepository.findByUserOrderByCreatedAtDesc(user).stream().map(this::toResponse).toList();
    }

    public GoalResponse create(User user, GoalRequest request) {
        Goal goal = Goal.builder()
                .user(user)
                .name(request.name().trim())
                .targetAmount(request.target())
                .savedAmount(request.saved() == null ? BigDecimal.ZERO : request.saved())
                .icon(request.icon() == null || request.icon().isBlank() ? "🎯" : request.icon())
                .deadline(request.deadline())
                .createdAt(Instant.now())
                .build();
        return toResponse(goalRepository.save(goal));
    }

    public GoalResponse update(User user, Long id, GoalRequest request) {
        Goal goal = goalRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND.value(), "Goal not found"));
        goal.setName(request.name().trim());
        goal.setTargetAmount(request.target());
        goal.setSavedAmount(request.saved() == null ? BigDecimal.ZERO : request.saved());
        goal.setIcon(request.icon() == null || request.icon().isBlank() ? "🎯" : request.icon());
        goal.setDeadline(request.deadline());
        return toResponse(goalRepository.save(goal));
    }

    public void delete(User user, Long id) {
        Goal goal = goalRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND.value(), "Goal not found"));
        goalRepository.delete(goal);
    }

    private GoalResponse toResponse(Goal goal) {
        return new GoalResponse(
                String.valueOf(goal.getId()),
                goal.getName(),
                goal.getTargetAmount(),
                goal.getSavedAmount(),
                goal.getIcon(),
                goal.getDeadline(),
                goal.getCreatedAt()
        );
    }
}
