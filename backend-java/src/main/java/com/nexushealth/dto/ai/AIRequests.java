package com.nexushealth.dto.ai;

import java.util.List;
import java.util.Map;

public class AIRequests {

    public static class PatientAssistantRequest {
        private String query;
        private String prompt;
        private Map<String, Object> patientProfile;
        private List<?> medicalRecords;
        private List<?> contextRecords;
        private String patientHealthId;

        public String getQuery() { return query; }
        public void setQuery(String query) { this.query = query; }
        public String getPrompt() { return prompt; }
        public void setPrompt(String prompt) { this.prompt = prompt; }
        public Map<String, Object> getPatientProfile() { return patientProfile; }
        public void setPatientProfile(Map<String, Object> patientProfile) { this.patientProfile = patientProfile; }
        public List<?> getMedicalRecords() { return medicalRecords; }
        public void setMedicalRecords(List<?> medicalRecords) { this.medicalRecords = medicalRecords; }
        public List<?> getContextRecords() { return contextRecords; }
        public void setContextRecords(List<?> contextRecords) { this.contextRecords = contextRecords; }
        public String getPatientHealthId() { return patientHealthId; }
        public void setPatientHealthId(String patientHealthId) { this.patientHealthId = patientHealthId; }
    }

    public static class DoctorAssistantRequest {
        private String symptoms;
        private String preliminaryDiagnosis;
        private Object medicines;
        private String patientHealthId;

        public String getSymptoms() { return symptoms; }
        public void setSymptoms(String symptoms) { this.symptoms = symptoms; }
        public String getPreliminaryDiagnosis() { return preliminaryDiagnosis; }
        public void setPreliminaryDiagnosis(String preliminaryDiagnosis) { this.preliminaryDiagnosis = preliminaryDiagnosis; }
        public Object getMedicines() { return medicines; }
        public void setMedicines(Object medicines) { this.medicines = medicines; }
        public String getPatientHealthId() { return patientHealthId; }
        public void setPatientHealthId(String patientHealthId) { this.patientHealthId = patientHealthId; }
    }

    public static class PrescribeCheckRequest {
        private String patientHealthId;
        private String diagnosis;
        private List<?> prescriptions;

        public String getPatientHealthId() { return patientHealthId; }
        public void setPatientHealthId(String patientHealthId) { this.patientHealthId = patientHealthId; }
        public String getDiagnosis() { return diagnosis; }
        public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }
        public List<?> getPrescriptions() { return prescriptions; }
        public void setPrescriptions(List<?> prescriptions) { this.prescriptions = prescriptions; }
    }

    public static class ExplainLabReportRequest {
        private Map<String, Object> labReport;
        private String userQuestion;
        private Object chatHistory;

        public Map<String, Object> getLabReport() { return labReport; }
        public void setLabReport(Map<String, Object> labReport) { this.labReport = labReport; }
        public String getUserQuestion() { return userQuestion; }
        public void setUserQuestion(String userQuestion) { this.userQuestion = userQuestion; }
        public Object getChatHistory() { return chatHistory; }
        public void setChatHistory(Object chatHistory) { this.chatHistory = chatHistory; }
    }

    public static class GenerateDietPlanRequest {
        private Map<String, Object> patientProfile;
        private Object chronicConditions;
        private Object allergies;
        private String goal;

        public Map<String, Object> getPatientProfile() { return patientProfile; }
        public void setPatientProfile(Map<String, Object> patientProfile) { this.patientProfile = patientProfile; }
        public Object getChronicConditions() { return chronicConditions; }
        public void setChronicConditions(Object chronicConditions) { this.chronicConditions = chronicConditions; }
        public Object getAllergies() { return allergies; }
        public void setAllergies(Object allergies) { this.allergies = allergies; }
        public String getGoal() { return goal; }
        public void setGoal(String goal) { this.goal = goal; }
    }
}
