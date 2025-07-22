package com.cruzze.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.cruzze.entity.Drivers;
import com.cruzze.entity.Users;

public interface DriverRepository extends JpaRepository<Drivers, Long> {
    Optional<Drivers> findById(Long id);
    
    Optional<Drivers> findByClerkDriverId(String clerkDriverId);
}
