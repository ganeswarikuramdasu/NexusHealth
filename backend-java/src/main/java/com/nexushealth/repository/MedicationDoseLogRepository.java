package com.nexushealth.repository;

import com.nexushealth.entity.MedicationDoseLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MedicationDoseLogRepository extends JpaRepository<MedicationDoseLog, String> {
    @Query("SELECT d FROM MedicationDoseLog d WHERE d.patientId = :patientId OR d.patientHealthId = :patientId " +
            "ORDER BY d.scheduledDate DESC")
    List<MedicationDoseLog> findForPatient(@Param("patientId") String patientId);

    Optional<MedicationDoseLog> findByMedicationIdAndScheduledDate(String medicationId, LocalDate scheduledDate);
}
