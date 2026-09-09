package com.nexushealth.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "equipment", indexes = {
    @Index(name = "idx_equipment_hospital_id", columnList = "hospital_id"),
    @Index(name = "idx_equipment_category", columnList = "category"),
    @Index(name = "idx_equipment_status", columnList = "status")
})
public class Equipment {

    @Id
    @Column(length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", nullable = false, referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_equipment_hospital"))
    private Hospital hospital;

    @Column(name = "hospital_id", nullable = false, insertable = false, updatable = false, length = 64)
    private String hospitalId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false, length = 32)
    private String status = "OPERATIONAL";

    @Column(nullable = false)
    private Integer quantity = 1;

    private String location;

    @Column(name = "last_maintenance")
    private LocalDate lastMaintenance;

    @Column(name = "serial_number")
    private String serialNumber;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Equipment() {}

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
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public LocalDate getLastMaintenance() { return lastMaintenance; }
    public void setLastMaintenance(LocalDate lastMaintenance) { this.lastMaintenance = lastMaintenance; }
    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static class Builder {
        private final Equipment e = new Equipment();
        public Builder id(String id) { e.id = id; return this; }
        public Builder hospital(Hospital hospital) { e.hospital = hospital; e.hospitalId = hospital.getId(); return this; }
        public Builder hospitalId(String hospitalId) { e.hospitalId = hospitalId; return this; }
        public Builder name(String name) { e.name = name; return this; }
        public Builder category(String category) { e.category = category; return this; }
        public Builder status(String status) { e.status = status; return this; }
        public Builder quantity(Integer quantity) { e.quantity = quantity; return this; }
        public Builder location(String location) { e.location = location; return this; }
        public Builder lastMaintenance(LocalDate lastMaintenance) { e.lastMaintenance = lastMaintenance; return this; }
        public Builder serialNumber(String serialNumber) { e.serialNumber = serialNumber; return this; }
        public Equipment build() { return e; }
    }
}
