package com.financetracker.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(
        name = "budgets",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "category", "month"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Budget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 40)
    private String category;

    @Column(nullable = false, length = 7)
    private String month;

    @Column(name = "spend_limit", nullable = false, precision = 12, scale = 2)
    private BigDecimal limitAmount;
}
