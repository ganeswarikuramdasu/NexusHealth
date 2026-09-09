package com.nexushealth.repository;

import com.nexushealth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    Optional<User> findByEmailIgnoreCaseAndRole(String email, String role);
    boolean existsByEmailIgnoreCaseAndRole(String email, String role);
    List<User> findAllByEmailIgnoreCase(String email);
}
