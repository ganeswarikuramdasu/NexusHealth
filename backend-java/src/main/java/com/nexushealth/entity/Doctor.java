package com.nexushealth.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "doctors", indexes = {
    @Index(name = "idx_doctor_user_id", columnList = "user_id"),
    @Index(name = "idx_doctor_hospital_id", columnList = "hospital_id"),
    @Index(name = "idx_doctor_status", columnList = "status"),
    @Index(name = "idx_doctor_specialization", columnList = "specialization"),
    @Index(name = "idx_doctor_license", columnList = "medical_license_number")
})
public class Doctor {

    @Id
    @Column(length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_doctor_user"))
    private User user;

    @Column(name = "user_id", insertable = false, updatable = false, length = 64)
    private String userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_doctor_hospital"))
    private Hospital hospital;

    @Column(name = "hospital_id", insertable = false, updatable = false, length = 64)
    private String hospitalId;

    @Column(name = "hospital_name")
    private String hospitalName;

    @Column(nullable = false)
    private String name;

    private String email;

    private String specialization;

    @Column(name = "medical_license_number")
    private String licenseNumber;

    @Column(name = "consultation_fee")
    private BigDecimal fee = BigDecimal.valueOf(1000);

    @Column(nullable = false, length = 32)
    private String status = "APPROVED";

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "extra", columnDefinition = "JSON")
    private Map<String, Object> extra = new LinkedHashMap<>();

    @OneToMany(mappedBy = "doctor", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DoctorSchedule> schedules = new ArrayList<>();

    @OneToMany(mappedBy = "doctor", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DoctorLeave> leaves = new ArrayList<>();

    @OneToMany(mappedBy = "doctor", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DateOverride> dateOverrides = new ArrayList<>();

    @OneToMany(mappedBy = "doctor", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Feedback> feedbacks = new ArrayList<>();

    @OneToMany(mappedBy = "doctor", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DietPlan> dietPlans = new ArrayList<>();

    public Doctor() {}

    public static Builder builder() { return new Builder(); }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public Hospital getHospital() { return hospital; }
    public void setHospital(Hospital hospital) { this.hospital = hospital; }
    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    public String getHospitalName() { return hospitalName; }
    public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }
    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
    public BigDecimal getFee() { return fee; }
    public void setFee(BigDecimal fee) { this.fee = fee; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public Map<String, Object> getExtra() { return extra; }
    public void setExtra(Map<String, Object> extra) { this.extra = extra != null ? extra : new LinkedHashMap<>(); }
    public List<DoctorSchedule> getSchedules() { return schedules; }
    public void setSchedules(List<DoctorSchedule> schedules) { this.schedules = schedules; }
    public List<DoctorLeave> getLeaves() { return leaves; }
    public void setLeaves(List<DoctorLeave> leaves) { this.leaves = leaves; }
    public List<DateOverride> getDateOverrides() { return dateOverrides; }
    public void setDateOverrides(List<DateOverride> dateOverrides) { this.dateOverrides = dateOverrides; }
    public List<Feedback> getFeedbacks() { return feedbacks; }
    public void setFeedbacks(List<Feedback> feedbacks) { this.feedbacks = feedbacks; }
    public List<DietPlan> getDietPlans() { return dietPlans; }
    public void setDietPlans(List<DietPlan> dietPlans) { this.dietPlans = dietPlans; }

    public static class Builder {
        private final Doctor d = new Doctor();
        public Builder id(String id) { d.id = id; return this; }
        public Builder user(User user) { d.user = user; d.userId = user.getId(); return this; }
        public Builder userId(String userId) { d.userId = userId; return this; }
        public Builder hospital(Hospital hospital) { d.hospital = hospital; d.hospitalId = hospital.getId(); return this; }
        public Builder hospitalId(String hospitalId) { d.hospitalId = hospitalId; return this; }
        public Builder hospitalName(String hospitalName) { d.hospitalName = hospitalName; return this; }
        public Builder name(String name) { d.name = name; return this; }
        public Builder email(String email) { d.email = email; return this; }
        public Builder specialization(String specialization) { d.specialization = specialization; return this; }
        public Builder licenseNumber(String licenseNumber) { d.licenseNumber = licenseNumber; return this; }
        public Builder fee(BigDecimal fee) { d.fee = fee; return this; }
        public Builder status(String status) { d.status = status; return this; }
        public Builder isActive(Boolean isActive) { d.isActive = isActive; return this; }
        public Builder extra(Map<String, Object> extra) { d.extra = extra; return this; }
        public Doctor build() { return d; }
    }
}
