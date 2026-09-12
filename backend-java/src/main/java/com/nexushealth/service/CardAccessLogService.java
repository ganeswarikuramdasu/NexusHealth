package com.nexushealth.service;

import com.nexushealth.entity.CardAccessLog;
import com.nexushealth.repository.CardAccessLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class CardAccessLogService {

    private static final Logger log = LoggerFactory.getLogger(CardAccessLogService.class);

    private final CardAccessLogRepository cardAccessLogRepository;
    private final TransactionTemplate txTemplate;

    public CardAccessLogService(CardAccessLogRepository cardAccessLogRepository,
                                PlatformTransactionManager transactionManager) {
        this.cardAccessLogRepository = cardAccessLogRepository;
        this.txTemplate = new TransactionTemplate(transactionManager);
        this.txTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    // Best-effort logging. Runs in its own transaction so a log-save failure can
    // never poison (mark rollback-only) an enclosing grant/deny transaction and
    // turn a successful access into an unexpected 500 at commit time.
    public void record(CardAccessLog entry) {
        try {
            txTemplate.execute(status -> {
                cardAccessLogRepository.saveAndFlush(entry);
                return null;
            });
        } catch (Exception e) {
            log.warn("[CardAccessLog] could not persist card access log for card {}: {}",
                    entry.getCardId(), e.toString());
        }
    }
}