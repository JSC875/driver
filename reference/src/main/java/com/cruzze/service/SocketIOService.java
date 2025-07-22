package com.cruzze.service;

import com.cruzze.entity.Rides;

public interface SocketIOService {
    void sendRideRequest(String driverId, Rides ride);
    void sendRideAccepted(String userId, Rides updatedRide);
    void sendRideCompleted(String userId, Rides ride);

}
