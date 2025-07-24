package com.cruzze.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cruzze.entity.Users;

public interface UserRepository extends JpaRepository<Users, Long> {
    Optional<Users> findByClerkUserId(String clerkUserId);
}
