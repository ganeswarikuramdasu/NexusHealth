package com.nexushealth.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "medication_dose_logs", indexes = {
    @Index(name = "idx_dose_med_id", columnList = "medication_id"),
    @Index(name = "idx_dose_patient_id", columnList = "patient_id"),
    @Index(name = "idx_dose_health_id", columnList = "patient_health_id"),
    @Index(name = "idx_dose_date", columnList = "scheduled_date"),
    @Index(name = "idx_dose_status", columnList = "status")
})
public class MedicationDoseLog {

    @Id
    @Column(length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medication_id", nullable = false, referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_dose_medication"))
    private PatientMedication medication;

    @Column(name = "medication_id", nullable = false, insertable = false, updatable = false, length = 64)
    private String medicationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_dose_patient"))
    private User patient;

    @Column(name = "patient_id", insertable = false, updatable = false, length = 64)
    private String patientId;

    @Column(name = "patient_health_id")
    private String patientHealthId;

    @Column(name = "medication_name")
    private String medicationName;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Column(name = "scheduled_time", nullable = false)
    private String scheduledTime;

    @Column(name = "actual_time")
    private LocalDateTime actualTime;

    @Column(nullable = false, length = 32)
    private String status = "PENDING";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public MedicationDoseLog() {}

    public static Builder builder() { return new Builder(); }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public PatientMedication getMedication() { return medication; }
    public void setMedication(PatientMedication medication) { this.medication = medication; }
    public String getMedicationId() { return medicationId; }
    public void setMedicationId(String medicationId) { this.medicationId = medicationId; }
    public User getPatient() { return patient; }
    public void setPatient(User patient) { this.patient = patient; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getPatientHealthId() { return patientHealthId; }
    public void setPatientHealthId(String patientHealthId) { this.patientHealthId = patientHealthId; }
    public String getMedicationName() { return medicationName; }
    public void setMedicationName(String medicationName) { this.medicationName = medicationName; }
    public LocalDate getScheduledDate() { return scheduledDate; }
    public void setScheduledDate(LocalDate scheduledDate) { this.scheduledDate = scheduledDate; }
    public String getScheduledTime() { return scheduledTime; }
    public void setScheduledTime(String scheduledTime) { this.scheduledTime = scheduledTime; }
    public LocalDateTime getActualTime() { return actualTime; }
    public void setActualTime(LocalDateTime actualTime) { this.actualTime = actualTime; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static class Builder {
        private final MedicationDoseLog d = new MedicationDoseLog();
        public Builder id(String id) { d.id = id; return this; }
        public Builder medication(PatientMedication medication) { d.medication = medication; d.medicationId = medication.getId(); return this; }
        public Builder medicationId(String medicationId) { d.medicationId = medicationId; return this; }
        public Builder patient(User patient) { d.patient = patient; d.patientId = patient.getId(); return this; }
        public Builder patientId(String patientId) { d.patientId = patientId; return this; }
        public Builder patientHealthId(String patientHealthId) { d.patientHealthId = patientHealthId; return this; }
        public Builder medicationName(String medicationName) { d.medicationName = medicationName; return this; }
        public Builder scheduledDate(LocalDate scheduledDate) { d.scheduledDate = scheduledDate; return this; }
        public Builder scheduledTime(String scheduledTime) { d.scheduledTime = scheduledTime; return this; }
        public Builder actualTime(LocalDateTime actualTime) { d.actualTime = actualTime; return this; }
        public Builder status(String status) { d.status = status; return this; }
        public MedicationDoseLog build() { return d; }
    }
}
