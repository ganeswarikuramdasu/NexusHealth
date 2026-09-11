package com.nexushealth.dto.medicalRecord;

import java.util.List;
import java.util.Map;

public class MedicalRecordRequests {

    public static class CreateRecordRequest {
        private String doctorId;
        private String patientHealthId;
        private String title;
        private String diagnosis;
        private List<String> symptoms;
        private Map<String, Object> vitals;
        private List<Map<String, Object>> medicines;
        private String doctorNotes;
        private String accessSessionId;

        public String getDoctorId() { return doctorId; }
        public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
        public String getPatientHealthId() { return patientHealthId; }
        public void setPatientHealthId(String patientHealthId) { this.patientHealthId = patientHealthId; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDiagnosis() { return diagnosis; }
        public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }
        public List<String> getSymptoms() { return symptoms; }
        public void setSymptoms(List<String> symptoms) { this.symptoms = symptoms; }
        public Map<String, Object> getVitals() { return vitals; }
        public void setVitals(Map<String, Object> vitals) { this.vitals = vitals; }
        public List<Map<String, Object>> getMedicines() { return medicines; }
        public void setMedicines(List<Map<String, Object>> medicines) { this.medicines = medicines; }
        public String getDoctorNotes() { return doctorNotes; }
        public void setDoctorNotes(String doctorNotes) { this.doctorNotes = doctorNotes; }
        public String getAccessSessionId() { return accessSessionId; }
        public void setAccessSessionId(String accessSessionId) { this.accessSessionId = accessSessionId; }
    }

    public static class CreateLabRequest {
        private String doctorId;
        private String patientHealthId;
        private String recordType;
        private String title;
        private String testName;
        private String testCategory;
        private String testDate;
        private String laboratoryName;
        private String diagnosis;
        private List<Map<String, Object>> labResults;
        private String referenceRange;
        private String attachmentUrl;
        private String fileName;
        private String fileSize;
        private String imagingCategory;
        private String doctorNotes;
        private String accessSessionId;
        private String aiSummary;
        private List<Map<String, Object>> flaggedValues;
        private String attachmentDataUrl;

        public String getDoctorId() { return doctorId; }
        public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
        public String getPatientHealthId() { return patientHealthId; }
        public void setPatientHealthId(String patientHealthId) { this.patientHealthId = patientHealthId; }
        public String getRecordType() { return recordType; }
        public void setRecordType(String recordType) { this.recordType = recordType; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getTestName() { return testName; }
        public void setTestName(String testName) { this.testName = testName; }
        public String getTestCategory() { return testCategory; }
        public void setTestCategory(String testCategory) { this.testCategory = testCategory; }
        public String getTestDate() { return testDate; }
        public void setTestDate(String testDate) { this.testDate = testDate; }
        public String getLaboratoryName() { return laboratoryName; }
        public void setLaboratoryName(String laboratoryName) { this.laboratoryName = laboratoryName; }
        public String getDiagnosis() { return diagnosis; }
        public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }
        public List<Map<String, Object>> getLabResults() { return labResults; }
        public void setLabResults(List<Map<String, Object>> labResults) { this.labResults = labResults; }
        public String getReferenceRange() { return referenceRange; }
        public void setReferenceRange(String referenceRange) { this.referenceRange = referenceRange; }
        public String getAttachmentUrl() { return attachmentUrl; }
        public void setAttachmentUrl(String attachmentUrl) { this.attachmentUrl = attachmentUrl; }
        public String getFileName() { return fileName; }
        public void setFileName(String fileName) { this.fileName = fileName; }
        public String getFileSize() { return fileSize; }
        public void setFileSize(String fileSize) { this.fileSize = fileSize; }
        public String getImagingCategory() { return imagingCategory; }
        public void setImagingCategory(String imagingCategory) { this.imagingCategory = imagingCategory; }
        public String getDoctorNotes() { return doctorNotes; }
        public void setDoctorNotes(String doctorNotes) { this.doctorNotes = doctorNotes; }
        public String getAccessSessionId() { return accessSessionId; }
        public void setAccessSessionId(String accessSessionId) { this.accessSessionId = accessSessionId; }
        public String getAiSummary() { return aiSummary; }
        public void setAiSummary(String aiSummary) { this.aiSummary = aiSummary; }
        public List<Map<String, Object>> getFlaggedValues() { return flaggedValues; }
        public void setFlaggedValues(List<Map<String, Object>> flaggedValues) { this.flaggedValues = flaggedValues; }
        public String getAttachmentDataUrl() { return attachmentDataUrl; }
        public void setAttachmentDataUrl(String attachmentDataUrl) { this.attachmentDataUrl = attachmentDataUrl; }
    }

    public static class CreateVitalsRequest {
        private String patientHealthId;
        private String doctorId;
        private Map<String, Object> vitals;
        private String accessSessionId;

        public String getPatientHealthId() { return patientHealthId; }
        public void setPatientHealthId(String patientHealthId) { this.patientHealthId = patientHealthId; }
        public String getDoctorId() { return doctorId; }
        public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
        public Map<String, Object> getVitals() { return vitals; }
        public void setVitals(Map<String, Object> vitals) { this.vitals = vitals; }
        public String getAccessSessionId() { return accessSessionId; }
        public void setAccessSessionId(String accessSessionId) { this.accessSessionId = accessSessionId; }
    }

    public static class UpdateRecordRequest {
        private String recordId;
        private String title;
        private String diagnosis;
        private String recordType;
        private String date;
        private String clinicalNotes;
        private String doctorNotes;
        private String hospitalName;
        private String testName;
        private String testCategory;
        private String referenceRange;
        private List<Map<String, Object>> labResults;
        private List<String> symptoms;
        private List<Map<String, Object>> flaggedValues;
        private String aiSummary;
        private String fileName;
        private String fileSize;
        private String attachmentUrl;
        private String attachmentDataUrl;

        public String getRecordId() { return recordId; }
        public void setRecordId(String recordId) { this.recordId = recordId; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDiagnosis() { return diagnosis; }
        public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }
        public String getRecordType() { return recordType; }
        public void setRecordType(String recordType) { this.recordType = recordType; }
        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public String getClinicalNotes() { return clinicalNotes; }
        public void setClinicalNotes(String clinicalNotes) { this.clinicalNotes = clinicalNotes; }
        public String getDoctorNotes() { return doctorNotes; }
        public void setDoctorNotes(String doctorNotes) { this.doctorNotes = doctorNotes; }
        public String getHospitalName() { return hospitalName; }
        public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }
        public String getTestName() { return testName; }
        public void setTestName(String testName) { this.testName = testName; }
        public String getTestCategory() { return testCategory; }
        public void setTestCategory(String testCategory) { this.testCategory = testCategory; }
        public String getReferenceRange() { return referenceRange; }
        public void setReferenceRange(String referenceRange) { this.referenceRange = referenceRange; }
        public List<Map<String, Object>> getLabResults() { return labResults; }
        public void setLabResults(List<Map<String, Object>> labResults) { this.labResults = labResults; }
        public List<String> getSymptoms() { return symptoms; }
        public void setSymptoms(List<String> symptoms) { this.symptoms = symptoms; }
        public List<Map<String, Object>> getFlaggedValues() { return flaggedValues; }
        public void setFlaggedValues(List<Map<String, Object>> flaggedValues) { this.flaggedValues = flaggedValues; }
        public String getAiSummary() { return aiSummary; }
        public void setAiSummary(String aiSummary) { this.aiSummary = aiSummary; }
        public String getFileName() { return fileName; }
        public void setFileName(String fileName) { this.fileName = fileName; }
        public String getFileSize() { return fileSize; }
        public void setFileSize(String fileSize) { this.fileSize = fileSize; }
        public String getAttachmentUrl() { return attachmentUrl; }
        public void setAttachmentUrl(String attachmentUrl) { this.attachmentUrl = attachmentUrl; }
        public String getAttachmentDataUrl() { return attachmentDataUrl; }
        public void setAttachmentDataUrl(String attachmentDataUrl) { this.attachmentDataUrl = attachmentDataUrl; }
    }
}
