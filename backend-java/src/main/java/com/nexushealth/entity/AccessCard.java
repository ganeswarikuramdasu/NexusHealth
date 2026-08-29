package com.nexushealth.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "access_cards")
public class AccessCard {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "patient_id", nullable = false, length = 64)
    private String patientId;

    @Column(name = "patient_health_id", nullable = false)
    private String patientHealthId;

    @Column(name = "card_identifier", nullable = false, unique = true)
    private String cardIdentifier;

    @Column(name = "secure_token_hash", nullable = false)
    private String secureTokenHash;

    /**
     * The Node card-scan flow (QR/NFC) looks up a card by comparing this
     * token directly against what was scanned - it's a bearer credential
     * embedded in a QR code, not a login password, so (matching Node)
     * it's kept in plain form for exact-match lookup. `secureTokenHash`
     * above is kept too for anything that still wants a hashed copy.
     */
    @Column(name = "secure_token", unique = true)
    private String secureToken;

    @Column(name = "patient_name")
    private String patientName;

    @Column(name = "lost_at")
    private LocalDateTime lostAt;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @Column(name = "replaced_by")
    private String replacedBy;

    @Column(length = 16, nullable = false)
    private String status = "ACTIVE";

    @Column(name = "pin_code", length = 16)
    private String pinCode;

    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt = LocalDateTime.now();

    @Column(name = "activated_at")
    private LocalDateTime activatedAt;

    @Column(name = "qr_code_data")
    private String qrCodeData;

    public AccessCard() {
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getPatientHealthId() { return patientHealthId; }
    public void setPatientHealthId(String patientHealthId) { this.patientHealthId = patientHealthId; }

    public String getCardIdentifier() { return cardIdentifier; }
    public void setCardIdentifier(String cardIdentifier) { this.cardIdentifier = cardIdentifier; }

    public String getSecureTokenHash() { return secureTokenHash; }
    public void setSecureTokenHash(String secureTokenHash) { this.secureTokenHash = secureTokenHash; }

    public String getSecureToken() { return secureToken; }
    public void setSecureToken(String secureToken) { this.secureToken = secureToken; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public LocalDateTime getLostAt() { return lostAt; }
    public void setLostAt(LocalDateTime lostAt) { this.lostAt = lostAt; }

    public LocalDateTime getRevokedAt() { return revokedAt; }
    public void setRevokedAt(LocalDateTime revokedAt) { this.revokedAt = revokedAt; }

    public String getReplacedBy() { return replacedBy; }
    public void setReplacedBy(String replacedBy) { this.replacedBy = replacedBy; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPinCode() { return pinCode; }
    public void setPinCode(String pinCode) { this.pinCode = pinCode; }

    public LocalDateTime getIssuedAt() { return issuedAt; }
    public void setIssuedAt(LocalDateTime issuedAt) { this.issuedAt = issuedAt; }

    public LocalDateTime getActivatedAt() { return activatedAt; }
    public void setActivatedAt(LocalDateTime activatedAt) { this.activatedAt = activatedAt; }

    public String getQrCodeData() { return qrCodeData; }
    public void setQrCodeData(String qrCodeData) { this.qrCodeData = qrCodeData; }

    public static class Builder {
        private final AccessCard card = new AccessCard();

        public Builder id(String id) { card.id = id; return this; }
        public Builder patientId(String patientId) { card.patientId = patientId; return this; }
        public Builder patientHealthId(String patientHealthId) { card.patientHealthId = patientHealthId; return this; }
        public Builder cardIdentifier(String cardIdentifier) { card.cardIdentifier = cardIdentifier; return this; }
        public Builder secureTokenHash(String secureTokenHash) { card.secureTokenHash = secureTokenHash; return this; }
        public Builder secureToken(String secureToken) { card.secureToken = secureToken; return this; }
        public Builder patientName(String patientName) { card.patientName = patientName; return this; }
        public Builder status(String status) { card.status = status; return this; }
        public Builder pinCode(String pinCode) { card.pinCode = pinCode; return this; }
        public Builder issuedAt(LocalDateTime issuedAt) { card.issuedAt = issuedAt; return this; }
        public Builder activatedAt(LocalDateTime activatedAt) { card.activatedAt = activatedAt; return this; }
        public Builder qrCodeData(String qrCodeData) { card.qrCodeData = qrCodeData; return this; }

        public AccessCard build() { return card; }
    }
}

