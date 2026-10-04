package com.financetracker.controller;

import com.financetracker.dto.ApiMessage;
import com.financetracker.dto.TransactionRequest;
import com.financetracker.dto.TransactionResponse;
import com.financetracker.security.AuthUtils;
import com.financetracker.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;
    private final AuthUtils authUtils;

    public TransactionController(TransactionService transactionService, AuthUtils authUtils) {
        this.transactionService = transactionService;
        this.authUtils = authUtils;
    }

    @GetMapping
    public List<TransactionResponse> list() {
        return transactionService.list(authUtils.currentUser());
    }

    @PostMapping
    public TransactionResponse create(@Valid @RequestBody TransactionRequest request) {
        return transactionService.create(authUtils.currentUser(), request);
    }

    @PutMapping("/{id}")
    public TransactionResponse update(@PathVariable Long id, @Valid @RequestBody TransactionRequest request) {
        return transactionService.update(authUtils.currentUser(), id, request);
    }

    @DeleteMapping("/{id}")
    public ApiMessage delete(@PathVariable Long id) {
        transactionService.delete(authUtils.currentUser(), id);
        return new ApiMessage("Transaction deleted");
    }
}
