package com.nexushealth.service;

import com.nexushealth.common.ApiException;
import com.nexushealth.entity.Doctor;
import com.nexushealth.entity.User;
import com.nexushealth.repository.DoctorRepository;
import com.nexushealth.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Centralizes the malpractice-count rules so every caller (complaint resolution,
 * super-admin manual actions) applies the same increment / threshold logic.
 */
@Service
public class MalpracticeService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final AuditLogService auditLogService;

    public MalpracticeService(UserRepository userRepository,
                              DoctorRepository doctorRepository,
                              AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.auditLogService = auditLogService;
    }

    /**
     * Resolves a doctor's User account from either a Doctor entity id (doc_...)
     * or a User id (u_doc_...), depending on what the caller has on hand.
     */
    public Optional<User> findDoctorUser(String doctorIdOrUserId) {
        if (doctorIdOrUserId == null || doctorIdOrUserId.isBlank()) return Optional.empty();
        User viaUserId = userRepository.findById(doctorIdOrUserId).orElse(null);
        if (viaUserId != null && "DOCTOR".equals(viaUserId.getRole())) return Optional.of(viaUserId);
        Doctor doctor = doctorRepository.findById(doctorIdOrUserId).orElse(null);
        if (doctor == null) {
            doctor = doctorRepository.findByUserId(doctorIdOrUserId).orElse(null);
        }
        if (doctor == null || doctor.getUserId() == null) return Optional.empty();
        User user = userRepository.findById(doctor.getUserId()).orElse(null);
        if (user != null && "DOCTOR".equals(user.getRole())) return Optional.of(user);
        return Optional.empty();
    }

    @Transactional
    @SuppressWarnings("unchecked")
    public User increment(String doctorIdOrUserId, String actorName, String targetPatientHealthId,
                          String actionLabel, String reason) {
        User user = findDoctorUser(doctorIdOrUserId)
                .orElseThrow(() -> ApiException.notFound("Doctor not found."));
        int newCount = user.getMalpracticeCount() + 1;
        user.setMalpracticeCount(newCount);
        if (newCount >= 3) {
            user.setStatus("DELETED");
        }
        userRepository.save(user);

        String effectiveReason = reason != null && !reason.isBlank()
                ? reason : "Confirmed complaint (TAKEN_ACTION)";
        appendHistory(user, newCount, actorName, effectiveReason, actionLabel, newCount >= 3);

        StringBuilder details = new StringBuilder("Doctor ").append(user.getName())
                .append(" malpractice count ")
                .append(actionLabel != null && !actionLabel.isBlank() ? actionLabel : "incremented")
                .append(" to ").append(newCount);
        if (reason != null && !reason.isBlank()) {
            details.append(" - Reason: ").append(reason);
        }
        if (newCount >= 3) {
            details.append(" - ACCOUNT DELETED (threshold reached)");
        }
        auditLogService.log(actorName != null ? actorName : "Super Admin", "SUPER_ADMIN",
                "MALPRACTICE_INCREMENT", targetPatientHealthId, details.toString());
        return user;
    }

    @Transactional
    @SuppressWarnings("unchecked")
    public User reset(String doctorIdOrUserId, String adminName) {
        User user = findDoctorUser(doctorIdOrUserId)
                .orElseThrow(() -> ApiException.notFound("Doctor not found."));
        int prev = user.getMalpracticeCount();
        user.setMalpracticeCount(0);
        if ("DELETED".equals(user.getStatus())) {
            user.setStatus("ACTIVE");
        }
        userRepository.save(user);
        appendHistory(user, 0, adminName != null ? adminName : "Super Admin",
                "Malpractice record manually cleared / account reactivated", "reset to 0", false);
        auditLogService.log(adminName, "SUPER_ADMIN", "MALPRACTICE_RESET", null,
                "Doctor " + user.getName() + " malpractice count reset from " + prev + " to 0.");
        return user;
    }

    /**
     * Persists a human-readable entry (count reached, reason, actor, timestamp)
     * into the linked Doctor's extra JSON so hospital / doctor / patient modules
     * can render the per-increment reason alongside the raw count.
     */
    @SuppressWarnings("unchecked")
    private void appendHistory(User user, int count, String actorName, String reason,
                               String actionLabel, boolean deleted) {
        Doctor doctor = user.getId() != null
                ? doctorRepository.findByUserId(user.getId()).orElse(null) : null;
        if (doctor == null) return;
        Map<String, Object> extra = new LinkedHashMap<>(doctor.getExtra());
        List<Map<String, Object>> history = new ArrayList<>();
        Object existing = extra.get("malpracticeHistory");
        if (existing instanceof List<?> list) {
            for (Object o : list) {
                if (o instanceof Map<?, ?> m) {
                    history.add(new LinkedHashMap<>((Map<String, Object>) m));
                }
            }
        }
        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("count", count);
        entry.put("reason", reason);
        entry.put("actorName", actorName != null ? actorName : "Super Admin");
        entry.put("details", actionLabel);
        entry.put("deleted", deleted);
        entry.put("at", LocalDateTime.now().toString());
        history.add(0, entry);
        extra.put("malpracticeHistory", history);
        doctor.setExtra(extra);
        doctorRepository.save(doctor);
    }
}