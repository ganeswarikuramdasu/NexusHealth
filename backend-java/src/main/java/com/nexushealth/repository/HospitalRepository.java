package com.nexushealth.repository;

import com.nexushealth.entity.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HospitalRepository extends JpaRepository<Hospital, String> {
    List<Hospital> findAllByOrderByCreatedAtDesc();
    Optional<Hospital> findByAdminUserId(String adminUserId);
}
