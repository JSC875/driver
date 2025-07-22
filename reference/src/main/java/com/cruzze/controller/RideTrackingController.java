package com.cruzze.controller;

import java.math.BigDecimal;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cruzze.service.RideTrackingService;

@RestController
@RequestMapping("/tracking")
public class RideTrackingController {

    @Autowired
    private RideTrackingService rideTrackingService;

    @PostMapping("/update")
    public ResponseEntity<?> trackLocation(@RequestBody Map<String, Object> body) {
        Long rideId = Long.valueOf(body.get("rideId").toString());
        BigDecimal lat = new BigDecimal(body.get("latitude").toString());
        BigDecimal lng = new BigDecimal(body.get("longitude").toString());

        rideTrackingService.track(rideId, lat, lng);
        return ResponseEntity.ok("Location stored");
    }

    @GetMapping("/distance/{rideId}")
    public ResponseEntity<?> getActualDistance(@PathVariable Long rideId) {
        BigDecimal km = rideTrackingService.calculateActualDistanceKm(rideId);
        return ResponseEntity.ok(Map.of("distanceKm", km));
    }
}

