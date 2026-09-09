package com.nexushealth.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "access_sessions", indexes = {
    @Index(name = "idx_access_session_doctor", columnList = "doctor_id"),
    @Index(name = "idx_access_session_patient", columnList = "patient_id"),
    @Index(name = "idx_access_session_hospital", columnList = "hospital_id"),
    @Index(name = "idx_access_session_status", columnList = "status"),
    @Index(name = "idx_access_session_health_id", columnList = "patient_health_id"),
    @Index(name = "idx_access_session_started", columnList = "started_at")
})
public class AccessSession {

    @Id
    @Column(length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false, referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_access_session_doctor"))
    private Doctor doctor;

    @Column(name = "doctor_id", nullable = false, insertable = false, updatable = false, length = 64)
    private String doctorId;

    @Column(name = "doctor_name")
    private String doctorName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_access_session_hospital"))
    private Hospital hospital;

    @Column(name = "hospital_id", insertable = false, updatable = false, length = 64)
    private String hospitalId;

    @Column(name = "hospital_name")
    private String hospitalName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false, referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_access_session_patient"))
    private User patient;

    @Column(name = "patient_id", nullable = false, insertable = false, updatable = false, length = 64)
    private String patientId;

    @Column(name = "patient_health_id")
    private String patientHealthId;

    @Column(name = "patient_name")
    private String patientName;

    @Column(name = "access_method", length = 64)
    private String accessMethod;

    @Column(name = "access_type", length = 32)
    private String accessType;

    @Column(length = 500)
    private String reason;

    @Column(length = 500)
    private String justification;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_access_session_appointment"))
    private Appointment appointment;

    @Column(name = "appointment_id", insertable = false, updatable = false, length = 64)
    private String appointmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "access_card_id", referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_access_session_card"))
    private AccessCard accessCard;

    @Column(name = "access_card_id", insertable = false, updatable = false, length = 64)
    private String accessCardId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "emergency_session_id", referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_access_session_emergency"))
    private EmergencySession emergencySession;

    @Column(name = "emergency_session_id", insertable = false, updatable = false, length = 64)
    private String emergencySessionId;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt = LocalDateTime.now();

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

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public AccessSession() {}

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public static Builder builder() { return new Builder(); }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
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
    public User getPatient() { return patient; }
    public void setPatient(User patient) { this.patient = patient; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getPatientHealthId() { return patientHealthId; }
    public void setPatientHealthId(String patientHealthId) { this.patientHealthId = patientHealthId; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getAccessMethod() { return accessMethod; }
    public void setAccessMethod(String accessMethod) { this.accessMethod = accessMethod; }
    public String getAccessType() { return accessType; }
    public void setAccessType(String accessType) { this.accessType = accessType; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getJustification() { return justification; }
    public void setJustification(String justification) { this.justification = justification; }
    public Appointment getAppointment() { return appointment; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }
    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }
    public AccessCard getAccessCard() { return accessCard; }
    public void setAccessCard(AccessCard accessCard) { this.accessCard = accessCard; }
    public String getAccessCardId() { return accessCardId; }
    public void setAccessCardId(String accessCardId) { this.accessCardId = accessCardId; }
    public EmergencySession getEmergencySession() { return emergencySession; }
    public void setEmergencySession(EmergencySession emergencySession) { this.emergencySession = emergencySession; }
    public String getEmergencySessionId() { return emergencySessionId; }
    public void setEmergencySessionId(String emergencySessionId) { this.emergencySessionId = emergencySessionId; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public LocalDateTime getEndedAt() { return endedAt; }
    public void setEndedAt(LocalDateTime endedAt) { this.endedAt = endedAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public List<String> getRecordsAccessed() { return recordsAccessed; }
    public void setRecordsAccessed(List<String> recordsAccessed) { this.recordsAccessed = recordsAccessed; }
    public List<String> getActionsPerformed() { return actionsPerformed; }
    public void setActionsPerformed(List<String> actionsPerformed) { this.actionsPerformed = actionsPerformed; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static class Builder {
        private final AccessSession s = new AccessSession();
        public Builder id(String id) { s.id = id; return this; }
        public Builder doctor(Doctor doctor) { s.doctor = doctor; s.doctorId = doctor.getId(); return this; }
        public Builder doctorId(String doctorId) { s.doctorId = doctorId; return this; }
        public Builder doctorName(String doctorName) { s.doctorName = doctorName; return this; }
        public Builder hospital(Hospital hospital) { s.hospital = hospital; s.hospitalId = hospital.getId(); return this; }
        public Builder hospitalId(String hospitalId) { s.hospitalId = hospitalId; return this; }
        public Builder hospitalName(String hospitalName) { s.hospitalName = hospitalName; return this; }
        public Builder patient(User patient) { s.patient = patient; s.patientId = patient.getId(); return this; }
        public Builder patientId(String patientId) { s.patientId = patientId; return this; }
        public Builder patientHealthId(String patientHealthId) { s.patientHealthId = patientHealthId; return this; }
        public Builder patientName(String patientName) { s.patientName = patientName; return this; }
        public Builder accessMethod(String accessMethod) { s.accessMethod = accessMethod; return this; }
        public Builder accessType(String accessType) { s.accessType = accessType; return this; }
        public Builder reason(String reason) { s.reason = reason; return this; }
        public Builder justification(String justification) { s.justification = justification; return this; }
        public Builder appointment(Appointment appointment) { s.appointment = appointment; s.appointmentId = appointment.getId(); return this; }
        public Builder accessCard(AccessCard accessCard) { s.accessCard = accessCard; s.accessCardId = accessCard.getId(); return this; }
        public Builder emergencySession(EmergencySession emergencySession) { s.emergencySession = emergencySession; s.emergencySessionId = emergencySession.getId(); return this; }
        public Builder status(String status) { s.status = status; return this; }
        public Builder recordsAccessed(List<String> recordsAccessed) { s.recordsAccessed = recordsAccessed; return this; }
        public Builder actionsPerformed(List<String> actionsPerformed) { s.actionsPerformed = actionsPerformed; return this; }
        public AccessSession build() { return s; }
    }
}
