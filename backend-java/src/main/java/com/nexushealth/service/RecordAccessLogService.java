package com.nexushealth.service;

import com.nexushealth.entity.RecordAccessLog;
import com.nexushealth.repository.RecordAccessLogRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Central "who accessed a patient's records" trail - mirrors Node's
 * `addPatientRecordAccessLog` / `mockPatientRecordAccessLogs`. Stored in
 * MySQL (record_access_logs table).
 */
@Service
public class RecordAccessLogService {

    private final RecordAccessLogRepository repository;

    public RecordAccessLogService(RecordAccessLogRepository repository) {
        this.repository = repository;
    }

    @SuppressWarnings("unchecked")
    public RecordAccessLog add(
            String doctorId, String doctorName,
            String patientId, String patientHealthId, String patientName,
            String hospitalId, String hospitalName,
            String accessMethod, String accessStatus, String reason,
            List<String> recordsAccessed, Boolean emergencyFlag,
            String verificationMethod, String verificationStatus,
            String sessionId, String appointmentId, String denialReason) {
        RecordAccessLog log = RecordAccessLog.builder()
                .id("ral_" + System.currentTimeMillis() + "_" + (int) (Math.random() * 1000))
                .doctorId(doctorId)
                .doctorName(doctorName)
                .patientId(patientId)
                .patientHealthId(patientHealthId)
                .patientName(patientName != null ? patientName : "Patient Citizen")
                .hospitalId(hospitalId)
                .hospitalName(hospitalName)
                .accessMethod(accessMethod)
                .accessStatus(accessStatus)
                .reason(reason)
                .recordsAccessed(recordsAccessed != null ? recordsAccessed : new ArrayList<>())
                .emergencyFlag(emergencyFlag != null ? emergencyFlag : false)
                .verificationMethod(verificationMethod)
                .verificationStatus(verificationStatus)
                .sessionId(sessionId)
                .appointmentId(appointmentId)
                .denialReason(denialReason)
                .build();
        return repository.save(log);
    }

    public List<RecordAccessLog> all() {
        return repository.findAllByOrderByTimestampDesc();
    }
}
