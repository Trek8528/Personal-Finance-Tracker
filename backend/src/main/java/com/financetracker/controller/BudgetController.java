package com.financetracker.controller;

import com.financetracker.dto.ApiMessage;
import com.financetracker.dto.BudgetRequest;
import com.financetracker.dto.BudgetResponse;
import com.financetracker.security.AuthUtils;
import com.financetracker.service.BudgetService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetService budgetService;
    private final AuthUtils authUtils;

    public BudgetController(BudgetService budgetService, AuthUtils authUtils) {
        this.budgetService = budgetService;
        this.authUtils = authUtils;
    }

    @GetMapping
    public List<BudgetResponse> list() {
        return budgetService.list(authUtils.currentUser());
    }

    @PostMapping
    public BudgetResponse create(@Valid @RequestBody BudgetRequest request) {
        return budgetService.create(authUtils.currentUser(), request);
    }

    @PutMapping("/{id}")
    public BudgetResponse update(@PathVariable Long id, @Valid @RequestBody BudgetRequest request) {
        return budgetService.update(authUtils.currentUser(), id, request);
    }

    @DeleteMapping("/{id}")
    public ApiMessage delete(@PathVariable Long id) {
        budgetService.delete(authUtils.currentUser(), id);
        return new ApiMessage("Budget deleted");
    }
}
