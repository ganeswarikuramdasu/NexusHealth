package com.nexushealth.dto.auth;

/**
 * Request bodies for /api/auth/*. Kept loose (no @NotBlank on every field)
 * to match the original Node handlers, which validate fields manually
 * inside the route body rather than rejecting at the framework boundary -
 * this preserves the exact same custom error messages the frontend already
 * knows how to display.
 */
public class AuthRequests {

    public static class SendOtpRequest {
        private String email;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    public static class VerifyOtpRequest {
        private String email;
        private String otpCode;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getOtpCode() { return otpCode; }
        public void setOtpCode(String otpCode) { this.otpCode = otpCode; }
    }

    public static class LoginRequest {
        private String email;
        private String password;
        private String role;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }

    public static class RegisterPatientRequest {
        private String name;
        private String email;
        private String password;
        private String dob;
        private String gender;
        private String bloodGroup;
        private Double heightCm;
        private Double weightKg;
        private String emergencyContactName;
        private String emergencyContactPhone;
        private Boolean otpVerified;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getDob() { return dob; }
        public void setDob(String dob) { this.dob = dob; }
        public String getGender() { return gender; }
        public void setGender(String gender) { this.gender = gender; }
        public String getBloodGroup() { return bloodGroup; }
        public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }
        public Double getHeightCm() { return heightCm; }
        public void setHeightCm(Double heightCm) { this.heightCm = heightCm; }
        public Double getWeightKg() { return weightKg; }
        public void setWeightKg(Double weightKg) { this.weightKg = weightKg; }
        public String getEmergencyContactName() { return emergencyContactName; }
        public void setEmergencyContactName(String emergencyContactName) { this.emergencyContactName = emergencyContactName; }
        public String getEmergencyContactPhone() { return emergencyContactPhone; }
        public void setEmergencyContactPhone(String emergencyContactPhone) { this.emergencyContactPhone = emergencyContactPhone; }
        public Boolean getOtpVerified() { return otpVerified; }
        public void setOtpVerified(Boolean otpVerified) { this.otpVerified = otpVerified; }
    }

    public static class UpdateProfilePasswordRequest {
        private String userId;
        private String email;
        private String currentPassword;
        private String newPassword;
        private String name;
        private String phone;
        private String emergencyContactName;
        private String emergencyContactPhone;
        private String bloodGroup;
        private String specialization;
        private Integer experienceYears;
        private Double fee;
        private String hospitalName;
        private String address;
        private Integer totalBeds;
        private Integer availableBeds;

        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getCurrentPassword() { return currentPassword; }
        public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getEmergencyContactName() { return emergencyContactName; }
        public void setEmergencyContactName(String emergencyContactName) { this.emergencyContactName = emergencyContactName; }
        public String getEmergencyContactPhone() { return emergencyContactPhone; }
        public void setEmergencyContactPhone(String emergencyContactPhone) { this.emergencyContactPhone = emergencyContactPhone; }
        public String getBloodGroup() { return bloodGroup; }
        public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }
        public String getSpecialization() { return specialization; }
        public void setSpecialization(String specialization) { this.specialization = specialization; }
        public Integer getExperienceYears() { return experienceYears; }
        public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }
        public Double getFee() { return fee; }
        public void setFee(Double fee) { this.fee = fee; }
        public String getHospitalName() { return hospitalName; }
        public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public Integer getTotalBeds() { return totalBeds; }
        public void setTotalBeds(Integer totalBeds) { this.totalBeds = totalBeds; }
        public Integer getAvailableBeds() { return availableBeds; }
        public void setAvailableBeds(Integer availableBeds) { this.availableBeds = availableBeds; }
    }
}

