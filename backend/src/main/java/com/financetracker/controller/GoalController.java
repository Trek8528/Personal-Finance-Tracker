package com.financetracker.controller;

import com.financetracker.dto.ApiMessage;
import com.financetracker.dto.GoalRequest;
import com.financetracker.dto.GoalResponse;
import com.financetracker.security.AuthUtils;
import com.financetracker.service.GoalService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/goals")
public class GoalController {

    private final GoalService goalService;
    private final AuthUtils authUtils;

    public GoalController(GoalService goalService, AuthUtils authUtils) {
        this.goalService = goalService;
        this.authUtils = authUtils;
    }

    @GetMapping
    public List<GoalResponse> list() {
        return goalService.list(authUtils.currentUser());
    }

    @PostMapping
    public GoalResponse create(@Valid @RequestBody GoalRequest request) {
        return goalService.create(authUtils.currentUser(), request);
    }

    @PutMapping("/{id}")
    public GoalResponse update(@PathVariable Long id, @Valid @RequestBody GoalRequest request) {
        return goalService.update(authUtils.currentUser(), id, request);
    }

    @DeleteMapping("/{id}")
    public ApiMessage delete(@PathVariable Long id) {
        goalService.delete(authUtils.currentUser(), id);
        return new ApiMessage("Goal deleted");
    }
}
