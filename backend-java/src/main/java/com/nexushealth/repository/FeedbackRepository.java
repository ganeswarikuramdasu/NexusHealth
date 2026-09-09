package com.nexushealth.repository;

import com.nexushealth.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, String> {
    List<Feedback> findByDoctorIdOrderByCreatedAtDesc(String doctorId);
    List<Feedback> findByPatientIdOrderByCreatedAtDesc(String patientId);
    long countByDoctorId(String doctorId);
    double avgRatingByDoctorId(String doctorId);
}
