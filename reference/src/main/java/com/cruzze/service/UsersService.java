package com.cruzze.service;

import java.time.LocalDate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.cruzze.dao.UsersDao;
import com.cruzze.entity.Users;
import com.cruzze.util.ResponseStructure;

@Service
public class UsersService {

    @Autowired
    private UsersDao usersDao;

    public ResponseStructure<Users> createUser(Users user) {
        ResponseStructure<Users> structure = new ResponseStructure<>();

        if (usersDao.findByClerkUserId(user.getClerkUserId()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User already exists with this Clerk User ID");
        }

        Users savedUser = usersDao.saveUser(user);
        structure.setStatus(HttpStatus.CREATED.value());
        structure.setMessage("User created successfully");
        structure.setData(savedUser);
        return structure;
    }

    public ResponseStructure<Users> getUserByClerkId(String clerkUserId) {
        Users user = usersDao.findByClerkUserId(clerkUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with Clerk User ID"));

        ResponseStructure<Users> structure = new ResponseStructure<>();
        structure.setStatus(HttpStatus.OK.value());
        structure.setMessage("User retrieved successfully");
        structure.setData(user);
        return structure;
    }

    public Users getUserById(Long id) {
        return usersDao.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with id: " + id));
    }
    
    
    public Users updateUser(String clerkUserId, MultipartFile profileImage, String emergencyName,
            String emergencyNumber, String dateOfBirth) {

Users existingUser = usersDao.findByClerkUserId(clerkUserId)
.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

try {
if (profileImage != null && !profileImage.isEmpty()) {
existingUser.setProfileImage(profileImage.getBytes());
}

if (emergencyName != null && !emergencyName.isBlank()) {
existingUser.setUserEmergencyContactName(emergencyName);
}

if (emergencyNumber != null && !emergencyNumber.isBlank()) {
existingUser.setUserEmergencyContactNumber(emergencyNumber);
}

if (dateOfBirth != null && !dateOfBirth.isBlank()) {
existingUser.setDateOfBirth(LocalDate.parse(dateOfBirth));
}

return usersDao.saveUser(existingUser);
} catch (Exception e) {
throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Error while updating user", e);
}
}

    
}
