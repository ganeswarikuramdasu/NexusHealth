package com.nexushealth.repository;

import com.nexushealth.entity.Consent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConsentRepository extends JpaRepository<Consent, String> {
    @Query("SELECT c FROM Consent c WHERE c.patientId = :patientId AND c.status <> 'REVOKED' ORDER BY c.grantedAt DESC")
    List<Consent> findActiveForPatient(@Param("patientId") String patientId);

    Optional<Consent> findByPatientIdAndDoctorId(String patientId, String doctorId);
}
