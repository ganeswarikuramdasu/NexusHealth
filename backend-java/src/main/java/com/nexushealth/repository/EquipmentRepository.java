package com.nexushealth.repository;

import com.nexushealth.entity.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, String> {
    List<Equipment> findByHospitalIdOrderByCategoryAsc(String hospitalId);
    List<Equipment> findByHospitalIdAndCategoryOrderByCategoryAsc(String hospitalId, String category);
    List<Equipment> findByHospitalIdAndStatusOrderByCategoryAsc(String hospitalId, String status);
    long countByHospitalId(String hospitalId);
}
