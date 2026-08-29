package com.nexushealth.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "consents")
public class Consent {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "patient_id", nullable = false, length = 64)
    private String patientId;

    @Column(name = "doctor_id", length = 64)
    private String doctorId;

    @Column(name = "hospital_id", length = 64)
    private String hospitalId;

    @Column(name = "consent_type", nullable = false, length = 32)
    private String consentType = "TEMPORARY";

    @Column(nullable = false, length = 16)
    private String status = "GRANTED";

    @Column(name = "granted_at", nullable = false)
    private LocalDateTime grantedAt = LocalDateTime.now();

    @Column(name = "expires_at")
    private LocalDate expiresAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "scope", columnDefinition = "JSON")
    private List<String> scope = new ArrayList<>();

    @Column(length = 500)
    private String notes;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    public Consent() {
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    public String getConsentType() { return consentType; }
    public void setConsentType(String consentType) { this.consentType = consentType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getGrantedAt() { return grantedAt; }
    public void setGrantedAt(LocalDateTime grantedAt) { this.grantedAt = grantedAt; }
    public LocalDate getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDate expiresAt) { this.expiresAt = expiresAt; }
    public List<String> getScope() { return scope; }
    public void setScope(List<String> scope) { this.scope = scope != null ? scope : new ArrayList<>(); }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getRevokedAt() { return revokedAt; }
    public void setRevokedAt(LocalDateTime revokedAt) { this.revokedAt = revokedAt; }

    public static class Builder {
        private final Consent c = new Consent();
        public Builder id(String id) { c.id = id; return this; }
        public Builder patientId(String patientId) { c.patientId = patientId; return this; }
        public Builder doctorId(String doctorId) { c.doctorId = doctorId; return this; }
        public Builder hospitalId(String hospitalId) { c.hospitalId = hospitalId; return this; }
        public Builder consentType(String consentType) { c.consentType = consentType; return this; }
        public Builder status(String status) { c.status = status; return this; }
        public Builder expiresAt(LocalDate expiresAt) { c.expiresAt = expiresAt; return this; }
        public Builder scope(List<String> scope) { c.scope = scope; return this; }
        public Builder notes(String notes) { c.notes = notes; return this; }
        public Consent build() { return c; }
    }
}
