package com.cruzze.dao;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.cruzze.entity.Users;
import com.cruzze.repository.UserRepository;

@Repository
public class UsersDao {

    @Autowired
    private UserRepository userRepository;

    public Users saveUser(Users user) {
        return userRepository.save(user);
    }

    public Optional<Users> findByClerkUserId(String clerkUserId) {
        return userRepository.findByClerkUserId(clerkUserId);
    }

    public Optional<Users> findById(Long id) {
        return userRepository.findById(id);
    }
    
    public Users updateUser(Users user) {
        return userRepository.save(user);
    }

}
