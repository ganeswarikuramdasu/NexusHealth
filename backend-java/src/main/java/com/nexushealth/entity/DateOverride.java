package com.nexushealth.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "date_overrides", indexes = {
    @Index(name = "idx_date_override_doctor", columnList = "doctor_id"),
    @Index(name = "idx_date_override_date", columnList = "override_date"),
    @Index(name = "idx_date_override_unique", columnList = "doctor_id, override_date", unique = true)
})
public class DateOverride {

    @Id
    @Column(length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false, referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_date_override_doctor"))
    private Doctor doctor;

    @Column(name = "doctor_id", nullable = false, insertable = false, updatable = false, length = 64)
    private String doctorId;

    @Column(name = "override_date", nullable = false)
    private LocalDate overrideDate;

    @Column(nullable = false)
    private Boolean active = true;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "time_slots", columnDefinition = "JSON")
    private List<DoctorSchedule.TimeSlotEntry> timeSlots = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "breaks", columnDefinition = "JSON")
    private List<DoctorSchedule.BreakEntry> breaks = new ArrayList<>();

    @Column(length = 500)
    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public DateOverride() {}

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
    public LocalDate getOverrideDate() { return overrideDate; }
    public void setOverrideDate(LocalDate overrideDate) { this.overrideDate = overrideDate; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public List<DoctorSchedule.TimeSlotEntry> getTimeSlots() { return timeSlots; }
    public void setTimeSlots(List<DoctorSchedule.TimeSlotEntry> timeSlots) { this.timeSlots = timeSlots; }
    public List<DoctorSchedule.BreakEntry> getBreaks() { return breaks; }
    public void setBreaks(List<DoctorSchedule.BreakEntry> breaks) { this.breaks = breaks; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static class Builder {
        private final DateOverride o = new DateOverride();
        public Builder id(String id) { o.id = id; return this; }
        public Builder doctor(Doctor doctor) { o.doctor = doctor; o.doctorId = doctor.getId(); return this; }
        public Builder doctorId(String doctorId) { o.doctorId = doctorId; return this; }
        public Builder overrideDate(LocalDate overrideDate) { o.overrideDate = overrideDate; return this; }
        public Builder active(Boolean active) { o.active = active; return this; }
        public Builder timeSlots(List<DoctorSchedule.TimeSlotEntry> timeSlots) { o.timeSlots = timeSlots; return this; }
        public Builder breaks(List<DoctorSchedule.BreakEntry> breaks) { o.breaks = breaks; return this; }
        public Builder reason(String reason) { o.reason = reason; return this; }
        public DateOverride build() { return o; }
    }
}
