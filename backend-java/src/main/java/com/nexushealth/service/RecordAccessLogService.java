package com.nexushealth.service;

import com.nexushealth.entity.RecordAccessLog;
import com.nexushealth.repository.RecordAccessLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger LOG = LoggerFactory.getLogger(RecordAccessLogService.class);

    private final RecordAccessLogRepository repository;

    public RecordAccessLogService(RecordAccessLogRepository repository) {
        this.repository = repository;
    }

    private static String cut(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
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
                .id(cut("ral_" + System.currentTimeMillis() + "_" + (int) (Math.random() * 1000), 64))
                .doctorId(cut(doctorId, 64))
                .doctorName(cut(doctorName, 255))
                .patientId(cut(patientId, 64))
                .patientHealthId(cut(patientHealthId, 255))
                .patientName(cut(patientName != null ? patientName : "Patient Citizen", 255))
                .hospitalId(cut(hospitalId, 64))
                .hospitalName(cut(hospitalName, 255))
                .accessMethod(cut(accessMethod, 64))
                .accessStatus(cut(accessStatus, 32))
                .reason(cut(reason, 500))
                .recordsAccessed(recordsAccessed != null ? recordsAccessed : new ArrayList<>())
                .emergencyFlag(emergencyFlag != null ? emergencyFlag : false)
                .verificationMethod(cut(verificationMethod, 64))
                .verificationStatus(cut(verificationStatus, 32))
                .sessionId(cut(sessionId, 64))
                .appointmentId(cut(appointmentId, 64))
                .denialReason(cut(denialReason, 64))
                .build();
        try {
            return repository.save(log);
        } catch (Exception e) {
            LOG.warn("record access log could not be persisted (best-effort): {}", e.getMessage());
            return log;
        }
    }

    public List<RecordAccessLog> all() {
        return repository.findAllByOrderByTimestampDesc();
    }
}
