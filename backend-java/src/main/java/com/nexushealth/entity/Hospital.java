package com.nexushealth.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "hospitals", indexes = {
    @Index(name = "idx_hospital_admin", columnList = "admin_user_id"),
    @Index(name = "idx_hospital_status", columnList = "status"),
    @Index(name = "idx_hospital_license", columnList = "license_number")
})
public class Hospital {

    @Id
    @Column(length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_user_id", referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_hospital_admin"))
    private User adminUser;

    @Column(name = "admin_user_id", insertable = false, updatable = false, length = 64)
    private String adminUserId;

    @Column(nullable = false)
    private String name;

    private String email;
    private String phone;
    private String address;

    @Column(name = "license_number")
    private String licenseNumber;

    @Column(nullable = false, length = 16)
    private String status = "PENDING_APPROVAL";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "extra", columnDefinition = "JSON")
    private Map<String, Object> extra = new LinkedHashMap<>();

    @OneToMany(mappedBy = "hospital", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Doctor> doctors = new ArrayList<>();

    @OneToMany(mappedBy = "hospital", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Department> departments = new ArrayList<>();

    @OneToMany(mappedBy = "hospital", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Equipment> equipment = new ArrayList<>();

    public Hospital() {}

    public static Builder builder() { return new Builder(); }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public User getAdminUser() { return adminUser; }
    public void setAdminUser(User adminUser) { this.adminUser = adminUser; }
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
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public Map<String, Object> getExtra() { return extra; }
    public void setExtra(Map<String, Object> extra) { this.extra = extra != null ? extra : new LinkedHashMap<>(); }
    public List<Doctor> getDoctors() { return doctors; }
    public void setDoctors(List<Doctor> doctors) { this.doctors = doctors; }
    public List<Department> getDepartments() { return departments; }
    public void setDepartments(List<Department> departments) { this.departments = departments; }
    public List<Equipment> getEquipment() { return equipment; }
    public void setEquipment(List<Equipment> equipment) { this.equipment = equipment; }

    public static class Builder {
        private final Hospital h = new Hospital();
        public Builder id(String id) { h.id = id; return this; }
        public Builder adminUser(User adminUser) { h.adminUser = adminUser; h.adminUserId = adminUser.getId(); return this; }
        public Builder adminUserId(String adminUserId) { h.adminUserId = adminUserId; return this; }
        public Builder name(String name) { h.name = name; return this; }
        public Builder email(String email) { h.email = email; return this; }
        public Builder phone(String phone) { h.phone = phone; return this; }
        public Builder address(String address) { h.address = address; return this; }
        public Builder licenseNumber(String licenseNumber) { h.licenseNumber = licenseNumber; return this; }
        public Builder status(String status) { h.status = status; return this; }
        public Builder extra(Map<String, Object> extra) { h.extra = extra; return this; }
        public Hospital build() { return h; }
    }
}
