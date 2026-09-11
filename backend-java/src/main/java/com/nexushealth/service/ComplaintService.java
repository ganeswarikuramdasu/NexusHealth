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
import java.util.Set;

@Service
public class ComplaintService {

    private static final Set<String> ALLOWED_STATUSES = Set.of("OPEN", "IN_REVIEW", "TAKEN_ACTION", "RESOLVED", "REJECTED");

    private final ComplaintRepository complaintRepository;
    private final AuditLogService auditLogService;
    private final PatientResolver patientResolver;
    private final MalpracticeService malpracticeService;

    public ComplaintService(ComplaintRepository complaintRepository,
                            AuditLogService auditLogService,
                            PatientResolver patientResolver,
                            MalpracticeService malpracticeService) {
        this.complaintRepository = complaintRepository;
        this.auditLogService = auditLogService;
        this.patientResolver = patientResolver;
        this.malpracticeService = malpracticeService;
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
        if (!"PATIENT".equals(role)) {
            throw ApiException.forbidden("Only patients can raise complaints. Doctors, hospital admins, and super admins can manage incoming complaints.");
        }
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
        String newStatus = req.getStatus();
        if (isBlank(newStatus)) {
            throw ApiException.badRequest("Status is required (e.g. IN_REVIEW, TAKEN_ACTION, RESOLVED, REJECTED).");
        }
        if (!ALLOWED_STATUSES.contains(newStatus)) {
            throw ApiException.badRequest("Unknown complaint status: " + newStatus);
        }
        if ("RESOLVED".equals(complaint.getStatus()) || "REJECTED".equals(complaint.getStatus())) {
            throw ApiException.badRequest("This complaint is already closed (" + complaint.getStatus() + ") and cannot be updated.");
        }
        complaint.setStatus(newStatus);
        complaint.setResolutionNote(req.getResolutionNote());
        complaint.setResolvedBy(req.getResolvedBy());
        complaint.setResolvedAt(LocalDateTime.now());
        complaintRepository.save(complaint);

        if ("TAKEN_ACTION".equals(newStatus) && complaint.getRelatedDoctorId() != null) {
            String actorName = req.getResolvedByName() != null ? req.getResolvedByName() : "Super Admin";
            malpracticeService.increment(complaint.getRelatedDoctorId(), actorName,
                    complaint.getRelatedPatientHealthId(), "now", null);
        }

        auditLogService.log(req.getResolvedByName() != null ? req.getResolvedByName() : "Super Admin", "SUPER_ADMIN",
                "COMPLAINT_" + newStatus, complaint.getRelatedPatientHealthId(),
                "Complaint #" + complaintId + " marked " + newStatus + (req.getResolutionNote() != null ? " - " + req.getResolutionNote() : ""));

        return ApiResponse.ok("Complaint status updated to " + newStatus.replace("_", " ") + ".")
                .with("complaint", toPublic(complaint));
    }

    @Transactional
    public ApiResponse reply(String complaintId, ResolveComplaintRequest req) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> ApiException.notFound("Complaint not found."));
        if ("RESOLVED".equals(complaint.getStatus()) || "REJECTED".equals(complaint.getStatus())) {
            throw ApiException.badRequest("This complaint is already closed (" + complaint.getStatus() + ") and cannot receive replies.");
        }
        if (isBlank(req.getResolutionNote())) {
            throw ApiException.badRequest("Reply message is required.");
        }
        List<Map<String, Object>> replies = complaint.getReplies();
        if (replies == null) replies = new ArrayList<>();
        Map<String, Object> reply = new LinkedHashMap<>();
        reply.put("id", "reply_" + System.currentTimeMillis());
        reply.put("authorId", req.getResolvedBy());
        reply.put("authorName", req.getResolvedByName());
        reply.put("authorRole", req.getAuthorRole() != null ? req.getAuthorRole() : "DOCTOR");
        reply.put("message", req.getResolutionNote().trim());
        reply.put("timestamp", LocalDateTime.now().toString());
        replies.add(reply);
        complaint.setReplies(replies);
        complaint.setUpdatedAt(LocalDateTime.now());
        if (req.getStatus() != null && ALLOWED_STATUSES.contains(req.getStatus())) {
            complaint.setStatus(req.getStatus());
            complaint.setResolutionNote(req.getResolutionNote().trim());
            complaint.setResolvedBy(req.getResolvedBy());
            complaint.setResolvedAt(LocalDateTime.now());
        }
        complaintRepository.save(complaint);

        auditLogService.log(req.getResolvedByName() != null ? req.getResolvedByName() : "Support", "SUPPORT",
                "COMPLAINT_REPLY", complaint.getRelatedPatientHealthId(),
                "Reply on complaint #" + complaintId + ": " + req.getResolutionNote().trim());

        return ApiResponse.ok("Reply posted successfully.")
                .with("complaint", toPublic(complaint));
    }

    public Map<String, Object> stats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("open", complaintRepository.countByStatus("OPEN"));
        stats.put("inReview", complaintRepository.countByStatus("IN_REVIEW"));
        stats.put("takenAction", complaintRepository.countByStatus("TAKEN_ACTION"));
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
        out.put("replies", c.getReplies() != null ? c.getReplies() : List.of());
        out.put("createdAt", c.getCreatedAt() != null ? c.getCreatedAt().toString() : null);
        out.put("resolvedAt", c.getResolvedAt() != null ? c.getResolvedAt().toString() : null);
        return out;
    }
}