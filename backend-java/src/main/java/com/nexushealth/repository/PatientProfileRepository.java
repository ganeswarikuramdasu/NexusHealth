package com.nexushealth.repository;

import com.nexushealth.entity.PatientProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PatientProfileRepository extends JpaRepository<PatientProfile, String> {
    Optional<PatientProfile> findByPatientHealthId(String patientHealthId);
}
