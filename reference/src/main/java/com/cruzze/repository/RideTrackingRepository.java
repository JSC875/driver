package com.cruzze.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cruzze.entity.Ride_Tracking;

public interface RideTrackingRepository extends JpaRepository<Ride_Tracking, Long> {
    List<Ride_Tracking> findByRideIdOrderByTimestampAsc(Long rideId);
}

