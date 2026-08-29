package com.nexushealth.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Fixed columns match the `appointments` table the Node backend already
 * created. Unlike Node's version, `status` and `appointment_type` here
 * store the exact string the app uses (SCHEDULED, WAITING_FOR_DOCTOR,
 * IN_CONSULTATION, ROUTINE_CONSULTATION, ...) rather than being funneled
 * through a narrower DB-level enum and mapped back approximately - that
 * was losing granularity on read in the Node version. This doesn't change
 * what the frontend sends or receives, it just stores it faithfully.
 * `extra` (JSON) holds fields that aren't queried/joined elsewhere:
 * checkInTime, consultationStartTime/EndTime, investigationTests,
 * prescription, priority.
 */
@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "patient_id", nullable = false, length = 64)
    private String patientId;

    @Column(name = "doctor_id", nullable = false, length = 64)
    private String doctorId;

    @Column(name = "hospital_id", length = 64)
    private String hospitalId;

    @Column(name = "appointment_date", nullable = false)
    private LocalDate appointmentDate;

    @Column(name = "appointment_time", nullable = false)
    private LocalTime appointmentTime;

    @Column(length = 500)
    private String reason;

    @Column(name = "appointment_type", nullable = false, length = 32)
    private String appointmentType = "ROUTINE_CONSULTATION";

    @Column(nullable = false, length = 32)
    private String status = "SCHEDULED";

    @Column(name = "doctor_notes", length = 1000)
    private String doctorNotes;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "extra", columnDefinition = "JSON")
    private Map<String, Object> extra = new LinkedHashMap<>();

    public Appointment() {
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
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
    public LocalDate getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(LocalDate appointmentDate) { this.appointmentDate = appointmentDate; }
    public LocalTime getAppointmentTime() { return appointmentTime; }
    public void setAppointmentTime(LocalTime appointmentTime) { this.appointmentTime = appointmentTime; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getAppointmentType() { return appointmentType; }
    public void setAppointmentType(String appointmentType) { this.appointmentType = appointmentType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getDoctorNotes() { return doctorNotes; }
    public void setDoctorNotes(String doctorNotes) { this.doctorNotes = doctorNotes; }
    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public Map<String, Object> getExtra() { return extra; }
    public void setExtra(Map<String, Object> extra) { this.extra = extra != null ? extra : new LinkedHashMap<>(); }

    public static class Builder {
        private final Appointment a = new Appointment();
        public Builder id(String id) { a.id = id; return this; }
        public Builder patientId(String patientId) { a.patientId = patientId; return this; }
        public Builder doctorId(String doctorId) { a.doctorId = doctorId; return this; }
        public Builder hospitalId(String hospitalId) { a.hospitalId = hospitalId; return this; }
        public Builder appointmentDate(LocalDate appointmentDate) { a.appointmentDate = appointmentDate; return this; }
        public Builder appointmentTime(LocalTime appointmentTime) { a.appointmentTime = appointmentTime; return this; }
        public Builder reason(String reason) { a.reason = reason; return this; }
        public Builder appointmentType(String appointmentType) { a.appointmentType = appointmentType; return this; }
        public Builder status(String status) { a.status = status; return this; }
        public Builder extra(Map<String, Object> extra) { a.extra = extra; return this; }
        public Appointment build() { return a; }
    }
}
