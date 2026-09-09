package com.nexushealth.repository;

import com.nexushealth.entity.EmergencyProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmergencyProfileRepository extends JpaRepository<EmergencyProfile, String> {
    Optional<EmergencyProfile> findByPatientId(String patientId);
    Optional<EmergencyProfile> findByPatientHealthId(String patientHealthId);
}
