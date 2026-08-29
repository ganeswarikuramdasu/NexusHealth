package com.nexushealth.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    // PATIENT, DOCTOR, HOSPITAL_ADMIN, SUPER_ADMIN
    @Column(nullable = false, length = 32)
    private String role;

    private String phone;

    private String gender;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(length = 16, nullable = false)
    private String status = "ACTIVE";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public User() {
    }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    /** Manual builder, replacing Lombok's @Builder so User.builder()....build() still works everywhere it's called. */
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

        public User build() { return user; }
    }
}

