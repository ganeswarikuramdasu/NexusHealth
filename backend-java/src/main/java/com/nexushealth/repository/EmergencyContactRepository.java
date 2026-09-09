package com.nexushealth.repository;

import com.nexushealth.entity.EmergencyContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmergencyContactRepository extends JpaRepository<EmergencyContact, String> {
    List<EmergencyContact> findByPatientIdOrderByPriorityAsc(String patientId);
    EmergencyContact findByPatientIdAndId(String patientId, String id);
}
