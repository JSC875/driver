package com.cruzze.dao;



import com.cruzze.entity.Rides;
import com.cruzze.repository.RidesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class RidesDao {

    @Autowired
    private RidesRepository ridesRepository;

    public Rides save(Rides ride) {
        return ridesRepository.save(ride);
    }

    public Optional<Rides> findById(Long id) {
        return ridesRepository.findById(id);
    }
}

