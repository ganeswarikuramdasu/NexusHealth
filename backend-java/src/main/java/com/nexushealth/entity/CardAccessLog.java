package com.nexushealth.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "card_access_logs", indexes = {
    @Index(name = "idx_cal_card_id", columnList = "card_id"),
    @Index(name = "idx_cal_patient_id", columnList = "patient_id"),
    @Index(name = "idx_cal_health_id", columnList = "patient_health_id"),
    @Index(name = "idx_cal_actor_id", columnList = "actor_id"),
    @Index(name = "idx_cal_hospital_id", columnList = "hospital_id"),
    @Index(name = "idx_cal_timestamp", columnList = "timestamp"),
    @Index(name = "idx_cal_access_type", columnList = "access_type")
})
public class CardAccessLog {

    @Id
    @Column(length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "card_id", referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_cal_card"))
    private AccessCard card;

    @Column(name = "card_id", insertable = false, updatable = false, length = 64)
    private String cardId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_cal_patient"))
    private User patient;

    @Column(name = "patient_id", insertable = false, updatable = false, length = 64)
    private String patientId;

    @Column(name = "patient_health_id")
    private String patientHealthId;

    @Column(name = "patient_name")
    private String patientName;

    @Column(name = "actor_id", length = 64)
    private String actorId;

    @Column(name = "actor_name")
    private String actorName;

    @Column(name = "actor_role", length = 32)
    private String actorRole;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", referencedColumnName = "id",
                foreignKey = @ForeignKey(name = "fk_cal_hospital"))
    private Hospital hospital;

    @Column(name = "hospital_id", insertable = false, updatable = false, length = 64)
    private String hospitalId;

    @Column(name = "hospital_name")
    private String hospitalName;

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    @Column(name = "access_type")
    private String accessType;

    @Column(name = "authorization_status")
    private String authorizationStatus;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "records_accessed", columnDefinition = "JSON")
    private List<String> recordsAccessed = new ArrayList<>();

    @Column(length = 500)
    private String reason;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    public CardAccessLog() {}

    public static Builder builder() { return new Builder(); }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public AccessCard getCard() { return card; }
    public void setCard(AccessCard card) { this.card = card; }
    public String getCardId() { return cardId; }
    public void setCardId(String cardId) { this.cardId = cardId; }
    public User getPatient() { return patient; }
    public void setPatient(User patient) { this.patient = patient; }
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public String getPatientHealthId() { return patientHealthId; }
    public void setPatientHealthId(String patientHealthId) { this.patientHealthId = patientHealthId; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getActorId() { return actorId; }
    public void setActorId(String actorId) { this.actorId = actorId; }
    public String getActorName() { return actorName; }
    public void setActorName(String actorName) { this.actorName = actorName; }
    public String getActorRole() { return actorRole; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }
    public Hospital getHospital() { return hospital; }
    public void setHospital(Hospital hospital) { this.hospital = hospital; }
    public String getHospitalId() { return hospitalId; }
    public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    public String getHospitalName() { return hospitalName; }
    public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public String getAccessType() { return accessType; }
    public void setAccessType(String accessType) { this.accessType = accessType; }
    public String getAuthorizationStatus() { return authorizationStatus; }
    public void setAuthorizationStatus(String authorizationStatus) { this.authorizationStatus = authorizationStatus; }
    public List<String> getRecordsAccessed() { return recordsAccessed; }
    public void setRecordsAccessed(List<String> recordsAccessed) { this.recordsAccessed = recordsAccessed; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public static class Builder {
        private final CardAccessLog l = new CardAccessLog();
        public Builder id(String id) { l.id = id; return this; }
        public Builder card(AccessCard card) { l.card = card; l.cardId = card.getId(); return this; }
        public Builder cardId(String cardId) { l.cardId = cardId; return this; }
        public Builder patient(User patient) { l.patient = patient; l.patientId = patient.getId(); return this; }
        public Builder patientId(String patientId) { l.patientId = patientId; return this; }
        public Builder patientHealthId(String patientHealthId) { l.patientHealthId = patientHealthId; return this; }
        public Builder patientName(String patientName) { l.patientName = patientName; return this; }
        public Builder actorId(String actorId) { l.actorId = actorId; return this; }
        public Builder actorName(String actorName) { l.actorName = actorName; return this; }
        public Builder actorRole(String actorRole) { l.actorRole = actorRole; return this; }
        public Builder hospital(Hospital hospital) { l.hospital = hospital; l.hospitalId = hospital.getId(); return this; }
        public Builder hospitalId(String hospitalId) { l.hospitalId = hospitalId; return this; }
        public Builder hospitalName(String hospitalName) { l.hospitalName = hospitalName; return this; }
        public Builder accessType(String accessType) { l.accessType = accessType; return this; }
        public Builder authorizationStatus(String authorizationStatus) { l.authorizationStatus = authorizationStatus; return this; }
        public Builder recordsAccessed(List<String> recordsAccessed) { l.recordsAccessed = recordsAccessed; return this; }
        public Builder reason(String reason) { l.reason = reason; return this; }
        public Builder ipAddress(String ipAddress) { l.ipAddress = ipAddress; return this; }
        public CardAccessLog build() { return l; }
    }
}
