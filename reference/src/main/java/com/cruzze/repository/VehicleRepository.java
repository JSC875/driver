package com.cruzze.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.cruzze.entity.Vehicles;

public interface VehicleRepository extends JpaRepository<Vehicles, Long> {
    Vehicles findByDriverId(Long driverId);
}
