package com.nexushealth.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

import java.time.LocalDateTime;

@Entity
@Table(name = "feedbacks", indexes = {
    @Index(name = "idx_feedback_doctor_id", columnList = "doctor_id"),
    @Index(name = "idx_feedback_patient_id", columnList = "patient_id"),
    @Index(name = "idx_feedback_created_at", columnList = "created_at")
})
public class Feedback {

    @Id
    @Column(length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false, referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_feedback_patient"))
    private User patient;

    @Column(name = "patient_id", nullable = false, insertable = false, updatable = false, length = 64)
    private String patientId;

    @Column(name = "patient_name")
    private String patientName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false, referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_feedback_doctor"))
    private Doctor doctor;

    @Column(name = "doctor_id", nullable = false, insertable = false, updatable = false, length = 64)
    private String doctorId;

    @Column(name = "doctor_name")
    private String doctorName;

    @Column(nullable = false)
    private Integer rating = 5;

    @Column(columnDefinition = "TEXT")
    private String comment = "";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Feedback() {}

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
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }
    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static class Builder {
        private final Feedback f = new Feedback();
        public Builder id(String id) { f.id = id; return this; }
        public Builder patient(User patient) { f.patient = patient; f.patientId = patient.getId(); return this; }
        public Builder patientId(String patientId) { f.patientId = patientId; return this; }
        public Builder patientName(String patientName) { f.patientName = patientName; return this; }
        public Builder doctor(Doctor doctor) { f.doctor = doctor; f.doctorId = doctor.getId(); return this; }
        public Builder doctorId(String doctorId) { f.doctorId = doctorId; return this; }
        public Builder doctorName(String doctorName) { f.doctorName = doctorName; return this; }
        public Builder rating(Integer rating) { f.rating = rating; return this; }
        public Builder comment(String comment) { f.comment = comment; return this; }
        public Feedback build() { return f; }
    }
}
