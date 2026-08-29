package com.nexushealth.repository;

import com.nexushealth.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DoctorRepository extends JpaRepository<Doctor, String> {
    List<Doctor> findAllByOrderByCreatedAtDesc();
    Optional<Doctor> findByUserId(String userId);
    List<Doctor> findByHospitalId(String hospitalId);
}
