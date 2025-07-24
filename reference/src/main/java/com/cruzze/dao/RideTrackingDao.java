package com.cruzze.dao;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.cruzze.entity.Ride_Tracking;
import com.cruzze.repository.RideTrackingRepository;

@Repository
public class RideTrackingDao {

    @Autowired
    private RideTrackingRepository repo;

    public Ride_Tracking save(Ride_Tracking data) {
        return repo.save(data);
    }

    public List<Ride_Tracking> getTrackingByRideId(Long rideId) {
        return repo.findByRideIdOrderByTimestampAsc(rideId);
    }
}
