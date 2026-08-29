package com.nexushealth.dto.admin;

public class AdminRequests {

    public static class AddHospitalRequest {
        private String name;
        private String email;
        private String password;
        private String licenseNumber;
        private String address;
        private String phone;
        private Integer totalBeds;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getLicenseNumber() { return licenseNumber; }
        public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public Integer getTotalBeds() { return totalBeds; }
        public void setTotalBeds(Integer totalBeds) { this.totalBeds = totalBeds; }
    }

    public static class ApproveHospitalRequest {
        private String hospitalId;
        private String action;

        public String getHospitalId() { return hospitalId; }
        public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
    }

    public static class DeleteHospitalRequest {
        private String hospitalId;

        public String getHospitalId() { return hospitalId; }
        public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
    }

    public static class EditHospitalRequest {
        private String hospitalId;
        private String name;
        private String email;
        private String licenseNumber;
        private String address;
        private String phone;
        private Integer totalBeds;
        private Integer availableBeds;
        private String status;

        public String getHospitalId() { return hospitalId; }
        public void setHospitalId(String hospitalId) { this.hospitalId = hospitalId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getLicenseNumber() { return licenseNumber; }
        public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public Integer getTotalBeds() { return totalBeds; }
        public void setTotalBeds(Integer totalBeds) { this.totalBeds = totalBeds; }
        public Integer getAvailableBeds() { return availableBeds; }
        public void setAvailableBeds(Integer availableBeds) { this.availableBeds = availableBeds; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public static class DeleteDoctorRequest {
        private String doctorId;

        public String getDoctorId() { return doctorId; }
        public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
    }

    public static class DeletePatientRequest {
        private String patientUserId;

        public String getPatientUserId() { return patientUserId; }
        public void setPatientUserId(String patientUserId) { this.patientUserId = patientUserId; }
    }
}
