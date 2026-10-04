package com.financetracker.service;

import com.financetracker.dto.TransactionRequest;
import com.financetracker.dto.TransactionResponse;
import com.financetracker.entity.Transaction;
import com.financetracker.entity.User;
import com.financetracker.exception.ApiException;
import com.financetracker.repository.TransactionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;

    public TransactionService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    public List<TransactionResponse> list(User user) {
        return transactionRepository.findByUserOrderByDateDescCreatedAtDesc(user).stream()
                .map(this::toResponse)
                .toList();
    }

    public TransactionResponse create(User user, TransactionRequest request) {
        Transaction txn = Transaction.builder()
                .user(user)
                .date(request.date())
                .type(request.type())
                .description(request.description().trim())
                .category(request.category())
                .amount(request.amount())
                .note(request.note() == null ? "" : request.note().trim())
                .createdAt(Instant.now())
                .build();
        return toResponse(transactionRepository.save(txn));
    }

    public TransactionResponse update(User user, Long id, TransactionRequest request) {
        Transaction txn = transactionRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND.value(), "Transaction not found"));
        txn.setDate(request.date());
        txn.setType(request.type());
        txn.setDescription(request.description().trim());
        txn.setCategory(request.category());
        txn.setAmount(request.amount());
        txn.setNote(request.note() == null ? "" : request.note().trim());
        return toResponse(transactionRepository.save(txn));
    }

    public void delete(User user, Long id) {
        Transaction txn = transactionRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND.value(), "Transaction not found"));
        transactionRepository.delete(txn);
    }

    private TransactionResponse toResponse(Transaction txn) {
        return new TransactionResponse(
                String.valueOf(txn.getId()),
                txn.getDate(),
                txn.getType(),
                txn.getDescription(),
                txn.getCategory(),
                txn.getAmount(),
                txn.getNote(),
                txn.getCreatedAt()
        );
    }
}
