package com.nexushealth.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "record_access_logs", indexes = {
    @Index(name = "idx_ral_doctor_id", columnList = "doctor_id"),
    @Index(name = "idx_ral_patient_id", columnList = "patient_id"),
    @Index(name = "idx_ral_health_id", columnList = "patient_health_id"),
    @Index(name = "idx_ral_hospital_id", columnList = "hospital_id"),
    @Index(name = "idx_ral_session_id", columnList = "session_id"),
    @Index(name = "idx_ral_appointment_id", columnList = "appointment_id"),
    @Index(name = "idx_ral_timestamp", columnList = "timestamp"),
    @Index(name = "idx_ral_access_status", columnList = "access_status")
})
public class RecordAccessLog {

    @Id
    @Column(length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", referencedColumnName = "id",
                insertable = false, updatable = false,
                foreignKey = @ForeignKey(name = "fk_ral_doctor"))
    private Doctor doctor;

    @Column(name = "doctor_id", length = 64)
    private String doctorId;

    @Column(name = "doctor_name")
    private String doctorName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", referencedColumnName = "id",
                insertable = false, updatable = false,
                foreignKey = @ForeignKey(name = "fk_ral_patient"))
    private User patient;

    @Column(name = "patient_id", length = 64)
    private String patientId;

    @Column(name = "patient_health_id")
    private String patientHealthId;

    @Column(name = "patient_name")
    private String patientName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", referencedColumnName = "id",
                insertable = false, updatable = false,
                foreignKey = @ForeignKey(name = "fk_ral_hospital"))
    private Hospital hospital;

    @Column(name = "hospital_id", length = 64)
    private String hospitalId;

    @Column(name = "hospital_name")
    private String hospitalName;

    @Column(name = "access_method", length = 64)
    private String accessMethod;

    @Column(name = "access_status", length = 32)
    private String accessStatus;

    @Column(name = "access_type", length = 64)
    private String accessType;

    @Column
    private Boolean emergencyFlag = false;

    @Column(length = 500)
    private String reason;

    @Column(name = "denial_reason", length = 64)
    private String denialReason;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "records_accessed", columnDefinition = "JSON")
    private List<String> recordsAccessed = new ArrayList<>();

    @Column(name = "verification_method", length = 64)
    private String verificationMethod;

    @Column(name = "verification_status", length = 32)
    private String verificationStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", referencedColumnName = "id",
                insertable = false, updatable = false,
                foreignKey = @ForeignKey(name = "fk_ral_session"))
    private AccessSession session;

    @Column(name = "session_id", length = 64)
    private String sessionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", referencedColumnName = "id",
                insertable = false, updatable = false,
                foreignKey = @ForeignKey(name = "fk_ral_appointment"))
    private Appointment appointment;

    @Column(name = "appointment_id", length = 64)
    private String appointmentId;

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    public RecordAccessLog() {}

    public static Builder builder() { return new Builder(); }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }
    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
    public User getPatient() { return patient; }
    public void setPatient(User patient) { this.patient = patient; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getPatientHealthId() { return patientHealthId; }
    public void setPatientHealthId(String patientHealthId) { this.patientHealthId = patientHealthId; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public Hospital getHospital() { return hospital; }
    public void setHospital(Hospital hospital) { this.hospital = hospital; }
    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    public String getHospitalName() { return hospitalName; }
    public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }
    public String getAccessMethod() { return accessMethod; }
    public void setAccessMethod(String accessMethod) { this.accessMethod = accessMethod; }
    public String getAccessStatus() { return accessStatus; }
    public void setAccessStatus(String accessStatus) { this.accessStatus = accessStatus; }
    public String getAccessType() { return accessType; }
    public void setAccessType(String accessType) { this.accessType = accessType; }
    public Boolean getEmergencyFlag() { return emergencyFlag; }
    public void setEmergencyFlag(Boolean emergencyFlag) { this.emergencyFlag = emergencyFlag != null ? emergencyFlag : false; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getDenialReason() { return denialReason; }
    public void setDenialReason(String denialReason) { this.denialReason = denialReason; }
    public List<String> getRecordsAccessed() { return recordsAccessed; }
    public void setRecordsAccessed(List<String> recordsAccessed) { this.recordsAccessed = recordsAccessed; }
    public String getVerificationMethod() { return verificationMethod; }
    public void setVerificationMethod(String verificationMethod) { this.verificationMethod = verificationMethod; }
    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }
    public AccessSession getSession() { return session; }
    public void setSession(AccessSession session) { this.session = session; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public Appointment getAppointment() { return appointment; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }
    public String getAppointmentId() { return appointmentId; }
    public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public static class Builder {
        private final RecordAccessLog l = new RecordAccessLog();
        public Builder id(String id) { l.id = id; return this; }
        public Builder doctor(Doctor doctor) { l.doctor = doctor; l.doctorId = doctor.getId(); return this; }
        public Builder doctorId(String doctorId) { l.doctorId = doctorId; return this; }
        public Builder doctorName(String doctorName) { l.doctorName = doctorName; return this; }
        public Builder patient(User patient) { l.patient = patient; l.patientId = patient.getId(); return this; }
        public Builder patientId(String patientId) { l.patientId = patientId; return this; }
        public Builder patientHealthId(String patientHealthId) { l.patientHealthId = patientHealthId; return this; }
        public Builder patientName(String patientName) { l.patientName = patientName; return this; }
        public Builder hospital(Hospital hospital) { l.hospital = hospital; l.hospitalId = hospital.getId(); return this; }
        public Builder hospitalId(String hospitalId) { l.hospitalId = hospitalId; return this; }
        public Builder hospitalName(String hospitalName) { l.hospitalName = hospitalName; return this; }
        public Builder accessMethod(String accessMethod) { l.accessMethod = accessMethod; return this; }
        public Builder accessStatus(String accessStatus) { l.accessStatus = accessStatus; return this; }
        public Builder accessType(String accessType) { l.accessType = accessType; return this; }
        public Builder emergencyFlag(Boolean emergencyFlag) { l.emergencyFlag = emergencyFlag; return this; }
        public Builder reason(String reason) { l.reason = reason; return this; }
        public Builder denialReason(String denialReason) { l.denialReason = denialReason; return this; }
        public Builder recordsAccessed(List<String> recordsAccessed) { l.recordsAccessed = recordsAccessed; return this; }
        public Builder verificationMethod(String verificationMethod) { l.verificationMethod = verificationMethod; return this; }
        public Builder verificationStatus(String verificationStatus) { l.verificationStatus = verificationStatus; return this; }
        public Builder session(AccessSession session) { l.session = session; l.sessionId = session.getId(); return this; }
        public Builder sessionId(String sessionId) { l.sessionId = sessionId; return this; }
        public Builder appointment(Appointment appointment) { l.appointment = appointment; l.appointmentId = appointment.getId(); return this; }
        public Builder appointmentId(String appointmentId) { l.appointmentId = appointmentId; return this; }
        public Builder ipAddress(String ipAddress) { l.ipAddress = ipAddress; return this; }
        public RecordAccessLog build() { return l; }
    }
}
