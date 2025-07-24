package com.cruzze.controller;

import com.cruzze.entity.Payments;
import com.cruzze.service.PaymentsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/payments")
public class PaymentsController {
    @Autowired
    private PaymentsService paymentsService;

    @PostMapping("/createOrder")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> body) {
        try {
            BigDecimal amount = new BigDecimal(body.get("amount").toString());
            String currency = body.getOrDefault("currency", "INR").toString();
            String receipt = body.getOrDefault("receipt", "receipt#1").toString();
            Map<String, Object> order = paymentsService.createOrder(amount, currency, receipt);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PostMapping("/createForRide/{rideId}")
    public ResponseEntity<?> createPaymentForRide(@PathVariable Long rideId) {
        try {
            Payments payment = paymentsService.createRazorpayPaymentForRide(rideId);
            return ResponseEntity.ok(payment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/byRide/{rideId}")
    public ResponseEntity<?> getPaymentByRideId(@PathVariable Long rideId) {
        Optional<Payments> payment = paymentsService.getPaymentByRideId(rideId);
        return payment.map(ResponseEntity::ok)
                      .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> body) {
        try {
            String orderId = body.get("orderId");
            String paymentId = body.get("paymentId");
            String signature = body.get("signature");
            boolean isValid = paymentsService.verifyPaymentSignature(orderId, paymentId, signature);
            Payments updated = paymentsService.updatePaymentStatus(orderId, paymentId, signature, isValid);
            return ResponseEntity.ok(Map.of("valid", isValid, "payment", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Optional: Razorpay webhook endpoint
    @PostMapping("/webhook")
    public ResponseEntity<?> handleWebhook(@RequestBody Map<String, Object> payload) {
        // You can process webhook events here (e.g., payment.captured)
        // For now, just return 200 OK
        return ResponseEntity.ok(Map.of("status", "received"));
    }
} 