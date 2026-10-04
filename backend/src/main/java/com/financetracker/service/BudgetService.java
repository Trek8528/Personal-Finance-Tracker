package com.financetracker.service;

import com.financetracker.dto.BudgetRequest;
import com.financetracker.dto.BudgetResponse;
import com.financetracker.entity.Budget;
import com.financetracker.entity.User;
import com.financetracker.exception.ApiException;
import com.financetracker.repository.BudgetRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BudgetService {

    private final BudgetRepository budgetRepository;

    public BudgetService(BudgetRepository budgetRepository) {
        this.budgetRepository = budgetRepository;
    }

    public List<BudgetResponse> list(User user) {
        return budgetRepository.findByUser(user).stream().map(this::toResponse).toList();
    }

    public BudgetResponse create(User user, BudgetRequest request) {
        if (budgetRepository.existsByUserAndCategoryAndMonth(user, request.category(), request.month())) {
            throw new ApiException(HttpStatus.CONFLICT.value(), "A budget for this category/month already exists");
        }
        Budget budget = Budget.builder()
                .user(user)
                .category(request.category())
                .month(request.month())
                .limitAmount(request.limit())
                .build();
        return toResponse(budgetRepository.save(budget));
    }

    public BudgetResponse update(User user, Long id, BudgetRequest request) {
        Budget budget = budgetRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND.value(), "Budget not found"));
        if (budgetRepository.existsByUserAndCategoryAndMonthAndIdNot(user, request.category(), request.month(), id)) {
            throw new ApiException(HttpStatus.CONFLICT.value(), "A budget for this category/month already exists");
        }
        budget.setCategory(request.category());
        budget.setMonth(request.month());
        budget.setLimitAmount(request.limit());
        return toResponse(budgetRepository.save(budget));
    }

    public void delete(User user, Long id) {
        Budget budget = budgetRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND.value(), "Budget not found"));
        budgetRepository.delete(budget);
    }

    private BudgetResponse toResponse(Budget budget) {
        return new BudgetResponse(
                String.valueOf(budget.getId()),
                budget.getCategory(),
                budget.getMonth(),
                budget.getLimitAmount()
        );
    }
}
