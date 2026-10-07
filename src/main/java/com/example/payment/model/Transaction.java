package com.example.payment.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Data
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String transactionReferenceId;
    
    private Long senderId;
    private Long receiverId;
    private BigDecimal amount;
    
    @Enumerated(EnumType.STRING)
    private TransactionStatus status;
    
    private String paymentMethod;
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum TransactionStatus {
        PENDING, SUCCESS, FAILED
    }
}