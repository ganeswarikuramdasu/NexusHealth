package com.nexushealth.service;

import com.nexushealth.common.ApiException;
import com.nexushealth.common.ApiResponse;
import com.nexushealth.dto.warning.WarningRequests.CreateWarningRequest;
import com.nexushealth.entity.WarningMessage;
import com.nexushealth.repository.WarningMessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class WarningService {

    private final WarningMessageRepository warningMessageRepository;
    private final AuditLogService auditLogService;

    public WarningService(WarningMessageRepository warningMessageRepository, AuditLogService auditLogService) {
        this.warningMessageRepository = warningMessageRepository;
        this.auditLogService = auditLogService;
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    @Transactional
    public ApiResponse create(CreateWarningRequest req) {
        if (isBlank(req.getTitle()) || isBlank(req.getMessage())) {
            throw ApiException.badRequest("Warning title and message are required.");
        }
        String role = req.getTargetRole() != null && !req.getTargetRole().isBlank() ? req.getTargetRole() : "ALL";
        String module = req.getTargetModule() != null && !req.getTargetModule().isBlank() ? req.getTargetModule() : "GENERAL";
        String level = req.getWarnLevel() != null && !req.getWarnLevel().isBlank() ? req.getWarnLevel() : "INFO";

        WarningMessage warning = WarningMessage.builder()
                .id("warn_" + System.currentTimeMillis() + "_" + (int) (Math.random() * 1000))
                .targetRole(role)
                .targetModule(module)
                .warnLevel(level)
                .title(req.getTitle().trim())
                .message(req.getMessage().trim())
                .createdBy(req.getCreatedBy())
                .createdByName(req.getCreatedByName() != null ? req.getCreatedByName() : "Super Admin")
                .active(true)
                .expiresAt(parseExpiry(req.getExpiresAt()))
                .build();
        warningMessageRepository.save(warning);

        auditLogService.log(warning.getCreatedByName(), "SUPER_ADMIN", "WARNING_PUBLISHED", null,
                "Published " + level + " warning \"" + warning.getTitle() + "\" for role " + role + " (module " + module + ")");

        return ApiResponse.ok("Warning published successfully.").with("warning", toPublic(warning));
    }

    public List<Map<String, Object>> visible(String role, String module) {
        String effectiveRole = role != null && !role.isBlank() ? role : "ALL";
        String effectiveModule = module != null && !module.isBlank() ? module : "GENERAL";
        List<WarningMessage> warnings = warningMessageRepository.findVisible(effectiveRole, effectiveModule);
        List<Map<String, Object>> out = new ArrayList<>();
        for (WarningMessage w : warnings) out.add(toPublic(w));
        return out;
    }

    public List<Map<String, Object>> all() {
        List<WarningMessage> warnings = warningMessageRepository.findAllByOrderByCreatedAtDesc();
        List<Map<String, Object>> out = new ArrayList<>();
        for (WarningMessage w : warnings) out.add(toPublic(w));
        return out;
    }

    @Transactional
    public ApiResponse deactivate(String warningId) {
        WarningMessage warning = warningMessageRepository.findById(warningId)
                .orElseThrow(() -> ApiException.notFound("Warning not found."));
        warning.setActive(false);
        warningMessageRepository.save(warning);
        auditLogService.log("Super Admin", "SUPER_ADMIN", "WARNING_DEACTIVATED", null,
                "Deactivated warning \"" + warning.getTitle() + "\".");
        return ApiResponse.ok("Warning deactivated.");
    }

    private static LocalDateTime parseExpiry(String value) {
        if (isBlank(value)) return null;
        try {
            return LocalDateTime.parse(value);
        } catch (Exception e) {
            try {
                return java.time.LocalDate.parse(value).atTime(LocalTime.MAX);
            } catch (Exception ignored) {
                return null;
            }
        }
    }

    private Map<String, Object> toPublic(WarningMessage w) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", w.getId());
        out.put("targetRole", w.getTargetRole());
        out.put("targetModule", w.getTargetModule());
        out.put("warnLevel", w.getWarnLevel());
        out.put("title", w.getTitle());
        out.put("message", w.getMessage());
        out.put("createdBy", w.getCreatedBy());
        out.put("createdByName", w.getCreatedByName());
        out.put("active", w.getActive());
        out.put("createdAt", w.getCreatedAt() != null ? w.getCreatedAt().toString() : null);
        out.put("expiresAt", w.getExpiresAt() != null ? w.getExpiresAt().toString() : null);
        return out;
    }
}