package com.nexushealth.repository;

import com.nexushealth.entity.DietPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DietPlanRepository extends JpaRepository<DietPlan, String> {
    List<DietPlan> findByPatientIdOrderByCreatedDateDesc(String patientId);
    List<DietPlan> findByPatientHealthIdOrderByCreatedDateDesc(String patientHealthId);
    List<DietPlan> findByDoctorIdOrderByCreatedDateDesc(String doctorId);
}
