package com.nexushealth.repository;

import com.nexushealth.entity.EmergencySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmergencySessionRepository extends JpaRepository<EmergencySession, String> {
    List<EmergencySession> findByPatientIdOrderByStartedAtDesc(String patientId);
    List<EmergencySession> findByPatientHealthIdOrderByStartedAtDesc(String patientHealthId);
    List<EmergencySession> findByDoctorIdOrderByStartedAtDesc(String doctorId);
    List<EmergencySession> findByHospitalIdOrderByStartedAtDesc(String hospitalId);
    List<EmergencySession> findByStatusOrderByStartedAtDesc(String status);

    @Query("SELECT es FROM EmergencySession es WHERE es.status = 'ACTIVE' AND es.patientId = :patientId")
    List<EmergencySession> findActiveByPatientId(@Param("patientId") String patientId);

    @Query("SELECT es FROM EmergencySession es WHERE es.status = 'ACTIVE' AND es.doctorId = :doctorId")
    List<EmergencySession> findActiveByDoctorId(@Param("doctorId") String doctorId);
}
