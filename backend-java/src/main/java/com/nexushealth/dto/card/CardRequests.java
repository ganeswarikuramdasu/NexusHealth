package com.nexushealth.dto.card;

public class CardRequests {

    public static class IssueCardRequest {
        private String patientId;
        private String pinCode;

        public String getPatientId() { return patientId; }
        public void setPatientId(String patientId) { this.patientId = patientId; }
        public String getPinCode() { return pinCode; }
        public void setPinCode(String pinCode) { this.pinCode = pinCode; }
    }

    public static class ToggleCardStatusRequest {
        private String cardId;
        private String targetStatus;

        public String getCardId() { return cardId; }
        public void setCardId(String cardId) { this.cardId = cardId; }
        public String getTargetStatus() { return targetStatus; }
        public void setTargetStatus(String targetStatus) { this.targetStatus = targetStatus; }
    }

    public static class ReportLostRequest {
        private String cardId;
        private String patientId;
        private Boolean autoReplace;

        public String getCardId() { return cardId; }
        public void setCardId(String cardId) { this.cardId = cardId; }
        public String getPatientId() { return patientId; }
        public void setPatientId(String patientId) { this.patientId = patientId; }
        public Boolean getAutoReplace() { return autoReplace; }
        public void setAutoReplace(Boolean autoReplace) { this.autoReplace = autoReplace; }
    }

    public static class RequestReplacementRequest {
        private String cardId;
        private String patientId;
        private String pinCode;

        public String getCardId() { return cardId; }
        public void setCardId(String cardId) { this.cardId = cardId; }
        public String getPatientId() { return patientId; }
        public void setPatientId(String patientId) { this.patientId = patientId; }
        public String getPinCode() { return pinCode; }
        public void setPinCode(String pinCode) { this.pinCode = pinCode; }
    }

    public static class ScanRequest {
        private String scannedCode;
        private String actorId;
        private String actorName;
        private String actorRole;
        private String hospitalId;
        private String hospitalName;

        public String getScannedCode() { return scannedCode; }
        public void setScannedCode(String scannedCode) { this.scannedCode = scannedCode; }
        public String getActorId() { return actorId; }
        public void setActorId(String actorId) { this.actorId = actorId; }
        public String getActorName() { return actorName; }
        public void setActorName(String actorName) { this.actorName = actorName; }
        public String getActorRole() { return actorRole; }
        public void setActorRole(String actorRole) { this.actorRole = actorRole; }
        public String getHospitalId() { return hospitalId; }
        public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
        public String getHospitalName() { return hospitalName; }
        public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }
    }

    public static class MobileBridgeCreateRequest {
        private String doctorId;
        private String doctorName;
        private String hospitalName;

        public String getDoctorId() { return doctorId; }
        public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
        public String getDoctorName() { return doctorName; }
        public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
        public String getHospitalName() { return hospitalName; }
        public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }
    }

    public static class MobileBridgeSubmitRequest {
        private String sessionId;
        private String scannedCode;
        private String scanType;
        private Object photoData;

        public String getSessionId() { return sessionId; }
        public void setSessionId(String sessionId) { this.sessionId = sessionId; }
        public String getScannedCode() { return scannedCode; }
        public void setScannedCode(String scannedCode) { this.scannedCode = scannedCode; }
        public String getScanType() { return scanType; }
        public void setScanType(String scanType) { this.scanType = scanType; }
        public Object getPhotoData() { return photoData; }
        public void setPhotoData(Object photoData) { this.photoData = photoData; }
    }

    public static class AssistedConsentRequest {
        private String cardId;
        private String patientHealthId;
        private String doctorId;
        private String doctorName;
        private String hospitalName;
        private Boolean verifiedByPin;

        public String getCardId() { return cardId; }
        public void setCardId(String cardId) { this.cardId = cardId; }
        public String getPatientHealthId() { return patientHealthId; }
        public void setPatientHealthId(String patientHealthId) { this.patientHealthId = patientHealthId; }
        public String getDoctorId() { return doctorId; }
        public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
        public String getDoctorName() { return doctorName; }
        public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
        public String getHospitalName() { return hospitalName; }
        public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }
        public Boolean getVerifiedByPin() { return verifiedByPin; }
        public void setVerifiedByPin(Boolean verifiedByPin) { this.verifiedByPin = verifiedByPin; }
    }
}
