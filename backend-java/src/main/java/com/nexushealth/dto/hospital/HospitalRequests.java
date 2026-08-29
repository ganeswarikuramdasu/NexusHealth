package com.nexushealth.dto.hospital;

import java.util.List;

public class HospitalRequests {

    /** POST /api/hospital/add-doctor - hospital admin directly provisions a doctor account. */
    public static class AddDoctorRequest {
        private String hospitalId;
        private String hospitalName;
        private String name;
        private String email;
        private String password;
        private String specialization;
        private String department;
        private String licenseNumber;
        private Integer experienceYears;
        private Double fee;
        private List<String> workingDays;
        private String phone;
        private String qualification;

        public String getHospitalId() { return hospitalId; }
        public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
        public String getHospitalName() { return hospitalName; }
        public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getSpecialization() { return specialization; }
        public void setSpecialization(String specialization) { this.specialization = specialization; }
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        public String getLicenseNumber() { return licenseNumber; }
        public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
        public Integer getExperienceYears() { return experienceYears; }
        public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }
        public Double getFee() { return fee; }
        public void setFee(Double fee) { this.fee = fee; }
        public List<String> getWorkingDays() { return workingDays; }
        public void setWorkingDays(List<String> workingDays) { this.workingDays = workingDays; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getQualification() { return qualification; }
        public void setQualification(String qualification) { this.qualification = qualification; }
    }

    public static class ToggleHospitalStatusRequest {
        private String hospitalId;
        private String status;

        public String getHospitalId() { return hospitalId; }
        public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public static class ToggleDepartmentRequest {
        private String hospitalId;
        private String departmentName;
        private String status;

        public String getHospitalId() { return hospitalId; }
        public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
        public String getDepartmentName() { return departmentName; }
        public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public static class UpdateHospitalSettingsRequest {
        private String hospitalId;
        private String email;
        private String newPassword;
        private String phone;
        private String address;
        private String emergencyPhone;

        public String getHospitalId() { return hospitalId; }
        public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getEmergencyPhone() { return emergencyPhone; }
        public void setEmergencyPhone(String emergencyPhone) { this.emergencyPhone = emergencyPhone; }
    }

    public static class UpdateDoctorByHospitalRequest {
        private String doctorId;
        private String name;
        private String specialization;
        private String department;
        private Double fee;
        private Integer experienceYears;
        private String licenseNumber;
        private String phone;
        private String qualification;
        private List<String> workingDays;
        private String status;

        public String getDoctorId() { return doctorId; }
        public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getSpecialization() { return specialization; }
        public void setSpecialization(String specialization) { this.specialization = specialization; }
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        public Double getFee() { return fee; }
        public void setFee(Double fee) { this.fee = fee; }
        public Integer getExperienceYears() { return experienceYears; }
        public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }
        public String getLicenseNumber() { return licenseNumber; }
        public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getQualification() { return qualification; }
        public void setQualification(String qualification) { this.qualification = qualification; }
        public List<String> getWorkingDays() { return workingDays; }
        public void setWorkingDays(List<String> workingDays) { this.workingDays = workingDays; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public static class ApproveDoctorRequest {
        private String doctorId;
        private String action;

        public String getDoctorId() { return doctorId; }
        public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
    }

    public static class AddEquipmentRequest {
        private String hospitalId;
        private String name;
        private String category;
        private String status;
        private Integer quantity;
        private String location;
        private String serialNumber;
        private String lastMaintenance;

        public String getHospitalId() { return hospitalId; }
        public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
        public String getSerialNumber() { return serialNumber; }
        public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }
        public String getLastMaintenance() { return lastMaintenance; }
        public void setLastMaintenance(String lastMaintenance) { this.lastMaintenance = lastMaintenance; }
    }
}
