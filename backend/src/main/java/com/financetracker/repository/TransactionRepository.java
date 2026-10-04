package com.financetracker.repository;

import com.financetracker.entity.Transaction;
import com.financetracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUserOrderByDateDescCreatedAtDesc(User user);
    Optional<Transaction> findByIdAndUser(Long id, User user);
    void deleteByUser(User user);
}
