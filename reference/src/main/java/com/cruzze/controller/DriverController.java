 package com.cruzze.controller;

import com.cruzze.entity.Drivers;
import com.cruzze.service.DriverService;
import com.cruzze.util.ResponseStructure;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.cruzze.util.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/drivers")
public class DriverController {

    @Autowired
    private DriverService driverService;

    @PostMapping(value = "/createDrivers", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResponseStructure<Drivers>> createDriver(
             @RequestPart("token") String bearerToken,
            @RequestPart(value = "profileImage", required = false) MultipartFile profileImage,
            @RequestPart(value = "licenseImage", required = false) MultipartFile licenseImage) {

        try {
            String token = bearerToken.replace("Bearer ", "");
            Map<String, Object> claims = JwtUtils.verifyAndExtractPayload(token);

            String userType = (String) claims.get("userType");
            if (!"driver".equalsIgnoreCase(userType)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid userType for driver registration");
            }

            Drivers driver = new Drivers();
            driver.setClerkDriverId((String) claims.get("sub"));
            driver.setFirstName((String) claims.get("firstName"));
            driver.setLastName((String) claims.get("lastName"));
            driver.setPhoneNumber((String) claims.get("phoneNumber"));
            driver.setUserType(userType);

            if (profileImage != null && !profileImage.isEmpty()) {
                driver.setProfileImage(profileImage.getBytes());
            }

            if (licenseImage != null && !licenseImage.isEmpty()) {
                driver.setLicenseImage(licenseImage.getBytes());
            }

            // 🔷 Optionally set referralCode & referredBy from public_metadata
            Map<String, Object> publicMetadata = (Map<String, Object>) claims.get("public_metadata");
            if (publicMetadata != null) {
                String referralCode = (String) publicMetadata.get("referralCode");
                if (referralCode != null && !referralCode.isBlank()) {
                    driver.setReferralCode(referralCode);
                }

                String referredBy = (String) publicMetadata.get("referredBy");
                if (referredBy != null && !referredBy.isBlank()) {
                    driver.setReferredBy(referredBy);
                }
            }

            ResponseStructure<Drivers> response = driverService.createDriver(driver);
            return ResponseEntity.status(response.getStatus()).body(response);

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            e.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error processing driver data", e);
        }
    }


    @GetMapping("/{id}")
    public ResponseEntity<ResponseStructure<Drivers>> getDriverById(@PathVariable Long id) {
        ResponseStructure<Drivers> response = driverService.getDriverById(id);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @GetMapping("get/{id}")
    public ResponseEntity<Drivers> getDriverEntityById(@PathVariable Long id) {
        Drivers driver = driverService.getDriverEntityById(id);
        if (driver != null) {
            return ResponseEntity.ok(driver);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/getDriverByClerkDriverId/{clerkDriverId}")
    public ResponseEntity<ResponseStructure<Drivers>> getDriversByClerkId(@PathVariable String clerkDriverId) {
        ResponseStructure<Drivers> response = driverService.getDriverByClerkId(clerkDriverId);
        return ResponseEntity.status(response.getStatus()).body(response);
    }

    @PutMapping("/update-location/{driverId}")
    public ResponseEntity<ResponseStructure<Drivers>> updateLocation(
            @PathVariable String driverId,
            @RequestBody Map<String, Object> body) {

        BigDecimal lat = new BigDecimal(body.get("latitude").toString());
        BigDecimal lng = new BigDecimal(body.get("longitude").toString());
        Boolean isOnline = Boolean.parseBoolean(body.get("isOnline").toString());

        ResponseStructure<Drivers> response = driverService.updateDriverLocation(driverId, lat, lng, isOnline);
        return ResponseEntity.ok(response);
    }

}
