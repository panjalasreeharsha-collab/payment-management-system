package com.example.payment.controller;

import java.util.List;
import com.example.payment.model.Transaction;
import com.example.payment.model.Wallet;
import com.example.payment.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping("/pay")
    public ResponseEntity<?> makePayment(
            @RequestParam Long senderId,
            @RequestParam Long receiverId,
            @RequestParam BigDecimal amount,
            @RequestParam String paymentMethod) {
        try {
            Transaction tx = paymentService.processPayment(senderId, receiverId, amount, paymentMethod);
            return ResponseEntity.ok(tx);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
   
        // Top-Up Wallet Balance
    @PostMapping("/topup")
    public ResponseEntity<?> topUpWallet(@RequestParam Long userId, @RequestParam BigDecimal amount) {
        Wallet updatedWallet = paymentService.addFundsToWallet(userId, amount);
        return ResponseEntity.ok(updatedWallet);
    }

    // 1. Get Wallet Balance
    @GetMapping("/wallet/{userId}")
    public ResponseEntity<Wallet> getWalletBalance(@PathVariable Long userId) {
        Wallet wallet = paymentService.getWalletByUserId(userId);
        return ResponseEntity.ok(wallet);
    }

    // 2. Get Transaction History
    @GetMapping("/history/{userId}")
    public ResponseEntity<List<Transaction>> getTransactionHistory(@PathVariable Long userId) {
        List<Transaction> history = paymentService.getTransactionsForUser(userId);
        return ResponseEntity.ok(history);
    }
}