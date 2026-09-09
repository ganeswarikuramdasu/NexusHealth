package com.nexushealth.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "doctor_leaves", indexes = {
    @Index(name = "idx_doc_leave_doctor", columnList = "doctor_id"),
    @Index(name = "idx_doc_leave_dates", columnList = "start_date, end_date"),
    @Index(name = "idx_doc_leave_status", columnList = "status")
})
public class DoctorLeave {

    @Id
    @Column(length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false, referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_doc_leave_doctor"))
    private Doctor doctor;

    @Column(name = "doctor_id", nullable = false, insertable = false, updatable = false, length = 64)
    private String doctorId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "is_full_day", nullable = false)
    private Boolean isFullDay = true;

    @Column(name = "start_time")
    private String startTime;

    @Column(name = "end_time")
    private String endTime;

    @Column(length = 500)
    private String reason;

    @Column(nullable = false, length = 32)
    private String category = "PERSONAL";

    @Column(nullable = false, length = 32)
    private String status = "PENDING";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public DoctorLeave() {}

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
    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }
    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public Boolean getIsFullDay() { return isFullDay; }
    public void setIsFullDay(Boolean isFullDay) { this.isFullDay = isFullDay; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static class Builder {
        private final DoctorLeave l = new DoctorLeave();
        public Builder id(String id) { l.id = id; return this; }
        public Builder doctor(Doctor doctor) { l.doctor = doctor; l.doctorId = doctor.getId(); return this; }
        public Builder doctorId(String doctorId) { l.doctorId = doctorId; return this; }
        public Builder startDate(LocalDate startDate) { l.startDate = startDate; return this; }
        public Builder endDate(LocalDate endDate) { l.endDate = endDate; return this; }
        public Builder isFullDay(Boolean isFullDay) { l.isFullDay = isFullDay; return this; }
        public Builder startTime(String startTime) { l.startTime = startTime; return this; }
        public Builder endTime(String endTime) { l.endTime = endTime; return this; }
        public Builder reason(String reason) { l.reason = reason; return this; }
        public Builder category(String category) { l.category = category; return this; }
        public Builder status(String status) { l.status = status; return this; }
        public DoctorLeave build() { return l; }
    }
}
