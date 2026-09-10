package com.nexushealth.service;

import com.nexushealth.entity.AuditLog;
import com.nexushealth.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class AuditLogService {

    private static final Logger LOG = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    private static String cut(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }

    public void log(String actorName, String actorRole, String action, String targetPatientHealthId, String details) {
        try {
            AuditLog entry = AuditLog.builder()
                    .id("aud_" + System.currentTimeMillis() + "_" + (int) (Math.random() * 1000))
                    .actorName(cut(actorName, 255))
                    .actorRole(cut(actorRole, 32))
                    .action(cut(action, 128))
                    .targetPatientHealthId(cut(targetPatientHealthId, 255))
                    .details(cut(details, 1000))
                    .ipAddress("127.0.0.1")
                    .build();
            auditLogRepository.save(entry);
        } catch (Exception e) {
            LOG.warn("audit log could not be persisted (best-effort): {}", e.getMessage());
        }
    }
}
