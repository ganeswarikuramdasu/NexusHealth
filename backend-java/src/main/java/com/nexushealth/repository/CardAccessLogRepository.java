package com.nexushealth.repository;

import com.nexushealth.entity.CardAccessLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CardAccessLogRepository extends JpaRepository<CardAccessLog, String> {
    @Query("SELECT l FROM CardAccessLog l WHERE l.patientId = :patientId OR l.patientHealthId = :patientHealthId " +
            "ORDER BY l.timestamp DESC")
    List<CardAccessLog> findForPatient(@Param("patientId") String patientId, @Param("patientHealthId") String patientHealthId);
}
