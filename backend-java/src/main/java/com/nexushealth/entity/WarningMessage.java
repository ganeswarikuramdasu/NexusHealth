package com.nexushealth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "warning_messages", indexes = {
    @Index(name = "idx_warning_role", columnList = "target_role"),
    @Index(name = "idx_warning_module", columnList = "target_module"),
    @Index(name = "idx_warning_active", columnList = "active"),
    @Index(name = "idx_warning_created", columnList = "created_at")
})
public class WarningMessage {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "target_role", nullable = false, length = 32)
    private String targetRole;

    @Column(name = "target_module", length = 64)
    private String targetModule = "GENERAL";

    @Column(name = "warn_level", nullable = false, length = 16)
    private String warnLevel = "INFO";

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 2000)
    private String message;

    @Column(name = "created_by", length = 64)
    private String createdBy;

    @Column(name = "created_by_name", length = 200)
    private String createdByName;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    public WarningMessage() {}

    public static Builder builder() {
        return new Builder();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }
    public String getTargetModule() { return targetModule; }
    public void setTargetModule(String targetModule) { this.targetModule = targetModule; }
    public String getWarnLevel() { return warnLevel; }
    public void setWarnLevel(String warnLevel) { this.warnLevel = warnLevel; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public static class Builder {
        private final WarningMessage w = new WarningMessage();
        public Builder id(String id) { w.id = id; return this; }
        public Builder targetRole(String v) { w.targetRole = v; return this; }
        public Builder targetModule(String v) { w.targetModule = v; return this; }
        public Builder warnLevel(String v) { w.warnLevel = v; return this; }
        public Builder title(String v) { w.title = v; return this; }
        public Builder message(String v) { w.message = v; return this; }
        public Builder createdBy(String v) { w.createdBy = v; return this; }
        public Builder createdByName(String v) { w.createdByName = v; return this; }
        public Builder active(Boolean v) { w.active = v; return this; }
        public Builder expiresAt(LocalDateTime v) { w.expiresAt = v; return this; }
        public WarningMessage build() { return w; }
    }
}