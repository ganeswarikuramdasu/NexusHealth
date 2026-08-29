package com.nexushealth.dto.patient;

import java.util.List;
import java.util.Map;

public class PatientRequests {

    public static class SubmitFeedbackRequest {
        private String patientId;
        private String patientName;
        private String doctorId;
        private Object rating;
        private String comment;

        public String getPatientId() { return patientId; }
        public void setPatientId(String patientId) { this.patientId = patientId; }
        public String getPatientName() { return patientName; }
        public void setPatientName(String patientName) { this.patientName = patientName; }
        public String getDoctorId() { return doctorId; }
        public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
        public Object getRating() { return rating; }
        public void setRating(Object rating) { this.rating = rating; }
        public String getComment() { return comment; }
        public void setComment(String comment) { this.comment = comment; }
    }

    public static class AddDietPlanRequest {
        private String patientId;
        private String doctorId;
        private String doctorName;
        private String hospitalName;
        private String title;
        private String category;
        private String dailyCaloriesTarget;
        private Object waterIntakeLiters;
        private Map<String, Object> meals;
        private List<String> restrictedFoods;
        private List<String> recommendedFoods;
        private String doctorAdvice;

        public String getPatientId() { return patientId; }
        public void setPatientId(String patientId) { this.patientId = patientId; }
        public String getDoctorId() { return doctorId; }
        public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
        public String getDoctorName() { return doctorName; }
        public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
        public String getHospitalName() { return hospitalName; }
        public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public String getDailyCaloriesTarget() { return dailyCaloriesTarget; }
        public void setDailyCaloriesTarget(String dailyCaloriesTarget) { this.dailyCaloriesTarget = dailyCaloriesTarget; }
        public Object getWaterIntakeLiters() { return waterIntakeLiters; }
        public void setWaterIntakeLiters(Object waterIntakeLiters) { this.waterIntakeLiters = waterIntakeLiters; }
        public Map<String, Object> getMeals() { return meals; }
        public void setMeals(Map<String, Object> meals) { this.meals = meals; }
        public List<String> getRestrictedFoods() { return restrictedFoods; }
        public void setRestrictedFoods(List<String> restrictedFoods) { this.restrictedFoods = restrictedFoods; }
        public List<String> getRecommendedFoods() { return recommendedFoods; }
        public void setRecommendedFoods(List<String> recommendedFoods) { this.recommendedFoods = recommendedFoods; }
        public String getDoctorAdvice() { return doctorAdvice; }
        public void setDoctorAdvice(String doctorAdvice) { this.doctorAdvice = doctorAdvice; }
    }

    public static class GrantConsentRequest {
        private String patientId;
        private String doctorId;
        private String consentType;
        private List<String> allowedCategories;
        private String validUntil;

        public String getPatientId() { return patientId; }
        public void setPatientId(String patientId) { this.patientId = patientId; }
        public String getDoctorId() { return doctorId; }
        public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
        public String getConsentType() { return consentType; }
        public void setConsentType(String consentType) { this.consentType = consentType; }
        public List<String> getAllowedCategories() { return allowedCategories; }
        public void setAllowedCategories(List<String> allowedCategories) { this.allowedCategories = allowedCategories; }
        public String getValidUntil() { return validUntil; }
        public void setValidUntil(String validUntil) { this.validUntil = validUntil; }
    }

    public static class AddManualRecordRequest {
        private String patientId;
        private String title;
        private String recordType;
        private String date;
        private String doctorName;
        private String hospitalName;
        private String diagnosis;
        private Object symptoms;
        private Object labResults;
        private String doctorNotes;
        private String attachmentUrl;

        public String getPatientId() { return patientId; }
        public void setPatientId(String patientId) { this.patientId = patientId; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getRecordType() { return recordType; }
        public void setRecordType(String recordType) { this.recordType = recordType; }
        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public String getDoctorName() { return doctorName; }
        public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
        public String getHospitalName() { return hospitalName; }
        public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }
        public String getDiagnosis() { return diagnosis; }
        public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }
        public Object getSymptoms() { return symptoms; }
        public void setSymptoms(Object symptoms) { this.symptoms = symptoms; }
        public Object getLabResults() { return labResults; }
        public void setLabResults(Object labResults) { this.labResults = labResults; }
        public String getDoctorNotes() { return doctorNotes; }
        public void setDoctorNotes(String doctorNotes) { this.doctorNotes = doctorNotes; }
        public String getAttachmentUrl() { return attachmentUrl; }
        public void setAttachmentUrl(String attachmentUrl) { this.attachmentUrl = attachmentUrl; }
    }
}
