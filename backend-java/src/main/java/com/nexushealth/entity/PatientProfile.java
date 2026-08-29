package com.nexushealth.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "patient_profiles")
public class PatientProfile {

    @Id
    @Column(name = "user_id", length = 64)
    private String userId;

    @Column(name = "patient_health_id", nullable = false, unique = true)
    private String patientHealthId;

    @Column(name = "blood_group", length = 8)
    private String bloodGroup;

    @Column(name = "height_cm")
    private BigDecimal heightCm;

    @Column(name = "weight_kg")
    private BigDecimal weightKg;

    @Column(name = "emergency_notes")
    private String emergencyNotes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public PatientProfile() {
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getPatientHealthId() { return patientHealthId; }
    public void setPatientHealthId(String patientHealthId) { this.patientHealthId = patientHealthId; }

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

    public BigDecimal getHeightCm() { return heightCm; }
    public void setHeightCm(BigDecimal heightCm) { this.heightCm = heightCm; }

    public BigDecimal getWeightKg() { return weightKg; }
    public void setWeightKg(BigDecimal weightKg) { this.weightKg = weightKg; }

    public String getEmergencyNotes() { return emergencyNotes; }
    public void setEmergencyNotes(String emergencyNotes) { this.emergencyNotes = emergencyNotes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static class Builder {
        private final PatientProfile profile = new PatientProfile();

        public Builder userId(String userId) { profile.userId = userId; return this; }
        public Builder patientHealthId(String patientHealthId) { profile.patientHealthId = patientHealthId; return this; }
        public Builder bloodGroup(String bloodGroup) { profile.bloodGroup = bloodGroup; return this; }
        public Builder heightCm(BigDecimal heightCm) { profile.heightCm = heightCm; return this; }
        public Builder weightKg(BigDecimal weightKg) { profile.weightKg = weightKg; return this; }
        public Builder emergencyNotes(String emergencyNotes) { profile.emergencyNotes = emergencyNotes; return this; }

        public PatientProfile build() { return profile; }
    }
}

