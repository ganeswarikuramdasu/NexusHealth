package com.nexushealth.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "doctor_schedules", indexes = {
    @Index(name = "idx_doc_sched_doctor", columnList = "doctor_id"),
    @Index(name = "idx_doc_sched_day", columnList = "day_of_week"),
    @Index(name = "idx_doc_sched_unique", columnList = "doctor_id, day_of_week", unique = true)
})
public class DoctorSchedule {

    @Id
    @Column(length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false, referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_doc_sched_doctor"))
    private Doctor doctor;

    @Column(name = "doctor_id", nullable = false, insertable = false, updatable = false, length = 64)
    private String doctorId;

    @Column(name = "day_of_week", nullable = false, length = 16)
    private String dayOfWeek;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "slot_duration_min")
    private Integer slotDurationMin = 15;

    @Column(name = "slot_buffer_min")
    private Integer slotBufferMin = 0;

    @Column(name = "tokens_per_slot")
    private Integer tokensPerSlot = 1;

    @Column(name = "daily_max_limit")
    private Integer dailyMaxLimit = 50;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "time_slots", columnDefinition = "JSON")
    private List<TimeSlotEntry> timeSlots = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "breaks", columnDefinition = "JSON")
    private List<BreakEntry> breaks = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public DoctorSchedule() {}

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
    public String getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Integer getSlotDurationMin() { return slotDurationMin; }
    public void setSlotDurationMin(Integer slotDurationMin) { this.slotDurationMin = slotDurationMin; }
    public Integer getSlotBufferMin() { return slotBufferMin; }
    public void setSlotBufferMin(Integer slotBufferMin) { this.slotBufferMin = slotBufferMin; }
    public Integer getTokensPerSlot() { return tokensPerSlot; }
    public void setTokensPerSlot(Integer tokensPerSlot) { this.tokensPerSlot = tokensPerSlot; }
    public Integer getDailyMaxLimit() { return dailyMaxLimit; }
    public void setDailyMaxLimit(Integer dailyMaxLimit) { this.dailyMaxLimit = dailyMaxLimit; }
    public List<TimeSlotEntry> getTimeSlots() { return timeSlots; }
    public void setTimeSlots(List<TimeSlotEntry> timeSlots) { this.timeSlots = timeSlots; }
    public List<BreakEntry> getBreaks() { return breaks; }
    public void setBreaks(List<BreakEntry> breaks) { this.breaks = breaks; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @Embeddable
    public static class TimeSlotEntry {
        private String id;
        private String slotName;
        private String startTime;
        private String endTime;
        private Integer tokensPerSlot;

        public TimeSlotEntry() {}
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getSlotName() { return slotName; }
        public void setSlotName(String slotName) { this.slotName = slotName; }
        public String getStartTime() { return startTime; }
        public void setStartTime(String startTime) { this.startTime = startTime; }
        public String getEndTime() { return endTime; }
        public void setEndTime(String endTime) { this.endTime = endTime; }
        public Integer getTokensPerSlot() { return tokensPerSlot; }
        public void setTokensPerSlot(Integer tokensPerSlot) { this.tokensPerSlot = tokensPerSlot; }
    }

    @Embeddable
    public static class BreakEntry {
        private String id;
        private String breakName;
        private String startTime;
        private String endTime;

        public BreakEntry() {}
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getBreakName() { return breakName; }
        public void setBreakName(String breakName) { this.breakName = breakName; }
        public String getStartTime() { return startTime; }
        public void setStartTime(String startTime) { this.startTime = startTime; }
        public String getEndTime() { return endTime; }
        public void setEndTime(String endTime) { this.endTime = endTime; }
    }

    public static class Builder {
        private final DoctorSchedule ds = new DoctorSchedule();
        public Builder id(String id) { ds.id = id; return this; }
        public Builder doctor(Doctor doctor) { ds.doctor = doctor; ds.doctorId = doctor.getId(); return this; }
        public Builder doctorId(String doctorId) { ds.doctorId = doctorId; return this; }
        public Builder dayOfWeek(String dayOfWeek) { ds.dayOfWeek = dayOfWeek; return this; }
        public Builder active(Boolean active) { ds.active = active; return this; }
        public Builder slotDurationMin(Integer slotDurationMin) { ds.slotDurationMin = slotDurationMin; return this; }
        public Builder slotBufferMin(Integer slotBufferMin) { ds.slotBufferMin = slotBufferMin; return this; }
        public Builder tokensPerSlot(Integer tokensPerSlot) { ds.tokensPerSlot = tokensPerSlot; return this; }
        public Builder dailyMaxLimit(Integer dailyMaxLimit) { ds.dailyMaxLimit = dailyMaxLimit; return this; }
        public Builder timeSlots(List<TimeSlotEntry> timeSlots) { ds.timeSlots = timeSlots; return this; }
        public Builder breaks(List<BreakEntry> breaks) { ds.breaks = breaks; return this; }
        public DoctorSchedule build() { return ds; }
    }
}
