package com.nexushealth.service;

import com.nexushealth.common.ApiException;
import com.nexushealth.common.ApiResponse;
import com.nexushealth.dto.complaint.ComplaintRequests.RaiseComplaintRequest;
import com.nexushealth.dto.complaint.ComplaintRequests.ResolveComplaintRequest;
import com.nexushealth.entity.Complaint;
import com.nexushealth.repository.ComplaintRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final AuditLogService auditLogService;
    private final PatientResolver patientResolver;

    public ComplaintService(ComplaintRepository complaintRepository,
                            AuditLogService auditLogService,
                            PatientResolver patientResolver) {
        this.complaintRepository = complaintRepository;
        this.auditLogService = auditLogService;
        this.patientResolver = patientResolver;
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    @Transactional
    public ApiResponse raise(RaiseComplaintRequest req) {
        if (isBlank(req.getTitle()) || isBlank(req.getDescription())) {
            throw ApiException.badRequest("Complaint title and description are required.");
        }
        if (isBlank(req.getModule())) {
            throw ApiException.badRequest("Complaint module is required.");
        }
        String role = req.getRole() != null ? req.getRole() : "PATIENT";
        String userId = req.getUserId();
        String userName = req.getUserName();
        if (isBlank(userName)) {
            userName = "User";
        }

        Complaint complaint = Complaint.builder()
                .id("comp_" + System.currentTimeMillis() + "_" + (int) (Math.random() * 1000))
                .complainantRole(role)
                .complainantUserId(userId)
                .complainantName(userName)
                .module(req.getModule())
                .category(req.getCategory() != null ? req.getCategory() : "GENERAL")
                .title(req.getTitle().trim())
                .description(req.getDescription().trim())
                .relatedPatientId(req.getRelatedPatientId())
                .relatedPatientHealthId(req.getRelatedPatientHealthId())
                .relatedAccessLogId(req.getRelatedAccessLogId())
                .relatedDoctorId(req.getRelatedDoctorId())
                .relatedDoctorName(req.getRelatedDoctorName())
                .accessedMethod(req.getAccessedMethod())
                .status("OPEN")
                .build();
        complaintRepository.save(complaint);

        String targetHealthId = req.getRelatedPatientHealthId();
        auditLogService.log(userName, role, "COMPLAINT_RAISED", targetHealthId,
                "Filed complaint #" + complaint.getId() + " in " + req.getModule() + ": " + complaint.getTitle());

        return ApiResponse.ok("Complaint filed successfully. The Super Admin team will review it.")
                .with("complaint", toPublic(complaint));
    }

    public List<Map<String, Object>> forRole(String role, String userId) {
        List<Complaint> all = complaintRepository.findAllByOrderByCreatedAtDesc();
        List<Map<String, Object>> out = new ArrayList<>();
        for (Complaint c : all) {
            boolean show = false;
            if (userId != null && userId.equals(c.getComplainantUserId())) show = true;
            if (userId != null && userId.equals(c.getRelatedPatientId())) show = true;
            if (userId != null && userId.equals(c.getRelatedDoctorId())) show = true;
            if ("SUPER_ADMIN".equals(role) || "HOSPITAL_ADMIN".equals(role)) show = true;
            if (show) out.add(toPublic(c));
        }
        return out;
    }

    @Transactional
    public ApiResponse resolve(String complaintId, ResolveComplaintRequest req) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> ApiException.notFound("Complaint not found."));
        if ("OPEN".equals(complaint.getStatus()) && req.getStatus() == null) {
            throw ApiException.badRequest("Resolution status is required to close a complaint.");
        }
        String newStatus = req.getStatus() != null ? req.getStatus() : "RESOLVED";
        complaint.setStatus(newStatus);
        complaint.setResolutionNote(req.getResolutionNote());
        complaint.setResolvedBy(req.getResolvedBy());
        complaint.setResolvedAt(LocalDateTime.now());
        complaintRepository.save(complaint);

        auditLogService.log(req.getResolvedByName() != null ? req.getResolvedByName() : "Super Admin", "SUPER_ADMIN",
                "COMPLAINT_" + newStatus, complaint.getRelatedPatientHealthId(),
                "Complaint #" + complaintId + " marked " + newStatus + (req.getResolutionNote() != null ? " - " + req.getResolutionNote() : ""));

        return ApiResponse.ok("Complaint " + newStatus.toLowerCase() + ".")
                .with("complaint", toPublic(complaint));
    }

    public Map<String, Object> stats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("open", complaintRepository.countByStatus("OPEN"));
        stats.put("inReview", complaintRepository.countByStatus("IN_REVIEW"));
        stats.put("resolved", complaintRepository.countByStatus("RESOLVED"));
        stats.put("rejected", complaintRepository.countByStatus("REJECTED"));
        return stats;
    }

    private Map<String, Object> toPublic(Complaint c) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", c.getId());
        out.put("complainantRole", c.getComplainantRole());
        out.put("complainantUserId", c.getComplainantUserId());
        out.put("complainantName", c.getComplainantName());
        out.put("module", c.getModule());
        out.put("category", c.getCategory());
        out.put("title", c.getTitle());
        out.put("description", c.getDescription());
        out.put("relatedPatientId", c.getRelatedPatientId());
        out.put("relatedPatientHealthId", c.getRelatedPatientHealthId());
        out.put("relatedAccessLogId", c.getRelatedAccessLogId());
        out.put("relatedDoctorId", c.getRelatedDoctorId());
        out.put("relatedDoctorName", c.getRelatedDoctorName());
        out.put("accessedMethod", c.getAccessedMethod());
        out.put("status", c.getStatus());
        out.put("resolutionNote", c.getResolutionNote());
        out.put("resolvedBy", c.getResolvedBy());
        out.put("createdAt", c.getCreatedAt() != null ? c.getCreatedAt().toString() : null);
        out.put("resolvedAt", c.getResolvedAt() != null ? c.getResolvedAt().toString() : null);
        return out;
    }
}