package com.cruzze.dao;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.cruzze.entity.Vehicles;
import com.cruzze.repository.VehicleRepository;

@Repository
public class VehicleDao {

    @Autowired
    private VehicleRepository vehicleRepository;

    public Vehicles saveVehicle(Vehicles vehicle) {
        return vehicleRepository.save(vehicle);
    }

    public Vehicles getVehicleByDriverId(Long driverId) {
        return vehicleRepository.findByDriverId(driverId);
    }
}
