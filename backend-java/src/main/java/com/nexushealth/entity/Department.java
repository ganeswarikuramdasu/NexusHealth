package com.nexushealth.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "departments", indexes = {
    @Index(name = "idx_dept_hospital_id", columnList = "hospital_id"),
    @Index(name = "idx_dept_status", columnList = "status"),
    @Index(name = "idx_dept_name_hospital", columnList = "hospital_id, name", unique = true)
})
public class Department {

    @Id
    @Column(length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", nullable = false, referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_dept_hospital"))
    private Hospital hospital;

    @Column(name = "hospital_id", nullable = false, insertable = false, updatable = false, length = 64)
    private String hospitalId;

    @Column(nullable = false)
    private String name;

    @Column(name = "head_of_department")
    private String headOfDepartment;

    @Column(nullable = false, length = 16)
    private String status = "ACTIVE";

    @Column(name = "doctor_count")
    private Integer doctorCount = 0;

    @Column(name = "bed_capacity")
    private Integer bedCapacity = 0;

    @Column(name = "available_beds")
    private Integer availableBeds = 0;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "emergency_contact", length = 20)
    private String emergencyContact;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Department() {}

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
    public Hospital getHospital() { return hospital; }
    public void setHospital(Hospital hospital) { this.hospital = hospital; }
    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getHeadOfDepartment() { return headOfDepartment; }
    public void setHeadOfDepartment(String headOfDepartment) { this.headOfDepartment = headOfDepartment; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getDoctorCount() { return doctorCount; }
    public void setDoctorCount(Integer doctorCount) { this.doctorCount = doctorCount; }
    public Integer getBedCapacity() { return bedCapacity; }
    public void setBedCapacity(Integer bedCapacity) { this.bedCapacity = bedCapacity; }
    public Integer getAvailableBeds() { return availableBeds; }
    public void setAvailableBeds(Integer availableBeds) { this.availableBeds = availableBeds; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getEmergencyContact() { return emergencyContact; }
    public void setEmergencyContact(String emergencyContact) { this.emergencyContact = emergencyContact; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static class Builder {
        private final Department d = new Department();
        public Builder id(String id) { d.id = id; return this; }
        public Builder hospital(Hospital hospital) { d.hospital = hospital; d.hospitalId = hospital.getId(); return this; }
        public Builder hospitalId(String hospitalId) { d.hospitalId = hospitalId; return this; }
        public Builder name(String name) { d.name = name; return this; }
        public Builder headOfDepartment(String headOfDepartment) { d.headOfDepartment = headOfDepartment; return this; }
        public Builder status(String status) { d.status = status; return this; }
        public Builder doctorCount(Integer doctorCount) { d.doctorCount = doctorCount; return this; }
        public Builder bedCapacity(Integer bedCapacity) { d.bedCapacity = bedCapacity; return this; }
        public Builder availableBeds(Integer availableBeds) { d.availableBeds = availableBeds; return this; }
        public Builder description(String description) { d.description = description; return this; }
        public Builder emergencyContact(String emergencyContact) { d.emergencyContact = emergencyContact; return this; }
        public Department build() { return d; }
    }
}
