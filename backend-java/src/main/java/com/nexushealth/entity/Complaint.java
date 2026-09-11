package com.nexushealth.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "complaints", indexes = {
    @Index(name = "idx_complaint_complainant", columnList = "complainant_user_id"),
    @Index(name = "idx_complaint_patient", columnList = "related_patient_id"),
    @Index(name = "idx_complaint_doctor", columnList = "related_doctor_id"),
    @Index(name = "idx_complaint_status", columnList = "status"),
    @Index(name = "idx_complaint_module", columnList = "module"),
    @Index(name = "idx_complaint_created", columnList = "created_at")
})
public class Complaint {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "complainant_role", nullable = false, length = 32)
    private String complainantRole;

    @Column(name = "complainant_user_id", length = 64)
    private String complainantUserId;

    @Column(name = "complainant_name", length = 200)
    private String complainantName;

    @Column(nullable = false, length = 64)
    private String module;

    @Column(length = 64)
    private String category;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(name = "related_patient_id", length = 64)
    private String relatedPatientId;

    @Column(name = "related_patient_health_id", length = 64)
    private String relatedPatientHealthId;

    @Column(name = "related_access_log_id", length = 64)
    private String relatedAccessLogId;

    @Column(name = "related_doctor_id", length = 64)
    private String relatedDoctorId;

    @Column(name = "related_doctor_name", length = 200)
    private String relatedDoctorName;

    @Column(name = "accessed_method", length = 64)
    private String accessedMethod;

    @Column(nullable = false, length = 32)
    private String status = "OPEN";

    @Column(name = "resolution_note", length = 1000)
    private String resolutionNote;

    @Column(name = "resolved_by", length = 64)
    private String resolvedBy;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "replies", columnDefinition = "JSON")
    private List<Map<String, Object>> replies = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Complaint() {}

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getComplainantRole() { return complainantRole; }
    public void setComplainantRole(String complainantRole) { this.complainantRole = complainantRole; }
    public String getComplainantUserId() { return complainantUserId; }
    public void setComplainantUserId(String complainantUserId) { this.complainantUserId = complainantUserId; }
    public String getComplainantName() { return complainantName; }
    public void setComplainantName(String complainantName) { this.complainantName = complainantName; }
    public String getModule() { return module; }
    public void setModule(String module) { this.module = module; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getRelatedPatientId() { return relatedPatientId; }
    public void setRelatedPatientId(String relatedPatientId) { this.relatedPatientId = relatedPatientId; }
    public String getRelatedPatientHealthId() { return relatedPatientHealthId; }
    public void setRelatedPatientHealthId(String relatedPatientHealthId) { this.relatedPatientHealthId = relatedPatientHealthId; }
    public String getRelatedAccessLogId() { return relatedAccessLogId; }
    public void setRelatedAccessLogId(String relatedAccessLogId) { this.relatedAccessLogId = relatedAccessLogId; }
    public String getRelatedDoctorId() { return relatedDoctorId; }
    public void setRelatedDoctorId(String relatedDoctorId) { this.relatedDoctorId = relatedDoctorId; }
    public String getRelatedDoctorName() { return relatedDoctorName; }
    public void setRelatedDoctorName(String relatedDoctorName) { this.relatedDoctorName = relatedDoctorName; }
    public String getAccessedMethod() { return accessedMethod; }
    public void setAccessedMethod(String accessedMethod) { this.accessedMethod = accessedMethod; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getResolutionNote() { return resolutionNote; }
    public void setResolutionNote(String resolutionNote) { this.resolutionNote = resolutionNote; }
    public String getResolvedBy() { return resolvedBy; }
    public void setResolvedBy(String resolvedBy) { this.resolvedBy = resolvedBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
    public List<Map<String, Object>> getReplies() { return replies; }
    public void setReplies(List<Map<String, Object>> replies) { this.replies = replies != null ? replies : new ArrayList<>(); }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static class Builder {
        private final Complaint c = new Complaint();
        public Builder id(String id) { c.id = id; return this; }
        public Builder complainantRole(String v) { c.complainantRole = v; return this; }
        public Builder complainantUserId(String v) { c.complainantUserId = v; return this; }
        public Builder complainantName(String v) { c.complainantName = v; return this; }
        public Builder module(String v) { c.module = v; return this; }
        public Builder category(String v) { c.category = v; return this; }
        public Builder title(String v) { c.title = v; return this; }
        public Builder description(String v) { c.description = v; return this; }
        public Builder relatedPatientId(String v) { c.relatedPatientId = v; return this; }
        public Builder relatedPatientHealthId(String v) { c.relatedPatientHealthId = v; return this; }
        public Builder relatedAccessLogId(String v) { c.relatedAccessLogId = v; return this; }
        public Builder relatedDoctorId(String v) { c.relatedDoctorId = v; return this; }
        public Builder relatedDoctorName(String v) { c.relatedDoctorName = v; return this; }
        public Builder accessedMethod(String v) { c.accessedMethod = v; return this; }
        public Builder status(String v) { c.status = v; return this; }
        public Builder resolutionNote(String v) { c.resolutionNote = v; return this; }
        public Builder resolvedBy(String v) { c.resolvedBy = v; return this; }
        public Builder replies(List<Map<String, Object>> v) { c.replies = v; return this; }
        public Complaint build() { return c; }
    }
}