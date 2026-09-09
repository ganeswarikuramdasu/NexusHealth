package com.nexushealth.repository;

import com.nexushealth.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, String> {
    List<Feedback> findByDoctorIdOrderByCreatedAtDesc(String doctorId);
    List<Feedback> findByPatientIdOrderByCreatedAtDesc(String patientId);
    long countByDoctorId(String doctorId);

    @Query("SELECT COALESCE(AVG(f.rating), 0.0) FROM Feedback f WHERE f.doctorId = :doctorId")
    double avgRatingByDoctorId(@Param("doctorId") String doctorId);
}
