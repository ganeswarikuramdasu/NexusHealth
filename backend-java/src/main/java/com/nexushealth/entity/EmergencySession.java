package com.nexushealth.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "emergency_sessions", indexes = {
    @Index(name = "idx_emerg_session_patient", columnList = "patient_id"),
    @Index(name = "idx_emerg_session_doctor", columnList = "doctor_id"),
    @Index(name = "idx_emerg_session_hospital", columnList = "hospital_id"),
    @Index(name = "idx_emerg_session_status", columnList = "status"),
    @Index(name = "idx_emerg_session_health_id", columnList = "patient_health_id"),
    @Index(name = "idx_emerg_session_started", columnList = "started_at")
})
public class EmergencySession {

    @Id
    @Column(length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_emerg_session_patient"))
    private User patient;

    @Column(name = "patient_id", insertable = false, updatable = false, length = 64)
    private String patientId;

    @Column(name = "patient_health_id")
    private String patientHealthId;

    @Column(name = "patient_name")
    private String patientName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_emerg_session_doctor"))
    private Doctor doctor;

    @Column(name = "doctor_id", insertable = false, updatable = false, length = 64)
    private String doctorId;

    @Column(name = "doctor_name")
    private String doctorName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_emerg_session_hospital"))
    private Hospital hospital;

    @Column(name = "hospital_id", insertable = false, updatable = false, length = 64)
    private String hospitalId;

    @Column(name = "hospital_name")
    private String hospitalName;

    @Column(name = "identification_method", length = 64)
    private String identificationMethod;

    @Column(name = "emergency_reason", length = 500)
    private String emergencyReason;

    @Column(name = "custom_reason", length = 500)
    private String customReason;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt = LocalDateTime.now();

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(nullable = false, length = 32)
    private String status = "ACTIVE";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "records_accessed", columnDefinition = "JSON")
    private List<String> recordsAccessed = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "actions_performed", columnDefinition = "JSON")
    private List<String> actionsPerformed = new ArrayList<>();

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public EmergencySession() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
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
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }
    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
    public Hospital getHospital() { return hospital; }
    public void setHospital(Hospital hospital) { this.hospital = hospital; }
    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    public String getHospitalName() { return hospitalName; }
    public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }
    public String getIdentificationMethod() { return identificationMethod; }
    public void setIdentificationMethod(String identificationMethod) { this.identificationMethod = identificationMethod; }
    public String getEmergencyReason() { return emergencyReason; }
    public void setEmergencyReason(String emergencyReason) { this.emergencyReason = emergencyReason; }
    public String getCustomReason() { return customReason; }
    public void setCustomReason(String customReason) { this.customReason = customReason; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public LocalDateTime getEndedAt() { return endedAt; }
    public void setEndedAt(LocalDateTime endedAt) { this.endedAt = endedAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public List<String> getRecordsAccessed() { return recordsAccessed; }
    public void setRecordsAccessed(List<String> recordsAccessed) { this.recordsAccessed = recordsAccessed; }
    public List<String> getActionsPerformed() { return actionsPerformed; }
    public void setActionsPerformed(List<String> actionsPerformed) { this.actionsPerformed = actionsPerformed; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static class Builder {
        private final EmergencySession s = new EmergencySession();
        public Builder id(String id) { s.id = id; return this; }
        public Builder patient(User patient) { s.patient = patient; s.patientId = patient.getId(); return this; }
        public Builder patientId(String patientId) { s.patientId = patientId; return this; }
        public Builder patientHealthId(String patientHealthId) { s.patientHealthId = patientHealthId; return this; }
        public Builder patientName(String patientName) { s.patientName = patientName; return this; }
        public Builder doctor(Doctor doctor) { s.doctor = doctor; s.doctorId = doctor.getId(); return this; }
        public Builder doctorId(String doctorId) { s.doctorId = doctorId; return this; }
        public Builder doctorName(String doctorName) { s.doctorName = doctorName; return this; }
        public Builder hospital(Hospital hospital) { s.hospital = hospital; s.hospitalId = hospital.getId(); return this; }
        public Builder hospitalId(String hospitalId) { s.hospitalId = hospitalId; return this; }
        public Builder hospitalName(String hospitalName) { s.hospitalName = hospitalName; return this; }
        public Builder identificationMethod(String identificationMethod) { s.identificationMethod = identificationMethod; return this; }
        public Builder emergencyReason(String emergencyReason) { s.emergencyReason = emergencyReason; return this; }
        public Builder customReason(String customReason) { s.customReason = customReason; return this; }
        public Builder startedAt(LocalDateTime startedAt) { s.startedAt = startedAt; return this; }
        public Builder expiresAt(LocalDateTime expiresAt) { s.expiresAt = expiresAt; return this; }
        public Builder status(String status) { s.status = status; return this; }
        public Builder recordsAccessed(List<String> recordsAccessed) { s.recordsAccessed = recordsAccessed; return this; }
        public Builder actionsPerformed(List<String> actionsPerformed) { s.actionsPerformed = actionsPerformed; return this; }
        public Builder ipAddress(String ipAddress) { s.ipAddress = ipAddress; return this; }
        public EmergencySession build() { return s; }
    }
}
