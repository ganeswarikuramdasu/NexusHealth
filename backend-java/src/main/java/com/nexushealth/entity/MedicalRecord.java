package com.nexushealth.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Entity
@Table(name = "medical_records")
public class MedicalRecord {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "patient_id", length = 64)
    private String patientId;

    @Column(name = "patient_health_id", nullable = false)
    private String patientHealthId;

    @Column(name = "doctor_id", length = 64)
    private String doctorId;

    @Column(name = "hospital_id", length = 64)
    private String hospitalId;

    @Column(name = "record_type", nullable = false, length = 64)
    private String recordType;

    @Column(nullable = false)
    private String title;

    @Column(length = 500)
    private String diagnosis;

    @Column(name = "clinical_notes", columnDefinition = "TEXT")
    private String clinicalNotes;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;

    @Column(name = "file_url", length = 500)
    private String fileUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "extra", columnDefinition = "JSON")
    private Map<String, Object> extra = new LinkedHashMap<>();

    public MedicalRecord() {
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getPatientHealthId() { return patientHealthId; }
    public void setPatientHealthId(String patientHealthId) { this.patientHealthId = patientHealthId; }
    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    public String getRecordType() { return recordType; }
    public void setRecordType(String recordType) { this.recordType = recordType; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }
    public String getClinicalNotes() { return clinicalNotes; }
    public void setClinicalNotes(String clinicalNotes) { this.clinicalNotes = clinicalNotes; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDate getRecordDate() { return recordDate; }
    public void setRecordDate(LocalDate recordDate) { this.recordDate = recordDate; }
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public Map<String, Object> getExtra() { return extra; }
    public void setExtra(Map<String, Object> extra) { this.extra = extra != null ? extra : new LinkedHashMap<>(); }

    public static class Builder {
        private final MedicalRecord r = new MedicalRecord();
        public Builder id(String id) { r.id = id; return this; }
        public Builder patientId(String patientId) { r.patientId = patientId; return this; }
        public Builder patientHealthId(String patientHealthId) { r.patientHealthId = patientHealthId; return this; }
        public Builder doctorId(String doctorId) { r.doctorId = doctorId; return this; }
        public Builder hospitalId(String hospitalId) { r.hospitalId = hospitalId; return this; }
        public Builder recordType(String recordType) { r.recordType = recordType; return this; }
        public Builder title(String title) { r.title = title; return this; }
        public Builder diagnosis(String diagnosis) { r.diagnosis = diagnosis; return this; }
        public Builder clinicalNotes(String clinicalNotes) { r.clinicalNotes = clinicalNotes; return this; }
        public Builder recordDate(LocalDate recordDate) { r.recordDate = recordDate; return this; }
        public Builder fileUrl(String fileUrl) { r.fileUrl = fileUrl; return this; }
        public Builder extra(Map<String, Object> extra) { r.extra = extra; return this; }
        public MedicalRecord build() { return r; }
    }
}
