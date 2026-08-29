package com.nexushealth.dto.doctor;

import java.util.Map;

public class DoctorRequests {

    public static class RegisterDoctorRequest {
        private String name;
        private String email;
        private String password;
        private String specialization;
        private String licenseNumber;
        private Integer experienceYears;
        private String hospitalId;
        private Double fee;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getSpecialization() { return specialization; }
        public void setSpecialization(String specialization) { this.specialization = specialization; }
        public String getLicenseNumber() { return licenseNumber; }
        public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
        public Integer getExperienceYears() { return experienceYears; }
        public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }
        public String getHospitalId() { return hospitalId; }
        public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
        public Double getFee() { return fee; }
        public void setFee(Double fee) { this.fee = fee; }
    }

    /** Loose bag of editable profile fields - mirrors the Node route, which accepts any subset. */
    public static class UpdateDoctorProfileRequest extends java.util.HashMap<String, Object> {
    }

    public static class UpdateDoctorScheduleRequest {
        private Map<String, Object> weeklySchedule;
        private Integer slotDurationMin;
        private Integer slotBufferMin;
        private Integer tokensPerSlot;
        private Integer dailyMaxAppointments;
        private Integer bookingHorizonDays;
        private Integer bookingCutoffMins;
        private String scheduleEffectiveDate;

        public Map<String, Object> getWeeklySchedule() { return weeklySchedule; }
        public void setWeeklySchedule(Map<String, Object> weeklySchedule) { this.weeklySchedule = weeklySchedule; }
        public Integer getSlotDurationMin() { return slotDurationMin; }
        public void setSlotDurationMin(Integer slotDurationMin) { this.slotDurationMin = slotDurationMin; }
        public Integer getSlotBufferMin() { return slotBufferMin; }
        public void setSlotBufferMin(Integer slotBufferMin) { this.slotBufferMin = slotBufferMin; }
        public Integer getTokensPerSlot() { return tokensPerSlot; }
        public void setTokensPerSlot(Integer tokensPerSlot) { this.tokensPerSlot = tokensPerSlot; }
        public Integer getDailyMaxAppointments() { return dailyMaxAppointments; }
        public void setDailyMaxAppointments(Integer dailyMaxAppointments) { this.dailyMaxAppointments = dailyMaxAppointments; }
        public Integer getBookingHorizonDays() { return bookingHorizonDays; }
        public void setBookingHorizonDays(Integer bookingHorizonDays) { this.bookingHorizonDays = bookingHorizonDays; }
        public Integer getBookingCutoffMins() { return bookingCutoffMins; }
        public void setBookingCutoffMins(Integer bookingCutoffMins) { this.bookingCutoffMins = bookingCutoffMins; }
        public String getScheduleEffectiveDate() { return scheduleEffectiveDate; }
        public void setScheduleEffectiveDate(String scheduleEffectiveDate) { this.scheduleEffectiveDate = scheduleEffectiveDate; }
    }

    public static class AccessRecordsRequest {
        private String doctorId;
        private String doctorName;
        private String targetHealthId;
        private String patientHealthId;
        private Boolean emergencyBreakGlass;
        private String breakGlassReason;
        private String emergencyReason;

        public String getDoctorId() { return doctorId; }
        public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
        public String getDoctorName() { return doctorName; }
        public void setDoctorName(String doctorName) { this.doctorName = doctorName; }
        public String getTargetHealthId() { return targetHealthId; }
        public void setTargetHealthId(String targetHealthId) { this.targetHealthId = targetHealthId; }
        public String getPatientHealthId() { return patientHealthId; }
        public void setPatientHealthId(String patientHealthId) { this.patientHealthId = patientHealthId; }
        public Boolean getEmergencyBreakGlass() { return emergencyBreakGlass; }
        public void setEmergencyBreakGlass(Boolean emergencyBreakGlass) { this.emergencyBreakGlass = emergencyBreakGlass; }
        public String getBreakGlassReason() { return breakGlassReason; }
        public void setBreakGlassReason(String breakGlassReason) { this.breakGlassReason = breakGlassReason; }
        public String getEmergencyReason() { return emergencyReason; }
        public void setEmergencyReason(String emergencyReason) { this.emergencyReason = emergencyReason; }
    }

    public static class AccessSessionsRequest {
        private String doctorId;
        private String patientHealthId;
        private String accessMethod;
        private String reason;
        private String justification;
        private String appointmentId;
        private String accessCardId;

        public String getDoctorId() { return doctorId; }
        public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
        public String getPatientHealthId() { return patientHealthId; }
        public void setPatientHealthId(String patientHealthId) { this.patientHealthId = patientHealthId; }
        public String getAccessMethod() { return accessMethod; }
        public void setAccessMethod(String accessMethod) { this.accessMethod = accessMethod; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        public String getJustification() { return justification; }
        public void setJustification(String justification) { this.justification = justification; }
        public String getAppointmentId() { return appointmentId; }
        public void setAppointmentId(String appointmentId) { this.appointmentId = appointmentId; }
        public String getAccessCardId() { return accessCardId; }
        public void setAccessCardId(String accessCardId) { this.accessCardId = accessCardId; }
    }

    public static class SessionActionRequest {
        private String actionName;
        private String recordType;

        public String getActionName() { return actionName; }
        public void setActionName(String actionName) { this.actionName = actionName; }
        public String getRecordType() { return recordType; }
        public void setRecordType(String recordType) { this.recordType = recordType; }
    }

    public static class DateOverrideRequest {
        private String date;
        private Boolean active;
        private Object timeSlots;
        private Object breaks;
        private String reason;

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public Boolean getActive() { return active; }
        public void setActive(Boolean active) { this.active = active; }
        public Object getTimeSlots() { return timeSlots; }
        public void setTimeSlots(Object timeSlots) { this.timeSlots = timeSlots; }
        public Object getBreaks() { return breaks; }
        public void setBreaks(Object breaks) { this.breaks = breaks; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    public static class LeaveRequest {
        private String startDate;
        private String endDate;
        private Boolean isFullDay;
        private String startTime;
        private String endTime;
        private String reason;
        private String category;

        public String getStartDate() { return startDate; }
        public void setStartDate(String startDate) { this.startDate = startDate; }
        public String getEndDate() { return endDate; }
        public void setEndDate(String endDate) { this.endDate = endDate; }
        public Boolean getIsFullDay() { return isFullDay; }
        public void setIsFullDay(Boolean isFullDay) { this.isFullDay = isFullDay; }
        public String getStartTime() { return startTime; }
        public void setStartTime(String startTime) { this.startTime = startTime; }
        public String getEndTime() { return endTime; }
        public void setEndTime(String endTime) { this.endTime = endTime; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
    }

    public static class EmergencyUnavailabilityRequest {
        private String startDate;
        private String endDate;
        private String startTime;
        private String endTime;
        private String reason;
        private String actionTaken;

        public String getStartDate() { return startDate; }
        public void setStartDate(String startDate) { this.startDate = startDate; }
        public String getEndDate() { return endDate; }
        public void setEndDate(String endDate) { this.endDate = endDate; }
        public String getStartTime() { return startTime; }
        public void setStartTime(String startTime) { this.startTime = startTime; }
        public String getEndTime() { return endTime; }
        public void setEndTime(String endTime) { this.endTime = endTime; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        public String getActionTaken() { return actionTaken; }
        public void setActionTaken(String actionTaken) { this.actionTaken = actionTaken; }
    }

    public static class ToggleActiveRequest {
        private String doctorId;
        private Boolean isActive;
        private String activeStatus;
        private String targetScope;
        private String specificDate;
        private String actionType;
        private String reason;

        public String getDoctorId() { return doctorId; }
        public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
        public Boolean getIsActive() { return isActive; }
        public void setIsActive(Boolean isActive) { this.isActive = isActive; }
        public String getActiveStatus() { return activeStatus; }
        public void setActiveStatus(String activeStatus) { this.activeStatus = activeStatus; }
        public String getTargetScope() { return targetScope; }
        public void setTargetScope(String targetScope) { this.targetScope = targetScope; }
        public String getSpecificDate() { return specificDate; }
        public void setSpecificDate(String specificDate) { this.specificDate = specificDate; }
        public String getActionType() { return actionType; }
        public void setActionType(String actionType) { this.actionType = actionType; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    public static class CustomSlotRequest {
        private String date;
        private String dayName;
        private String slotName;
        private String startTime;
        private String endTime;
        private Integer tokensMax;
        private Integer customFee;
        private String notes;

        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        public String getDayName() { return dayName; }
        public void setDayName(String dayName) { this.dayName = dayName; }
        public String getSlotName() { return slotName; }
        public void setSlotName(String slotName) { this.slotName = slotName; }
        public String getStartTime() { return startTime; }
        public void setStartTime(String startTime) { this.startTime = startTime; }
        public String getEndTime() { return endTime; }
        public void setEndTime(String endTime) { this.endTime = endTime; }
        public Integer getTokensMax() { return tokensMax; }
        public void setTokensMax(Integer tokensMax) { this.tokensMax = tokensMax; }
        public Integer getCustomFee() { return customFee; }
        public void setCustomFee(Integer customFee) { this.customFee = customFee; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }
}
