package com.nexushealth.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Hospital records in the original app are freeform JSON objects (arbitrary
 * fields like `departments`, `departmentStatuses`) rather than a fixed set
 * of columns - rewriting that as a strict relational schema would mean
 * rewriting hospital-admin business logic, which is out of scope. Instead:
 * fixed columns for the fields other tables (doctors, appointments) need to
 * reference or query by, and a native MySQL JSON column ({@link #extra})
 * for everything else. {@link com.nexushealth.service.HospitalService}
 * flattens `extra` back into the top-level response so the JSON shape the
 * frontend expects is unchanged.
 */
@Entity
@Table(name = "hospitals")
public class Hospital {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "admin_user_id", length = 64)
    private String adminUserId;

    @Column(nullable = false)
    private String name;

    private String email;
    private String phone;
    private String address;

    @Column(name = "license_number")
    private String licenseNumber;

    @Column(name = "total_beds")
    private Integer totalBeds = 0;

    @Column(name = "available_beds")
    private Integer availableBeds = 0;

    @Column(nullable = false, length = 16)
    private String status = "PENDING_APPROVAL";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "extra", columnDefinition = "JSON")
    private Map<String, Object> extra = new LinkedHashMap<>();

    public Hospital() {
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getAdminUserId() { return adminUserId; }
    public void setAdminUserId(String adminUserId) { this.adminUserId = adminUserId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
    public Integer getTotalBeds() { return totalBeds; }
    public void setTotalBeds(Integer totalBeds) { this.totalBeds = totalBeds; }
    public Integer getAvailableBeds() { return availableBeds; }
    public void setAvailableBeds(Integer availableBeds) { this.availableBeds = availableBeds; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public Map<String, Object> getExtra() { return extra; }
    public void setExtra(Map<String, Object> extra) { this.extra = extra != null ? extra : new LinkedHashMap<>(); }

    public static class Builder {
        private final Hospital h = new Hospital();
        public Builder id(String id) { h.id = id; return this; }
        public Builder adminUserId(String adminUserId) { h.adminUserId = adminUserId; return this; }
        public Builder name(String name) { h.name = name; return this; }
        public Builder email(String email) { h.email = email; return this; }
        public Builder phone(String phone) { h.phone = phone; return this; }
        public Builder address(String address) { h.address = address; return this; }
        public Builder licenseNumber(String licenseNumber) { h.licenseNumber = licenseNumber; return this; }
        public Builder totalBeds(Integer totalBeds) { h.totalBeds = totalBeds; return this; }
        public Builder availableBeds(Integer availableBeds) { h.availableBeds = availableBeds; return this; }
        public Builder status(String status) { h.status = status; return this; }
        public Builder extra(Map<String, Object> extra) { h.extra = extra; return this; }
        public Hospital build() { return h; }
    }
}
