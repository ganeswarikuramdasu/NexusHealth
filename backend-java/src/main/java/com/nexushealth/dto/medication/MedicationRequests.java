package com.nexushealth.dto.medication;

public class MedicationRequests {

    public static class AddMedicationRequest {
        private String doctorId;
        private String patientId;
        private String patientHealthId;
        private String medicationName;
        private String genericName;
        private String dosage;
        private String unit;
        private String frequency;
        private String route;
        private String timing;
        private String startDate;
        private String endDate;
        private String duration;
        private String indication;
        private String instructions;
        private String prescriptionId;

        public String getDoctorId() { return doctorId; }
        public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
        public String getPatientId() { return patientId; }
        public void setPatientId(String patientId) { this.patientId = patientId; }
        public String getPatientHealthId() { return patientHealthId; }
        public void setPatientHealthId(String patientHealthId) { this.patientHealthId = patientHealthId; }
        public String getMedicationName() { return medicationName; }
        public void setMedicationName(String medicationName) { this.medicationName = medicationName; }
        public String getGenericName() { return genericName; }
        public void setGenericName(String genericName) { this.genericName = genericName; }
        public String getDosage() { return dosage; }
        public void setDosage(String dosage) { this.dosage = dosage; }
        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }
        public String getFrequency() { return frequency; }
        public void setFrequency(String frequency) { this.frequency = frequency; }
        public String getRoute() { return route; }
        public void setRoute(String route) { this.route = route; }
        public String getTiming() { return timing; }
        public void setTiming(String timing) { this.timing = timing; }
        public String getStartDate() { return startDate; }
        public void setStartDate(String startDate) { this.startDate = startDate; }
        public String getEndDate() { return endDate; }
        public void setEndDate(String endDate) { this.endDate = endDate; }
        public String getDuration() { return duration; }
        public void setDuration(String duration) { this.duration = duration; }
        public String getIndication() { return indication; }
        public void setIndication(String indication) { this.indication = indication; }
        public String getInstructions() { return instructions; }
        public void setInstructions(String instructions) { this.instructions = instructions; }
        public String getPrescriptionId() { return prescriptionId; }
        public void setPrescriptionId(String prescriptionId) { this.prescriptionId = prescriptionId; }
    }

    public static class UpdateMedicationRequest {
        private String doctorId;
        private String dosage;
        private String unit;
        private String frequency;
        private String route;
        private String timing;
        private String endDate;
        private String duration;
        private String indication;
        private String instructions;

        public String getDoctorId() { return doctorId; }
        public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
        public String getDosage() { return dosage; }
        public void setDosage(String dosage) { this.dosage = dosage; }
        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }
        public String getFrequency() { return frequency; }
        public void setFrequency(String frequency) { this.frequency = frequency; }
        public String getRoute() { return route; }
        public void setRoute(String route) { this.route = route; }
        public String getTiming() { return timing; }
        public void setTiming(String timing) { this.timing = timing; }
        public String getEndDate() { return endDate; }
        public void setEndDate(String endDate) { this.endDate = endDate; }
        public String getDuration() { return duration; }
        public void setDuration(String duration) { this.duration = duration; }
        public String getIndication() { return indication; }
        public void setIndication(String indication) { this.indication = indication; }
        public String getInstructions() { return instructions; }
        public void setInstructions(String instructions) { this.instructions = instructions; }
    }

    public static class DiscontinueMedicationRequest {
        private String doctorId;
        private String doctorName;
        private String discontinuationReason;

        public String getDoctorId() { return doctorId; }
        public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
        public String getDoctorName() { return doctorName; }
        public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
        public String getDiscontinuationReason() { return discontinuationReason; }
        public void setDiscontinuationReason(String discontinuationReason) { this.discontinuationReason = discontinuationReason; }
    }

    public static class LogDoseRequest {
        private String patientId;
        private String medicationId;
        private String scheduledDate;
        private String scheduledTime;
        private String status;

        public String getPatientId() { return patientId; }
        public void setPatientId(String patientId) { this.patientId = patientId; }
        public String getMedicationId() { return medicationId; }
        public void setMedicationId(String medicationId) { this.medicationId = medicationId; }
        public String getScheduledDate() { return scheduledDate; }
        public void setScheduledDate(String scheduledDate) { this.scheduledDate = scheduledDate; }
        public String getScheduledTime() { return scheduledTime; }
        public void setScheduledTime(String scheduledTime) { this.scheduledTime = scheduledTime; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}
