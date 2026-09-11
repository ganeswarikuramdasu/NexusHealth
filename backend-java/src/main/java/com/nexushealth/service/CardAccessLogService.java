package com.nexushealth.service;

import com.nexushealth.entity.CardAccessLog;
import com.nexushealth.repository.CardAccessLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CardAccessLogService {

    private static final Logger log = LoggerFactory.getLogger(CardAccessLogService.class);

    private final CardAccessLogRepository cardAccessLogRepository;

    public CardAccessLogService(CardAccessLogRepository cardAccessLogRepository) {
        this.cardAccessLogRepository = cardAccessLogRepository;
    }

    // Best-effort logging. Runs in its own transaction so a log-save failure can
    // never poison (mark rollback-only) an enclosing grant/deny transaction and
    // turn a successful access into an unexpected 500 at commit time.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(CardAccessLog entry) {
        try {
            cardAccessLogRepository.save(entry);
        } catch (Exception e) {
            log.warn("[CardAccessLog] could not persist card access log for card {}: {}",
                    entry.getCardId(), e.toString());
        }
    }
}