package com.nexushealth.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "emergency_contacts", indexes = {
    @Index(name = "idx_emerg_contact_patient", columnList = "patient_id")
})
public class EmergencyContact {

    @Id
    @Column(length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false, referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_emerg_contact_patient"))
    private User patient;

    @Column(name = "patient_id", nullable = false, insertable = false, updatable = false, length = 64)
    private String patientId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String relationship;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(nullable = false)
    private Integer priority = 1;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public EmergencyContact() {}

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
    public User getPatient() { return patient; }
    public void setPatient(User patient) { this.patient = patient; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getRelationship() { return relationship; }
    public void setRelationship(String relationship) { this.relationship = relationship; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public Integer getPriority() { return priority; }
    public void setPriority(Integer priority) { this.priority = priority; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static class Builder {
        private final EmergencyContact c = new EmergencyContact();
        public Builder id(String id) { c.id = id; return this; }
        public Builder patient(User patient) { c.patient = patient; c.patientId = patient.getId(); return this; }
        public Builder patientId(String patientId) { c.patientId = patientId; return this; }
        public Builder name(String name) { c.name = name; return this; }
        public Builder relationship(String relationship) { c.relationship = relationship; return this; }
        public Builder phone(String phone) { c.phone = phone; return this; }
        public Builder priority(Integer priority) { c.priority = priority; return this; }
        public EmergencyContact build() { return c; }
    }
}
