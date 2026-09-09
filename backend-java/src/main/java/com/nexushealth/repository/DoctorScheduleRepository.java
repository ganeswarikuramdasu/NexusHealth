package com.nexushealth.repository;

import com.nexushealth.entity.DoctorSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorScheduleRepository extends JpaRepository<DoctorSchedule, String> {
    List<DoctorSchedule> findByDoctorIdOrderByDayOfWeekAsc(String doctorId);
    Optional<DoctorSchedule> findByDoctorIdAndDayOfWeek(String doctorId, String dayOfWeek);
    List<DoctorSchedule> findByDoctorIdAndActiveTrueOrderByDayOfWeekAsc(String doctorId);
}
