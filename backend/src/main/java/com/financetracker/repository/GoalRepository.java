package com.financetracker.repository;

import com.financetracker.entity.Goal;
import com.financetracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GoalRepository extends JpaRepository<Goal, Long> {
    List<Goal> findByUserOrderByCreatedAtDesc(User user);
    Optional<Goal> findByIdAndUser(Long id, User user);
    void deleteByUser(User user);
}
