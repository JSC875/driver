package com.cruzze.service;

import com.cruzze.entity.Rides;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.cruzze.service.SocketIOService;
import java.util.HashMap;
import java.util.Map;

@Service
public class SocketIOServiceImpl implements SocketIOService {

    // 🚀 Railway deployed Node.js REST endpoint
    private static final String SOCKET_REST_URL = "https://roqet-socket.up.railway.app:3000/emit";

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public void sendRideRequest(String driverId, Rides ride) {
        emitEvent("ride_request", "driver:" + driverId, ride);
    }

    @Override
    public void sendRideAccepted(String userId, Rides updatedRide) {
        emitEvent("ride_accepted", "user:" + userId, updatedRide);
    }

    @Override
    public void sendRideCompleted(String userId, Rides ride) {
        emitEvent("ride_completed", "user:" + userId, ride);
    }

    /**
     * Internal helper to POST an event to the Node.js server
     */
    private void emitEvent(String type, String room, Object payload) {
        Map<String, Object> body = new HashMap<>();
        body.put("type", type);
        body.put("room", room);
        body.put("payload", payload);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<String> response =
                restTemplate.postForEntity(SOCKET_REST_URL, request, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Failed to emit event: " + response.getBody());
        } else {
            System.out.printf("✅ Event [%s] sent to room [%s]%n", type, room);
        }
    }
}
