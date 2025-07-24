package com.cruzze.service;

import java.math.BigDecimal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.cruzze.dao.DriverDao;
import com.cruzze.entity.Drivers;
import com.cruzze.entity.Users;
import com.cruzze.util.ResponseStructure;

@Service
public class DriverService {

    @Autowired
    private DriverDao driverDao;

    public ResponseStructure<Drivers> createDriver(Drivers driver) {
        Drivers saved = driverDao.saveDriver(driver);

        ResponseStructure<Drivers> structure = new ResponseStructure<>();
        structure.setStatus(HttpStatus.CREATED.value());
        structure.setMessage("Driver created successfully");
        structure.setData(saved);
        return structure;
    }

    public ResponseStructure<Drivers> getDriverById(Long id) {
        Drivers driver = driverDao.getDriverById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));

        ResponseStructure<Drivers> structure = new ResponseStructure<>();
        structure.setStatus(HttpStatus.OK.value());
        structure.setMessage("Driver fetched successfully");
        structure.setData(driver);
        return structure;
    }

    public Drivers getDriverEntityById(Long id) {
        return driverDao.getDriverById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found with id: " + id));
    }
    
    public ResponseStructure<Drivers> getDriverByClerkId(String clerkUserId) {
        Drivers drivers = driverDao.getDriverByClerkId(clerkUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with Clerk User ID"));

        ResponseStructure<Drivers> structure = new ResponseStructure<>();
        structure.setStatus(HttpStatus.OK.value());
        structure.setMessage("User retrieved successfully");
        structure.setData(drivers);
        return structure;
    }
    
    
    
    
    public ResponseStructure<Drivers> updateDriverLocation(String driverId, BigDecimal lat, BigDecimal lng, Boolean isOnline) {
        Drivers updatedDriver = driverDao.updateDriverLocation(driverId, lat, lng, isOnline);

        ResponseStructure<Drivers> structure = new ResponseStructure<>();
        structure.setStatus(200);
        structure.setMessage("Driver location updated successfully");
        structure.setData(updatedDriver);
        return structure;
    }


}
