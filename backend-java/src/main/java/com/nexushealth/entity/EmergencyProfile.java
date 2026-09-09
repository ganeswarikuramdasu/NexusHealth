package com.nexushealth.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "emergency_profiles", indexes = {
    @Index(name = "idx_emerg_profile_patient", columnList = "patient_id"),
    @Index(name = "idx_emerg_profile_health_id", columnList = "patient_health_id")
})
public class EmergencyProfile {

    @Id
    @Column(length = 64)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false, unique = true, referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_emerg_profile_patient"))
    private User patient;

    @Column(name = "patient_id", nullable = false, insertable = false, updatable = false, length = 64)
    private String patientId;

    @Column(name = "patient_health_id", nullable = false)
    private String patientHealthId;

    @Column(name = "blood_group", length = 8)
    private String bloodGroup;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "allergies", columnDefinition = "JSON")
    private List<String> allergies = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "critical_conditions", columnDefinition = "JSON")
    private List<String> criticalConditions = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "current_medications", columnDefinition = "JSON")
    private List<String> currentMedications = new ArrayList<>();

    @Column(name = "emergency_notes", columnDefinition = "TEXT")
    private String emergencyNotes;

    @Column(name = "primary_physician")
    private String primaryPhysician;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public EmergencyProfile() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public static Builder builder() { return new Builder(); }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public User getPatient() { return patient; }
    public void setPatient(User patient) { this.patient = patient; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getPatientHealthId() { return patientHealthId; }
    public void setPatientHealthId(String patientHealthId) { this.patientHealthId = patientHealthId; }
    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }
    public List<String> getAllergies() { return allergies; }
    public void setAllergies(List<String> allergies) { this.allergies = allergies; }
    public List<String> getCriticalConditions() { return criticalConditions; }
    public void setCriticalConditions(List<String> criticalConditions) { this.criticalConditions = criticalConditions; }
    public List<String> getCurrentMedications() { return currentMedications; }
    public void setCurrentMedications(List<String> currentMedications) { this.currentMedications = currentMedications; }
    public String getEmergencyNotes() { return emergencyNotes; }
    public void setEmergencyNotes(String emergencyNotes) { this.emergencyNotes = emergencyNotes; }
    public String getPrimaryPhysician() { return primaryPhysician; }
    public void setPrimaryPhysician(String primaryPhysician) { this.primaryPhysician = primaryPhysician; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static class Builder {
        private final EmergencyProfile p = new EmergencyProfile();
        public Builder id(String id) { p.id = id; return this; }
        public Builder patient(User patient) { p.patient = patient; p.patientId = patient.getId(); return this; }
        public Builder patientId(String patientId) { p.patientId = patientId; return this; }
        public Builder patientHealthId(String patientHealthId) { p.patientHealthId = patientHealthId; return this; }
        public Builder bloodGroup(String bloodGroup) { p.bloodGroup = bloodGroup; return this; }
        public Builder allergies(List<String> allergies) { p.allergies = allergies; return this; }
        public Builder criticalConditions(List<String> criticalConditions) { p.criticalConditions = criticalConditions; return this; }
        public Builder currentMedications(List<String> currentMedications) { p.currentMedications = currentMedications; return this; }
        public Builder emergencyNotes(String emergencyNotes) { p.emergencyNotes = emergencyNotes; return this; }
        public Builder primaryPhysician(String primaryPhysician) { p.primaryPhysician = primaryPhysician; return this; }
        public EmergencyProfile build() { return p; }
    }
}
