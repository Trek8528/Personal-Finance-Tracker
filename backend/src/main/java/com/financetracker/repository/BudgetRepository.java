package com.financetracker.repository;

import com.financetracker.entity.Budget;
import com.financetracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, Long> {
    List<Budget> findByUser(User user);
    List<Budget> findByUserAndMonth(User user, String month);
    Optional<Budget> findByIdAndUser(Long id, User user);
    boolean existsByUserAndCategoryAndMonth(User user, String category, String month);
    boolean existsByUserAndCategoryAndMonthAndIdNot(User user, String category, String month, Long id);
    void deleteByUser(User user);
}
