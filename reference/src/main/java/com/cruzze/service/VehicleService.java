package com.cruzze.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.cruzze.dao.DriverDao;
import com.cruzze.dao.VehicleDao;
import com.cruzze.entity.Drivers;
import com.cruzze.entity.Vehicles;
import com.cruzze.util.ResponseStructure;

@Service
public class VehicleService {

    @Autowired
    private VehicleDao vehicleDao;

    @Autowired
    private DriverDao driverDao;

    public ResponseStructure<Vehicles> createVehicle(Vehicles vehicle) {
        String driverId = vehicle.getDriver().getClerkDriverId();
        Drivers driver = driverDao.getDriverByClerkId(driverId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));

        vehicle.setDriver(driver);
        Vehicles saved = vehicleDao.saveVehicle(vehicle);

        ResponseStructure<Vehicles> structure = new ResponseStructure<>();
        structure.setStatus(HttpStatus.CREATED.value());
        structure.setMessage("Vehicle added successfully");
        structure.setData(saved);
        return structure;
    }

    public ResponseStructure<Vehicles> getVehicleByDriverId(Long driverId) {
        Vehicles vehicle = vehicleDao.getVehicleByDriverId(driverId);

        if (vehicle == null)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found");

        ResponseStructure<Vehicles> structure = new ResponseStructure<>();
        structure.setStatus(HttpStatus.OK.value());
        structure.setMessage("Vehicle fetched successfully");
        structure.setData(vehicle);
        return structure;
    }
}
