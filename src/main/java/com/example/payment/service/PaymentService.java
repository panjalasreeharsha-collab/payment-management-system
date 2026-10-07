package com.example.payment.service;

import com.example.payment.model.Transaction;
import com.example.payment.model.Wallet;
import com.example.payment.repository.TransactionRepository;
import com.example.payment.repository.WalletRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class PaymentService {

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Transactional
    public Transaction processPayment(Long senderId, Long receiverId, BigDecimal amount, String paymentMethod) {
        String referenceId = UUID.randomUUID().toString();

        // 1. Initialize Transaction Log as PENDING
        Transaction transaction = new Transaction();
        transaction.setTransactionReferenceId(referenceId);
        transaction.setSenderId(senderId);
        transaction.setReceiverId(receiverId);
        transaction.setAmount(amount);
        transaction.setPaymentMethod(paymentMethod);
        transaction.setStatus(Transaction.TransactionStatus.PENDING);
        transactionRepository.save(transaction);

        // 2. Issuer / Bank Authorization (check Sender Balance)
        Wallet senderWallet = walletRepository.findByUserId(senderId)
                .orElseThrow(() -> new RuntimeException("Sender wallet not found"));
        Wallet receiverWallet = walletRepository.findByUserId(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver wallet not found"));

        if (senderWallet.getBalance().compareTo(amount) < 0) {
            // Decline transaction due to insufficient funds
            transaction.setStatus(Transaction.TransactionStatus.FAILED);
            transactionRepository.save(transaction);
            throw new RuntimeException("Declined: Insufficient balance");
        }

        // 3. Process Transfer (Debit & Credit)
        senderWallet.setBalance(senderWallet.getBalance().subtract(amount));
        receiverWallet.setBalance(receiverWallet.getBalance().add(amount));

        walletRepository.save(senderWallet);
        walletRepository.save(receiverWallet);

        transaction.setStatus(Transaction.TransactionStatus.SUCCESS);
        return transactionRepository.save(transaction);
    }

    @Transactional
    public Wallet addFundsToWallet(Long userId, BigDecimal amount) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));

        wallet.setBalance(wallet.getBalance().add(amount));
        return walletRepository.save(wallet);
    }
    public Wallet getWalletByUserId(Long userId) {
        return walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found"));
    }

    public java.util.List<Transaction> getTransactionsForUser(Long userId) {
        return transactionRepository.findBySenderIdOrReceiverId(userId, userId);
    }
}