package com.nexushealth.controller;

import com.nexushealth.common.ApiResponse;
import com.nexushealth.dto.admin.AdminRequests.*;
import com.nexushealth.service.AdminService;
import com.nexushealth.service.DoctorService;
import com.nexushealth.service.HospitalService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final HospitalService hospitalService;
    private final DoctorService doctorService;
    private final AdminService adminService;

    public AdminController(HospitalService hospitalService, DoctorService doctorService, AdminService adminService) {
        this.hospitalService = hospitalService;
        this.doctorService = doctorService;
        this.adminService = adminService;
    }

    @PostMapping("/add-hospital")
    public ApiResponse addHospital(@RequestBody AddHospitalRequest req) {
        return hospitalService.addHospital(req);
    }

    @PostMapping("/approve-hospital")
    public ApiResponse approveHospital(@RequestBody ApproveHospitalRequest req) {
        return hospitalService.approveHospital(req);
    }

    @PostMapping("/delete-hospital")
    public ApiResponse deleteHospital(@RequestBody DeleteHospitalRequest req) {
        return hospitalService.deleteHospital(req.getHospitalId());
    }

    @PostMapping("/edit-hospital")
    public ApiResponse editHospital(@RequestBody EditHospitalRequest req) {
        return hospitalService.editHospital(req);
    }

    @PostMapping("/delete-doctor")
    public ApiResponse deleteDoctor(@RequestBody DeleteDoctorRequest req) {
        return doctorService.deleteDoctor(req.getDoctorId(), "Developer Super Admin", "SUPER_ADMIN");
    }

    @GetMapping("/patients")
    public List<Map<String, Object>> patients() {
        return adminService.getPatients();
    }

    @PostMapping("/delete-patient")
    public ApiResponse deletePatient(@RequestBody DeletePatientRequest req) {
        return adminService.deletePatient(req.getPatientUserId());
    }

    @GetMapping("/audit-logs")
    public List<Map<String, Object>> auditLogs() {
        return adminService.getAuditLogs();
    }

    @GetMapping("/all-records")
    public List<Map<String, Object>> allRecords() {
        return adminService.getAllRecords();
    }

    @GetMapping("/record-access-logs")
    public List<Map<String, Object>> recordAccessLogs(
            @RequestParam(required = false) String hospitalId,
            @RequestParam(required = false) String doctorId,
            @RequestParam(required = false) String patientId,
            @RequestParam(required = false) String accessMethod,
            @RequestParam(required = false) String accessStatus,
            @RequestParam(required = false) String emergencyFlag,
            @RequestParam(required = false) String search) {
        return adminService.getRecordAccessLogs(hospitalId, doctorId, patientId,
                accessMethod, accessStatus, emergencyFlag, search);
    }

    @GetMapping("/record-access-logs/{id}")
    public Map<String, Object> recordAccessLogDetail(@PathVariable String id) {
        return adminService.getRecordAccessLogDetail(id);
    }

    @GetMapping("/audit-statistics")
    public Map<String, Object> auditStatistics() {
        return adminService.getAuditStatistics();
    }
}
