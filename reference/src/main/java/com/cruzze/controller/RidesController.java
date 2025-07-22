package com.cruzze.controller;

import com.cruzze.entity.Drivers;
import com.cruzze.entity.Rides;
import com.cruzze.entity.Users;
import com.cruzze.service.DriverService;
import com.cruzze.service.RidesService;
import com.cruzze.service.UsersService;
import com.cruzze.util.ResponseStructure;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


@RestController
@RequestMapping("/rides")
public class RidesController {
	
	private static final Logger log = LoggerFactory.getLogger(RidesController.class);


    @Autowired
    private RidesService ridesService;

    @Autowired
    private UsersService userService;

    @Autowired
    private DriverService driverService;

    @PostMapping("/rideRequest")
    public ResponseEntity<?> requestRide(@RequestBody Map<String, Object> body) {
        String clerkUserId = body.get("clerkUserId").toString();;
        BigDecimal pickupLat = new BigDecimal(body.get("pickupLatitude").toString());
        BigDecimal pickupLng = new BigDecimal(body.get("pickupLongitude").toString());
        BigDecimal dropLat = new BigDecimal(body.get("dropLatitude").toString());
        BigDecimal dropLng = new BigDecimal(body.get("dropLongitude").toString());
        String notes = (String) body.getOrDefault("notes", "");

        Rides.VehicleType vehicleType = null;
        if (body.containsKey("vehicleType")) {
            vehicleType = Rides.VehicleType.valueOf(body.get("vehicleType").toString());
        }

        Users user = userService.getUserByClerkId(clerkUserId).getData();
        Rides ride = ridesService.requestRide(user, pickupLat, pickupLng, dropLat, dropLng, vehicleType, notes);
        return ResponseEntity.ok(ride);
    }


   
    
    @PostMapping("/accept")
    public ResponseEntity<?> acceptRide(@RequestParam Long rideId,
                                         @RequestParam String clerkDriverId) {
        try {
            log.info("🔁 Accept request received: rideId={}, clerkDriverId={}", rideId, clerkDriverId);

            Optional<Rides> updatedRide = ridesService.assignDriver(rideId, clerkDriverId);

            if (updatedRide.isPresent()) {
                log.info("✔️ Ride assigned successfully: {}", updatedRide.get().getId());
                return ResponseEntity.ok(updatedRide.get());
            } else {
                log.warn("❌ assignDriver returned empty Optional for rideId={}", rideId);
                return ResponseEntity.badRequest().body("Invalid Ride ID or already assigned");
            }

        } catch (Exception ex) {
            log.error("⚠️ Unexpected error while assigning ride", ex);
            return ResponseEntity.status(500).body(Map.of("error", "Internal server error"));
        }
    }


    @GetMapping("/{id}")
    public ResponseEntity<?> getRide(@PathVariable Long id) {
        Optional<Rides> ride = ridesService.getRide(id);
        return ride.map(ResponseEntity::ok)
                   .orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    @PostMapping("/complete")
    public ResponseEntity<Rides> completeRide(@RequestParam Long rideId) {
        Optional<Rides> ride = ridesService.completeRide(rideId);
        if (ride.isPresent()) {
            return ResponseEntity.ok(ride.get());
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Ride ID");
        }
    }


}
