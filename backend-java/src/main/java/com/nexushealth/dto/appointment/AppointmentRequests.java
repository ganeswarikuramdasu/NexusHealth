package com.nexushealth.dto.appointment;

import java.util.List;

public class AppointmentRequests {

    public static class BookRequest {
        private String patientId;
        private String patientName;
        private String patientHealthId;
        private String hospitalId;
        private String doctorId;
        private String appointmentDate;
        private String slotTime;
        private String appointmentType;
        private String symptoms;
        private String priority;

        public String getPatientId() { return patientId; }
        public void setPatientId(String patientId) { this.patientId = patientId; }
        public String getPatientName() { return patientName; }
        public void setPatientName(String patientName) { this.patientName = patientName; }
        public String getPatientHealthId() { return patientHealthId; }
        public void setPatientHealthId(String patientHealthId) { this.patientHealthId = patientHealthId; }
        public String getHospitalId() { return hospitalId; }
        public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
        public String getDoctorId() { return doctorId; }
        public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
        public String getAppointmentDate() { return appointmentDate; }
        public void setAppointmentDate(String appointmentDate) { this.appointmentDate = appointmentDate; }
        public String getSlotTime() { return slotTime; }
        public void setSlotTime(String slotTime) { this.slotTime = slotTime; }
        public String getAppointmentType() { return appointmentType; }
        public void setAppointmentType(String appointmentType) { this.appointmentType = appointmentType; }
        public String getSymptoms() { return symptoms; }
        public void setSymptoms(String symptoms) { this.symptoms = symptoms; }
        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }
    }

    public static class RescheduleRequest {
        private String appointmentId;
        private String newDate;
        private String newSlotTime;
        private String reason;

        public String getAppointmentId() { return appointmentId; }
        public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }
        public String getNewDate() { return newDate; }
        public void setNewDate(String newDate) { this.newDate = newDate; }
        public String getNewSlotTime() { return newSlotTime; }
        public void setNewSlotTime(String newSlotTime) { this.newSlotTime = newSlotTime; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    public static class CancelRequest {
        private String appointmentId;
        private String reason;
        private String cancelledBy;

        public String getAppointmentId() { return appointmentId; }
        public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        public String getCancelledBy() { return cancelledBy; }
        public void setCancelledBy(String cancelledBy) { this.cancelledBy = cancelledBy; }
    }

    public static class CheckInRequest {
        private String appointmentId;

        public String getAppointmentId() { return appointmentId; }
        public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }
    }

    public static class UpdateStatusRequest {
        private String appointmentId;
        private String status;
        private List<Object> investigationTests;
        private String doctorNotes;
        private Object prescription;

        public String getAppointmentId() { return appointmentId; }
        public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public List<Object> getInvestigationTests() { return investigationTests; }
        public void setInvestigationTests(List<Object> investigationTests) { this.investigationTests = investigationTests; }
        public String getDoctorNotes() { return doctorNotes; }
        public void setDoctorNotes(String doctorNotes) { this.doctorNotes = doctorNotes; }
        public Object getPrescription() { return prescription; }
        public void setPrescription(Object prescription) { this.prescription = prescription; }
    }
}
