package com.cruzze.dao;

import com.cruzze.entity.Payments;
import com.cruzze.repository.PaymentsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import com.cruzze.entity.Payments;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public class PaymentsDao {
    @Autowired
    private PaymentsRepository paymentsRepository;

    public Payments save(Payments payment) {
        return paymentsRepository.save(payment);
    }

    public Optional<Payments> findById(Long id) {
        return paymentsRepository.findById(id);
    }

    public Optional<Payments> findByRideId(Long rideId) {
        return paymentsRepository.findByRideId(rideId);
    }

    public Optional<Payments> findByTransactionId(String transactionId) {
        return paymentsRepository.findByTransactionId(transactionId);
    }
} 