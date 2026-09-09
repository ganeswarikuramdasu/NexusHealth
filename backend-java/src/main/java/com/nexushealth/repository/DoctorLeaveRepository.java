package com.nexushealth.repository;

import com.nexushealth.entity.DoctorLeave;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DoctorLeaveRepository extends JpaRepository<DoctorLeave, String> {
    List<DoctorLeave> findByDoctorIdOrderByStartDateDesc(String doctorId);
    List<DoctorLeave> findByDoctorIdAndStatusOrderByStartDateDesc(String doctorId, String status);

    @Query("SELECT dl FROM DoctorLeave dl WHERE dl.doctorId = :doctorId AND dl.startDate <= :date AND (dl.endDate IS NULL OR dl.endDate >= :date)")
    List<DoctorLeave> findActiveLeavesOnDate(@Param("doctorId") String doctorId, @Param("date") LocalDate date);

    @Query("SELECT dl FROM DoctorLeave dl WHERE dl.doctorId = :doctorId AND dl.startDate >= :fromDate AND dl.startDate <= :toDate")
    List<DoctorLeave> findByDoctorIdAndDateRange(@Param("doctorId") String doctorId, @Param("fromDate") LocalDate fromDate, @Param("toDate") LocalDate toDate);
}
