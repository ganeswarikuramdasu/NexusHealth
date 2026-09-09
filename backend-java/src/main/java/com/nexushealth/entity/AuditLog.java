package com.nexushealth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_timestamp", columnList = "timestamp"),
    @Index(name = "idx_audit_actor", columnList = "actor_name"),
    @Index(name = "idx_audit_action", columnList = "action"),
    @Index(name = "idx_audit_target", columnList = "target_patient_health_id")
})
public class AuditLog {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_user_id", referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_audit_actor"))
    private User actorUser;

    @Column(name = "actor_user_id", insertable = false, updatable = false, length = 64)
    private String actorUserId;

    @Column(name = "actor_name")
    private String actorName;

    @Column(name = "actor_role", length = 32)
    private String actorRole;

    @Column(nullable = false, length = 128)
    private String action;

    @Column(name = "target_patient_health_id")
    private String targetPatientHealthId;

    @Column(length = 1000)
    private String details;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    public AuditLog() {}

    public static Builder builder() { return new Builder(); }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public User getActorUser() { return actorUser; }
    public void setActorUser(User actorUser) { this.actorUser = actorUser; }
    public String getActorUserId() { return actorUserId; }
    public void setActorUserId(String actorUserId) { this.actorUserId = actorUserId; }
    public String getActorName() { return actorName; }
    public void setActorName(String actorName) { this.actorName = actorName; }
    public String getActorRole() { return actorRole; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getTargetPatientHealthId() { return targetPatientHealthId; }
    public void setTargetPatientHealthId(String targetPatientHealthId) { this.targetPatientHealthId = targetPatientHealthId; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public static class Builder {
        private final AuditLog log = new AuditLog();
        public Builder id(String id) { log.id = id; return this; }
        public Builder actorUser(User actorUser) { log.actorUser = actorUser; log.actorUserId = actorUser.getId(); return this; }
        public Builder actorUserId(String actorUserId) { log.actorUserId = actorUserId; return this; }
        public Builder actorName(String actorName) { log.actorName = actorName; return this; }
        public Builder actorRole(String actorRole) { log.actorRole = actorRole; return this; }
        public Builder action(String action) { log.action = action; return this; }
        public Builder targetPatientHealthId(String targetPatientHealthId) { log.targetPatientHealthId = targetPatientHealthId; return this; }
        public Builder details(String details) { log.details = details; return this; }
        public Builder ipAddress(String ipAddress) { log.ipAddress = ipAddress; return this; }
        public AuditLog build() { return log; }
    }
}
