package com.cruzze.dao;

import java.math.BigDecimal;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.cruzze.entity.Drivers;
import com.cruzze.repository.DriverRepository;

@Repository
public class DriverDao {

    @Autowired
    private DriverRepository driverRepository;

    public Drivers saveDriver(Drivers driver) {
        return driverRepository.save(driver);
    }

    public Optional<Drivers> getDriverById(Long id) {
        return driverRepository.findById(id);
    }
    
    public Optional<Drivers> getDriverByClerkId(String id) {
        return driverRepository.findByClerkDriverId(id);
    }
    
    
    
    
    public Drivers updateDriverLocation(String driverId, BigDecimal lat, BigDecimal lng, Boolean isOnline) {
        Drivers driver = driverRepository.findByClerkDriverId(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found"));
        driver.setCurrentLatitude(lat);
        driver.setCurrentLongitude(lng);
        driver.setIsOnline(isOnline);
        driver.setLastLocationUpdate(java.time.LocalDateTime.now());
        return driverRepository.save(driver);
    }


}
