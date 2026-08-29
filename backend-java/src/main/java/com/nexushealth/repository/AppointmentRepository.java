package com.nexushealth.repository;

import com.nexushealth.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, String> {

    @Query("SELECT a FROM Appointment a WHERE " +
            "(:patientId IS NULL OR a.patientId = :patientId OR (:patientIdAlt IS NOT NULL AND a.patientId = :patientIdAlt)) AND " +
            "(:doctorId IS NULL OR a.doctorId = :doctorId) AND " +
            "(:hospitalId IS NULL OR a.hospitalId = :hospitalId) " +
            "ORDER BY a.appointmentDate DESC, a.createdAt DESC")
    List<Appointment> search(@Param("patientId") String patientId,
                              @Param("patientIdAlt") String patientIdAlt,
                              @Param("doctorId") String doctorId,
                              @Param("hospitalId") String hospitalId);

    List<Appointment> findByDoctorIdAndAppointmentDateOrderByCreatedAtAsc(String doctorId, LocalDate date);

    @Query("SELECT a FROM Appointment a WHERE a.doctorId = :doctorId AND a.patientId IN :patientIds " +
            "AND a.status NOT IN ('COMPLETED','CANCELLED','NO_SHOW')")
    List<Appointment> findActive(@Param("doctorId") String doctorId, @Param("patientIds") Collection<String> patientIds);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctorId = :doctorId AND a.appointmentDate = :date " +
            "AND a.status NOT IN ('CANCELLED','NO_SHOW')")
    long countOnDate(@Param("doctorId") String doctorId, @Param("date") LocalDate date);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctorId = :doctorId AND a.appointmentDate = :date " +
            "AND a.appointmentTime = :time AND a.status NOT IN ('CANCELLED','NO_SHOW')")
    long countOnSlot(@Param("doctorId") String doctorId, @Param("date") LocalDate date,
                      @Param("time") java.time.LocalTime time);
}
