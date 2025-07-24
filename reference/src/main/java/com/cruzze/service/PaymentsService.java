package com.cruzze.service;

import com.cruzze.dao.PaymentsDao;
import com.cruzze.dao.RidesDao;
import com.cruzze.dao.UsersDao;
import com.cruzze.dao.DriverDao;
import com.cruzze.entity.Payments;
import com.cruzze.entity.Rides;
import com.cruzze.entity.Users;
import com.cruzze.entity.Drivers;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class PaymentsService {
    @Autowired
    private PaymentsDao paymentsDao;
    @Autowired
    private RidesDao ridesDao;
    @Autowired
    private UsersDao usersDao;
    @Autowired
    private DriverDao driverDao;

    @Value("${razorpay.key_id}")
    private String razorpayKeyId;

    @Value("${razorpay.key_secret}")
    private String razorpayKeySecret;

    private static final String RAZORPAY_ORDER_URL = "https://api.razorpay.com/v1/orders";

    public Map<String, Object> createOrder(BigDecimal amount, String currency, String receipt) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        Map<String, Object> data = new HashMap<>();
        data.put("amount", amount.multiply(BigDecimal.valueOf(100)).intValue()); // Razorpay expects paise
        data.put("currency", currency);
        data.put("receipt", receipt);
        data.put("payment_capture", 1);

        ObjectMapper mapper = new ObjectMapper();
        String requestBody = mapper.writeValueAsString(data);

        String auth = razorpayKeyId + ":" + razorpayKeySecret;
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(RAZORPAY_ORDER_URL))
                .header("Content-Type", "application/json")
                .header("Authorization", "Basic " + encodedAuth)
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new RuntimeException("Failed to create Razorpay order: " + response.body());
        }
        return mapper.readValue(response.body(), Map.class);
    }

    public boolean verifyPaymentSignature(String orderId, String paymentId, String signature) throws Exception {
        // Razorpay signature verification (HMAC SHA256)
        String payload = orderId + "|" + paymentId;
        javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
        mac.init(new javax.crypto.spec.SecretKeySpec(razorpayKeySecret.getBytes(), "HmacSHA256"));
        byte[] hash = mac.doFinal(payload.getBytes());
        StringBuilder sb = new StringBuilder();
        for (byte b : hash) {
            sb.append(String.format("%02x", b));
        }
        String generatedSignature = sb.toString();
        return generatedSignature.equals(signature);
    }

    public Payments savePayment(Payments payment) {
        return paymentsDao.save(payment);
    }

    public Payments createRazorpayPaymentForRide(Long rideId) throws Exception {
        Optional<Rides> rideOpt = ridesDao.findById(rideId);
        if (rideOpt.isEmpty()) throw new RuntimeException("Ride not found");
        Rides ride = rideOpt.get();
        String clerkUserId = ride.getUser() != null ? ride.getUser().getClerkUserId() : null;
        String clerkDriverId = ride.getClerkDriverId();
        BigDecimal amount = ride.getFare();
        String currency = "INR";
        String receipt = "ride-" + rideId;
        Map<String, Object> order = createOrder(amount, currency, receipt);
        Payments payment = new Payments();
        payment.setRide(ride);
        payment.setClerkUserId(clerkUserId);
        payment.setClerkDriverId(clerkDriverId);
        payment.setAmount(amount);
        payment.setPaymentMethod(Payments.PaymentMethod.ONLINE);
        payment.setPaymentGateway("Razorpay");
        payment.setTransactionId((String) order.get("id"));
        payment.setPaymentStatus(Payments.PaymentStatus.PENDING);
        payment.setGatewayResponse(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(order));
        return paymentsDao.save(payment);
    }

    public Optional<Payments> getPaymentByRideId(Long rideId) {
        // You may want to add a custom query in PaymentsRepository for this
        return paymentsDao.findByRideId(rideId);
    }

    public Payments updatePaymentStatus(String razorpayOrderId, String paymentId, String signature, boolean isSuccess) {
        Optional<Payments> paymentOpt = paymentsDao.findByTransactionId(razorpayOrderId);
        if (paymentOpt.isEmpty()) throw new RuntimeException("Payment not found");
        Payments payment = paymentOpt.get();
        payment.setPaymentStatus(isSuccess ? Payments.PaymentStatus.SUCCESS : Payments.PaymentStatus.FAILED);
        payment.setTransactionId(paymentId);
        // Optionally, store signature or gateway response
        paymentsDao.save(payment);
        // Update ride payment status
        Rides ride = payment.getRide();
        if (ride != null) {
            ride.setPaymentStatus(Rides.PaymentStatus.PAID);
            ridesDao.save(ride);
        }
        return payment;
    }
} 