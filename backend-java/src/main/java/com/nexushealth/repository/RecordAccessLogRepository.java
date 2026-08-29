package com.nexushealth.repository;

import com.nexushealth.entity.RecordAccessLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RecordAccessLogRepository extends JpaRepository<RecordAccessLog, String> {

    @Query("SELECT l FROM RecordAccessLog l WHERE l.patientId = :patientId OR l.patientHealthId = :patientHealthId " +
            "ORDER BY l.timestamp DESC")
    List<RecordAccessLog> findForPatient(@Param("patientId") String patientId, @Param("patientHealthId") String patientHealthId);

    List<RecordAccessLog> findAllByOrderByTimestampDesc();

    @Query("SELECT l FROM RecordAccessLog l WHERE l.hospitalId = :hospitalId ORDER BY l.timestamp DESC")
    List<RecordAccessLog> findForHospital(@Param("hospitalId") String hospitalId);
}
