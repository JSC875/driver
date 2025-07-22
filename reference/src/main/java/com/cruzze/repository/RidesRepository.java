package com.cruzze.repository;



import com.cruzze.entity.Rides;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RidesRepository extends JpaRepository<Rides, Long> {
}