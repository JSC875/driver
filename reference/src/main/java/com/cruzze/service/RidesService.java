package com.cruzze.service;

import com.cruzze.dao.RidesDao;
import com.cruzze.entity.*;
import com.cruzze.repository.DriverRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RidesService {

    private static final double SEARCH_RADIUS_KM = 5.0; // Range within which drivers will receive requests

    @Autowired
    private RidesDao ridesDao;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private SocketIOService socketIOService;
    
    @Autowired
    private RideTrackingService rideTrackingService;


    public Rides requestRide(Users user, BigDecimal pickupLat, BigDecimal pickupLng,
            BigDecimal dropLat, BigDecimal dropLng,
            Rides.VehicleType vehicleType, String notes) {

            Rides ride = new Rides();
            ride.setUser(user);
            ride.setPickupLatitude(pickupLat);
            ride.setPickupLongitude(pickupLng);
            ride.setDropLatitude(dropLat);
            ride.setDropLongitude(dropLng);
            ride.setVehicleType(vehicleType);
            ride.setNotes(notes);
            ride.setStatus(Rides.RideStatus.PENDING);

// 👇 Calculate distance
BigDecimal distanceKm = BigDecimal.valueOf(
haversine(pickupLat.doubleValue(), pickupLng.doubleValue(),
     dropLat.doubleValue(), dropLng.doubleValue())
);

// 👇 Set pricing logic
BigDecimal baseFare = BigDecimal.valueOf(25); // Base fare
BigDecimal perKmRate = BigDecimal.valueOf(8); // ₹ per km
BigDecimal totalFare = baseFare.add(perKmRate.multiply(distanceKm));

ride.setFare(totalFare); // 👈 set fare in ride

// Save ride
Rides savedRide = ridesDao.save(ride);

// Send to nearby drivers
List<Drivers> nearbyDrivers = driverRepository.findAll().stream()
.filter(driver -> driver.getIsOnline() != null && driver.getIsOnline()
   && driver.getCurrentLatitude() != null && driver.getCurrentLongitude() != null
   && haversine(pickupLat.doubleValue(), pickupLng.doubleValue(),
                driver.getCurrentLatitude().doubleValue(), driver.getCurrentLongitude().doubleValue()) <= SEARCH_RADIUS_KM
   && (vehicleType == null || driver.getVehicle().getVehicleType().name().equals(vehicleType.name()))
)
.collect(Collectors.toList());

for (Drivers driver : nearbyDrivers) {
socketIOService.sendRideRequest(driver.getClerkDriverId(), savedRide);
}

return savedRide;
}


    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of Earth in km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    
    
    public Optional<Rides> assignDriver(Long rideId, String clerkDriverId) {
        Optional<Rides> optionalRide = ridesDao.findById(rideId);
        if (optionalRide.isPresent()) {
            Rides ride = optionalRide.get();

            // ❌ Already accepted by another driver?
            if (ride.getStatus() != Rides.RideStatus.PENDING) {
                return Optional.empty(); 
            }

            // ✅ Assign driverClerkId
            ride.setClerkDriverId(clerkDriverId);
            ride.setStatus(Rides.RideStatus.ACCEPTED);
            Rides updated = ridesDao.save(ride);

            // ✅ Notify user
            socketIOService.sendRideAccepted(ride.getUser().getClerkUserId(), updated);

            return Optional.of(updated);
        }
        return Optional.empty();
    }



    public Optional<Rides> getRide(Long id) {
        return ridesDao.findById(id);
    }
    
    public Optional<Rides> completeRide(Long rideId) {
        Optional<Rides> optionalRide = ridesDao.findById(rideId);
        if (optionalRide.isPresent()) {
            Rides ride = optionalRide.get();

            // 1. Calculate actual distance
            BigDecimal distanceKm = rideTrackingService.calculateActualDistanceKm(rideId);

            // 2. Pricing logic
            BigDecimal baseFare = BigDecimal.valueOf(25); // base fare
            BigDecimal perKmRate = BigDecimal.valueOf(8); // ₹ per km
            BigDecimal totalFare = baseFare.add(perKmRate.multiply(distanceKm));

            // 3. Update ride with fare and status
            ride.setFare(totalFare);
            ride.setStatus(Rides.RideStatus.COMPLETED);
            ride.setPaymentStatus(Rides.PaymentStatus.PAID); // or keep as PENDING

            Rides updated = ridesDao.save(ride);

            // 🔔 Notify user (or driver) that ride is completed
            socketIOService.sendRideCompleted(ride.getUser().getClerkUserId(), updated);


            return Optional.of(updated);
        }
        return Optional.empty();
    }

    
    

}
