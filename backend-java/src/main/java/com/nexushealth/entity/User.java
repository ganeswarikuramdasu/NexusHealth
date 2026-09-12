package com.nexushealth.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_role", columnList = "role"),
    @Index(name = "idx_user_status", columnList = "status")
})
public class User {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false, length = 32)
    private String role;

    private String phone;
    private String gender;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(length = 16, nullable = false)
    private String status = "ACTIVE";

    @Column(name = "preferred_language", length = 10, nullable = false)
    private String preferredLanguage = "en";

    @Column(name = "malpractice_count", nullable = false)
    private int malpracticeCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @OneToOne(mappedBy = "patient", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private PatientProfile patientProfile;

    @OneToOne(mappedBy = "patient", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private EmergencyProfile emergencyProfile;

    @OneToMany(mappedBy = "patient", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EmergencyContact> emergencyContacts = new ArrayList<>();

    @OneToMany(mappedBy = "patient", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AccessCard> accessCards = new ArrayList<>();

    @OneToMany(mappedBy = "patient", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Feedback> feedbacks = new ArrayList<>();

    @OneToMany(mappedBy = "patient", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DietPlan> dietPlans = new ArrayList<>();

    @OneToMany(mappedBy = "patient", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EmergencySession> emergencySessions = new ArrayList<>();

    @OneToMany(mappedBy = "patient", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AccessSession> accessSessions = new ArrayList<>();

    public User() {}

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPreferredLanguage() {
        return preferredLanguage == null || preferredLanguage.isBlank() ? "en" : preferredLanguage;
    }

    public void setPreferredLanguage(String preferredLanguage) {
        this.preferredLanguage = preferredLanguage;
    }
    public int getMalpracticeCount() { return malpracticeCount; }
    public void setMalpracticeCount(int malpracticeCount) { this.malpracticeCount = malpracticeCount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public PatientProfile getPatientProfile() { return patientProfile; }
    public void setPatientProfile(PatientProfile patientProfile) { this.patientProfile = patientProfile; }
    public EmergencyProfile getEmergencyProfile() { return emergencyProfile; }
    public void setEmergencyProfile(EmergencyProfile emergencyProfile) { this.emergencyProfile = emergencyProfile; }
    public List<EmergencyContact> getEmergencyContacts() { return emergencyContacts; }
    public void setEmergencyContacts(List<EmergencyContact> emergencyContacts) { this.emergencyContacts = emergencyContacts; }
    public List<AccessCard> getAccessCards() { return accessCards; }
    public void setAccessCards(List<AccessCard> accessCards) { this.accessCards = accessCards; }
    public List<Feedback> getFeedbacks() { return feedbacks; }
    public void setFeedbacks(List<Feedback> feedbacks) { this.feedbacks = feedbacks; }
    public List<DietPlan> getDietPlans() { return dietPlans; }
    public void setDietPlans(List<DietPlan> dietPlans) { this.dietPlans = dietPlans; }
    public List<EmergencySession> getEmergencySessions() { return emergencySessions; }
    public void setEmergencySessions(List<EmergencySession> emergencySessions) { this.emergencySessions = emergencySessions; }
    public List<AccessSession> getAccessSessions() { return accessSessions; }
    public void setAccessSessions(List<AccessSession> accessSessions) { this.accessSessions = accessSessions; }

    public static class Builder {
        private final User user = new User();
        public Builder id(String id) { user.id = id; return this; }
        public Builder name(String name) { user.name = name; return this; }
        public Builder email(String email) { user.email = email; return this; }
        public Builder passwordHash(String passwordHash) { user.passwordHash = passwordHash; return this; }
        public Builder role(String role) { user.role = role; return this; }
        public Builder phone(String phone) { user.phone = phone; return this; }
        public Builder gender(String gender) { user.gender = gender; return this; }
        public Builder dateOfBirth(LocalDate dateOfBirth) { user.dateOfBirth = dateOfBirth; return this; }
        public Builder status(String status) { user.status = status; return this; }
        public Builder preferredLanguage(String preferredLanguage) {
            user.preferredLanguage = preferredLanguage;
            return this;
        }
        public User build() { return user; }
    }
}
