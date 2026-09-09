package com.nexushealth.repository;

import com.nexushealth.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, String> {
    List<Department> findByHospitalIdOrderByNameAsc(String hospitalId);
    List<Department> findByHospitalIdAndStatusOrderByNameAsc(String hospitalId, String status);
    Optional<Department> findByHospitalIdAndName(String hospitalId, String name);
    long countByHospitalId(String hospitalId);
    long countByHospitalIdAndStatus(String hospitalId, String status);
}
