package com.nexushealth.dto.emergency;

import java.util.List;
import java.util.Map;

public class EmergencyRequests {

    public static class IdentifyRequest {
        private String method;
        private String query;
        private String doctorId;
        private String hospitalId;

        public String getMethod() { return method; }
        public void setMethod(String method) { this.method = method; }
        public String getQuery() { return query; }
        public void setQuery(String query) { this.query = query; }
        public String getDoctorId() { return doctorId; }
        public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
        public String getHospitalId() { return hospitalId; }
        public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    }

    public static class StartSessionRequest {
        private String patientHealthId;
        private String doctorId;
        private String doctorName;
        private String hospitalId;
        private String hospitalName;
        private String identificationMethod;
        private String emergencyReason;
        private String customReason;

        public String getPatientHealthId() { return patientHealthId; }
        public void setPatientHealthId(String patientHealthId) { this.patientHealthId = patientHealthId; }
        public String getDoctorId() { return doctorId; }
        public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
        public String getDoctorName() { return doctorName; }
        public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
        public String getHospitalId() { return hospitalId; }
        public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
        public String getHospitalName() { return hospitalName; }
        public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }
        public String getIdentificationMethod() { return identificationMethod; }
        public void setIdentificationMethod(String identificationMethod) { this.identificationMethod = identificationMethod; }
        public String getEmergencyReason() { return emergencyReason; }
        public void setEmergencyReason(String emergencyReason) { this.emergencyReason = emergencyReason; }
        public String getCustomReason() { return customReason; }
        public void setCustomReason(String customReason) { this.customReason = customReason; }
    }

    public static class AddNoteRequest {
        private String title;
        private String recordType;
        private String diagnosis;
        private String doctorNotes;
        private List<Map<String, Object>> medicines;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getRecordType() { return recordType; }
        public void setRecordType(String recordType) { this.recordType = recordType; }
        public String getDiagnosis() { return diagnosis; }
        public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }
        public String getDoctorNotes() { return doctorNotes; }
        public void setDoctorNotes(String doctorNotes) { this.doctorNotes = doctorNotes; }
        public List<Map<String, Object>> getMedicines() { return medicines; }
        public void setMedicines(List<Map<String, Object>> medicines) { this.medicines = medicines; }
    }

    public static class UpdateProfileRequest {
        private String bloodGroup;
        private String allergies;
        private String criticalConditions;
        private String currentMedications;
        private String emergencyNotes;
        private String primaryPhysician;
        private List<Map<String, Object>> contacts;

        public String getBloodGroup() { return bloodGroup; }
        public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }
        public String getAllergies() { return allergies; }
        public void setAllergies(String allergies) { this.allergies = allergies; }
        public String getCriticalConditions() { return criticalConditions; }
        public void setCriticalConditions(String criticalConditions) { this.criticalConditions = criticalConditions; }
        public String getCurrentMedications() { return currentMedications; }
        public void setCurrentMedications(String currentMedications) { this.currentMedications = currentMedications; }
        public String getEmergencyNotes() { return emergencyNotes; }
        public void setEmergencyNotes(String emergencyNotes) { this.emergencyNotes = emergencyNotes; }
        public String getPrimaryPhysician() { return primaryPhysician; }
        public void setPrimaryPhysician(String primaryPhysician) { this.primaryPhysician = primaryPhysician; }
        public List<Map<String, Object>> getContacts() { return contacts; }
        public void setContacts(List<Map<String, Object>> contacts) { this.contacts = contacts; }
    }
}
