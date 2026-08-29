package com.nexushealth.repository;

import com.nexushealth.entity.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, String> {
    @Query("SELECT r FROM MedicalRecord r WHERE r.patientId = :patientId OR r.patientHealthId = :patientId " +
            "ORDER BY r.recordDate DESC, r.createdAt DESC")
    List<MedicalRecord> findForPatient(@Param("patientId") String patientId);
}
