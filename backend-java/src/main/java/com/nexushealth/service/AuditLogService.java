package com.nexushealth.service;

import com.nexushealth.entity.AuditLog;
import com.nexushealth.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(String actorName, String actorRole, String action, String targetPatientHealthId, String details) {
        AuditLog entry = AuditLog.builder()
                .id("aud_" + System.currentTimeMillis() + "_" + (int) (Math.random() * 1000))
                .actorName(actorName)
                .actorRole(actorRole)
                .action(action)
                .targetPatientHealthId(targetPatientHealthId)
                .details(details)
                .ipAddress("127.0.0.1")
                .build();
        auditLogRepository.save(entry);
    }
}
