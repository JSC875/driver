package com.cruzze.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.cruzze.entity.Vehicles;
import com.cruzze.service.VehicleService;
import com.cruzze.util.ResponseStructure;

@RestController
@RequestMapping("/vehicles")
public class VehicleController {

    @Autowired
    private VehicleService vehicleService;

    @PostMapping("/registerVehicle")
    public ResponseEntity<ResponseStructure<Vehicles>> createVehicle(@RequestBody Vehicles vehicle) {
        ResponseStructure<Vehicles> response = vehicleService.createVehicle(vehicle);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<ResponseStructure<Vehicles>> getVehicleByDriver(@PathVariable Long driverId) {
        ResponseStructure<Vehicles> response = vehicleService.getVehicleByDriverId(driverId);
        return ResponseEntity.status(response.getStatus()).body(response);
    }
}
