package com.nexushealth.repository;

import com.nexushealth.entity.AccessSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccessSessionRepository extends JpaRepository<AccessSession, String> {
    List<AccessSession> findByDoctorIdOrderByStartedAtDesc(String doctorId);
    List<AccessSession> findByPatientIdOrderByStartedAtDesc(String patientId);
    List<AccessSession> findByPatientHealthIdOrderByStartedAtDesc(String patientHealthId);
    List<AccessSession> findByHospitalIdOrderByStartedAtDesc(String hospitalId);

    @Query("SELECT a FROM AccessSession a WHERE a.status = 'ACTIVE' AND a.doctorId = :doctorId")
    List<AccessSession> findActiveByDoctorId(@Param("doctorId") String doctorId);

    @Query("SELECT a FROM AccessSession a WHERE a.status = 'ACTIVE' AND a.patientId = :patientId")
    List<AccessSession> findActiveByPatientId(@Param("patientId") String patientId);
}
