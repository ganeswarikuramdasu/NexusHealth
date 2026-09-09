package com.nexushealth.repository;

import com.nexushealth.entity.DateOverride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DateOverrideRepository extends JpaRepository<DateOverride, String> {
    List<DateOverride> findByDoctorIdOrderByOverrideDateAsc(String doctorId);
    Optional<DateOverride> findByDoctorIdAndOverrideDate(String doctorId, LocalDate overrideDate);
    List<DateOverride> findByDoctorIdAndOverrideDateBetweenOrderByOverrideDateAsc(String doctorId, LocalDate from, LocalDate to);
}
