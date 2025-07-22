package com.cruzze.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.cruzze.dao.RideTrackingDao;
import com.cruzze.dao.RidesDao;
import com.cruzze.entity.Ride_Tracking;
import com.cruzze.entity.Rides;

@Service
public class RideTrackingService {

    @Autowired
    private RideTrackingDao trackingDao;

    @Autowired
    private RidesDao ridesDao;

    public void track(Long rideId, BigDecimal lat, BigDecimal lng) {
        Rides ride = ridesDao.findById(rideId).orElseThrow(() -> new RuntimeException("Ride not found"));

        Ride_Tracking data = new Ride_Tracking();
        data.setRide(ride);
        data.setLatitude(lat);
        data.setLongitude(lng);
        data.setTimestamp(LocalDateTime.now());

        trackingDao.save(data);
    }

    // Optional: called on ride complete
    public BigDecimal calculateActualDistanceKm(Long rideId) {
        List<Ride_Tracking> points = trackingDao.getTrackingByRideId(rideId);
        double totalKm = 0.0;
        for (int i = 1; i < points.size(); i++) {
            totalKm += haversine(
                points.get(i - 1).getLatitude().doubleValue(),
                points.get(i - 1).getLongitude().doubleValue(),
                points.get(i).getLatitude().doubleValue(),
                points.get(i).getLongitude().doubleValue()
            );
        }
        return BigDecimal.valueOf(totalKm);
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 + Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
