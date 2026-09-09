package com.nexushealth.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "patient_medications", indexes = {
    @Index(name = "idx_med_patient_id", columnList = "patient_id"),
    @Index(name = "idx_med_health_id", columnList = "patient_health_id"),
    @Index(name = "idx_med_doctor_id", columnList = "doctor_id"),
    @Index(name = "idx_med_hospital_id", columnList = "hospital_id"),
    @Index(name = "idx_med_status", columnList = "status"),
    @Index(name = "idx_med_prescription", columnList = "prescription_id")
})
public class PatientMedication {

    @Id
    @Column(length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false, referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_med_patient"))
    private User patient;

    @Column(name = "patient_id", nullable = false, insertable = false, updatable = false, length = 64)
    private String patientId;

    @Column(name = "patient_health_id", nullable = false)
    private String patientHealthId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_med_prescription"))
    private MedicalRecord prescription;

    @Column(name = "prescription_id", insertable = false, updatable = false, length = 64)
    private String prescriptionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_med_doctor"))
    private Doctor doctor;

    @Column(name = "doctor_id", insertable = false, updatable = false, length = 64)
    private String doctorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_med_hospital"))
    private Hospital hospital;

    @Column(name = "hospital_id", insertable = false, updatable = false, length = 64)
    private String hospitalId;

    @Column(name = "medication_name", nullable = false)
    private String medicationName;

    @Column(name = "generic_name")
    private String genericName;

    private String dosage;

    @Column(nullable = false)
    private String unit = "mg";

    private String frequency;

    @Column(nullable = false)
    private String route = "Oral";

    private String timing;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    private String duration;
    private String indication;

    @Column(length = 500)
    private String instructions;

    @Column(nullable = false, length = 32)
    private String status = "ACTIVE";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "discontinued_at")
    private LocalDateTime discontinuedAt;

    @Column(name = "discontinued_by")
    private String discontinuedBy;

    @Column(name = "discontinuation_reason", length = 500)
    private String discontinuationReason;

    public PatientMedication() {}

    @PreUpdate
    public void onUpdate() {
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
    public MedicalRecord getPrescription() { return prescription; }
    public void setPrescription(MedicalRecord prescription) { this.prescription = prescription; }
    public String getPrescriptionId() { return prescriptionId; }
    public void setPrescriptionId(String prescriptionId) { this.prescriptionId = prescriptionId; }
    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }
    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
    public Hospital getHospital() { return hospital; }
    public void setHospital(Hospital hospital) { this.hospital = hospital; }
    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    public String getMedicationName() { return medicationName; }
    public void setMedicationName(String medicationName) { this.medicationName = medicationName; }
    public String getGenericName() { return genericName; }
    public void setGenericName(String genericName) { this.genericName = genericName; }
    public String getDosage() { return dosage; }
    public void setDosage(String dosage) { this.dosage = dosage; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }
    public String getRoute() { return route; }
    public void setRoute(String route) { this.route = route; }
    public String getTiming() { return timing; }
    public void setTiming(String timing) { this.timing = timing; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }
    public String getIndication() { return indication; }
    public void setIndication(String indication) { this.indication = indication; }
    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public LocalDateTime getDiscontinuedAt() { return discontinuedAt; }
    public void setDiscontinuedAt(LocalDateTime discontinuedAt) { this.discontinuedAt = discontinuedAt; }
    public String getDiscontinuedBy() { return discontinuedBy; }
    public void setDiscontinuedBy(String discontinuedBy) { this.discontinuedBy = discontinuedBy; }
    public String getDiscontinuationReason() { return discontinuationReason; }
    public void setDiscontinuationReason(String discontinuationReason) { this.discontinuationReason = discontinuationReason; }

    public static class Builder {
        private final PatientMedication m = new PatientMedication();
        public Builder id(String id) { m.id = id; return this; }
        public Builder patient(User patient) { m.patient = patient; m.patientId = patient.getId(); return this; }
        public Builder patientId(String patientId) { m.patientId = patientId; return this; }
        public Builder patientHealthId(String patientHealthId) { m.patientHealthId = patientHealthId; return this; }
        public Builder prescription(MedicalRecord prescription) { m.prescription = prescription; m.prescriptionId = prescription.getId(); return this; }
        public Builder prescriptionId(String prescriptionId) { m.prescriptionId = prescriptionId; return this; }
        public Builder doctor(Doctor doctor) { m.doctor = doctor; m.doctorId = doctor.getId(); return this; }
        public Builder doctorId(String doctorId) { m.doctorId = doctorId; return this; }
        public Builder hospital(Hospital hospital) { m.hospital = hospital; m.hospitalId = hospital.getId(); return this; }
        public Builder hospitalId(String hospitalId) { m.hospitalId = hospitalId; return this; }
        public Builder medicationName(String medicationName) { m.medicationName = medicationName; return this; }
        public Builder genericName(String genericName) { m.genericName = genericName; return this; }
        public Builder dosage(String dosage) { m.dosage = dosage; return this; }
        public Builder unit(String unit) { m.unit = unit; return this; }
        public Builder frequency(String frequency) { m.frequency = frequency; return this; }
        public Builder route(String route) { m.route = route; return this; }
        public Builder timing(String timing) { m.timing = timing; return this; }
        public Builder startDate(LocalDate startDate) { m.startDate = startDate; return this; }
        public Builder endDate(LocalDate endDate) { m.endDate = endDate; return this; }
        public Builder duration(String duration) { m.duration = duration; return this; }
        public Builder indication(String indication) { m.indication = indication; return this; }
        public Builder instructions(String instructions) { m.instructions = instructions; return this; }
        public Builder status(String status) { m.status = status; return this; }
        public PatientMedication build() { return m; }
    }
}
