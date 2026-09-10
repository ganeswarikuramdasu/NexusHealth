package com.nexushealth.dto.warning;

public class WarningRequests {

    public static class CreateWarningRequest {
        private String targetRole;
        private String targetModule;
        private String warnLevel;
        private String title;
        private String message;
        private String createdBy;
        private String createdByName;
        private String expiresAt;

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
        public String getExpiresAt() { return expiresAt; }
        public void setExpiresAt(String expiresAt) { this.expiresAt = expiresAt; }
    }
}