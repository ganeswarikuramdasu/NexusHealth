package com.nexushealth.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Same JSON-column pattern as {@link Hospital} - see that class's javadoc.
 * `extra` holds weeklySchedule, dateOverrides, leaves, emergencyAbsence,
 * notificationPreferences, securitySettings, workingDays, and every other
 * field that isn't needed for a SQL join/filter elsewhere.
 */
@Entity
@Table(name = "doctors")
public class Doctor {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "user_id", length = 64)
    private String userId;

    @Column(name = "hospital_id", length = 64)
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

    public Doctor() {
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
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

    public static class Builder {
        private final Doctor d = new Doctor();
        public Builder id(String id) { d.id = id; return this; }
        public Builder userId(String userId) { d.userId = userId; return this; }
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
