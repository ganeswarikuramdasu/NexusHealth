package com.nexushealth.dto.complaint;

public class ComplaintRequests {

    public static class RaiseComplaintRequest {
        private String role;
        private String userId;
        private String userName;
        private String module;
        private String category;
        private String title;
        private String description;
        private String relatedPatientId;
        private String relatedPatientHealthId;
        private String relatedAccessLogId;
        private String relatedDoctorId;
        private String relatedDoctorName;
        private String accessedMethod;

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public String getUserName() { return userName; }
        public void setUserName(String userName) { this.userName = userName; }
        public String getModule() { return module; }
        public void setModule(String module) { this.module = module; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getRelatedPatientId() { return relatedPatientId; }
        public void setRelatedPatientId(String relatedPatientId) { this.relatedPatientId = relatedPatientId; }
        public String getRelatedPatientHealthId() { return relatedPatientHealthId; }
        public void setRelatedPatientHealthId(String relatedPatientHealthId) { this.relatedPatientHealthId = relatedPatientHealthId; }
        public String getRelatedAccessLogId() { return relatedAccessLogId; }
        public void setRelatedAccessLogId(String relatedAccessLogId) { this.relatedAccessLogId = relatedAccessLogId; }
        public String getRelatedDoctorId() { return relatedDoctorId; }
        public void setRelatedDoctorId(String relatedDoctorId) { this.relatedDoctorId = relatedDoctorId; }
        public String getRelatedDoctorName() { return relatedDoctorName; }
        public void setRelatedDoctorName(String relatedDoctorName) { this.relatedDoctorName = relatedDoctorName; }
        public String getAccessedMethod() { return accessedMethod; }
        public void setAccessedMethod(String accessedMethod) { this.accessedMethod = accessedMethod; }
    }

    public static class ResolveComplaintRequest {
        private String status;
        private String resolutionNote;
        private String resolvedBy;
        private String resolvedByName;

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getResolutionNote() { return resolutionNote; }
        public void setResolutionNote(String resolutionNote) { this.resolutionNote = resolutionNote; }
        public String getResolvedBy() { return resolvedBy; }
        public void setResolvedBy(String resolvedBy) { this.resolvedBy = resolvedBy; }
        public String getResolvedByName() { return resolvedByName; }
        public void setResolvedByName(String resolvedByName) { this.resolvedByName = resolvedByName; }
    }
}