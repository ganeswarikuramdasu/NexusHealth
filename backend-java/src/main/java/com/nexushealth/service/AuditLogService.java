package com.nexushealth.service;

import com.nexushealth.entity.AuditLog;
import com.nexushealth.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class AuditLogService {

    private static final Logger LOG = LoggerFactory.getLogger(AuditLogService.class);

    private final AuditLogRepository auditLogRepository;
    private final TransactionTemplate txTemplate;

    public AuditLogService(AuditLogRepository auditLogRepository,
                           PlatformTransactionManager transactionManager) {
        this.auditLogRepository = auditLogRepository;
        this.txTemplate = new TransactionTemplate(transactionManager);
        this.txTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    private static String cut(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }

    /**
     * Best-effort, side-effect-free audit write. The save runs in its own
     * REQUIRES_NEW transaction (via TransactionTemplate) so a persistence
     * failure can never poison the caller's outer transaction into an
     * unrelated 500 at commit time. Failures are rolled back and swallowed.
     */
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
            txTemplate.execute(status -> {
                auditLogRepository.saveAndFlush(entry);
                return null;
            });
        } catch (Exception e) {
            LOG.warn("audit log could not be persisted (best-effort): {}", e.getMessage());
        }
    }
}
