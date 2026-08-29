package com.nexushealth.controller;

import com.nexushealth.common.ApiResponse;
import com.nexushealth.dto.hospital.HospitalRequests.*;
import com.nexushealth.service.DoctorService;
import com.nexushealth.service.HospitalService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/hospitals", "/api/hospital"})
public class HospitalController {

    private final HospitalService hospitalService;
    private final DoctorService doctorService;

    public HospitalController(HospitalService hospitalService, DoctorService doctorService) {
        this.hospitalService = hospitalService;
        this.doctorService = doctorService;
    }

    @GetMapping
    public List<Map<String, Object>> list() {
        return hospitalService.list();
    }

    @PostMapping("/toggle-status")
    public ApiResponse toggleStatus(@RequestBody ToggleHospitalStatusRequest req) {
        return hospitalService.toggleStatus(req);
    }

    @PostMapping("/toggle-department")
    public ApiResponse toggleDepartment(@RequestBody ToggleDepartmentRequest req) {
        return hospitalService.toggleDepartment(req);
    }

    @PostMapping("/add-doctor")
    public ApiResponse addDoctor(@RequestBody AddDoctorRequest req) {
        return doctorService.addDoctorByHospitalAdmin(req);
    }

    @PostMapping("/update-doctor")
    public ApiResponse updateDoctor(@RequestBody UpdateDoctorByHospitalRequest req) {
        return doctorService.updateDoctorByHospital(req);
    }

    @PostMapping("/delete-doctor")
    public ApiResponse deleteDoctor(@RequestBody com.nexushealth.dto.admin.AdminRequests.DeleteDoctorRequest req) {
        return doctorService.deleteDoctor(req.getDoctorId(), "Hospital Admin", "HOSPITAL_ADMIN");
    }

    @PostMapping("/update-settings")
    public ApiResponse updateSettings(@RequestBody UpdateHospitalSettingsRequest req) {
        return hospitalService.updateSettings(req);
    }

    @PostMapping("/approve-doctor")
    public ApiResponse approveDoctor(@RequestBody ApproveDoctorRequest req) {
        return doctorService.approveDoctorAffiliation(req);
    }

    // ── Equipment ─────────────────────────────────────────────────────

    @GetMapping("/equipment/{hospitalId}")
    public List<Map<String, Object>> getEquipment(@PathVariable String hospitalId) {
        return hospitalService.getEquipment(hospitalId);
    }

    @PostMapping("/equipment/add")
    public ApiResponse addEquipment(@RequestBody AddEquipmentRequest req) {
        return hospitalService.addEquipment(req);
    }

    // ── Audit logs / statistics / doctor activity ─────────────────────

    @GetMapping("/audit-logs")
    public List<Map<String, Object>> getAuditLogs(
            @RequestHeader(name = "x-caller-hospital-id", required = false) String callerHospitalId,
            @RequestHeader(name = "x-hospital-id", required = false) String headerHospitalId,
            @RequestParam(name = "hospitalId", required = false) String queryHospitalId,
            @RequestParam(name = "doctorId", required = false) String doctorId,
            @RequestParam(name = "patientId", required = false) String patientId,
            @RequestParam(name = "accessMethod", required = false) String accessMethod,
            @RequestParam(name = "accessStatus", required = false) String accessStatus,
            @RequestParam(name = "emergencyFlag", required = false) String emergencyFlag,
            @RequestParam(name = "search", required = false) String search) {
        String requestedHospitalId = queryHospitalId != null ? queryHospitalId : headerHospitalId;
        return hospitalService.getAuditLogs(callerHospitalId, requestedHospitalId,
                doctorId, patientId, accessMethod, accessStatus, emergencyFlag, search);
    }

    @GetMapping("/audit-statistics")
    public Map<String, Object> getAuditStatistics(
            @RequestHeader(name = "x-caller-hospital-id", required = false) String callerHospitalId,
            @RequestHeader(name = "x-hospital-id", required = false) String headerHospitalId,
            @RequestParam(name = "hospitalId", required = false) String queryHospitalId) {
        String requestedHospitalId = queryHospitalId != null ? queryHospitalId : headerHospitalId;
        return hospitalService.getAuditStatistics(callerHospitalId, requestedHospitalId);
    }

    @GetMapping("/doctor-activity")
    public List<Map<String, Object>> getDoctorActivity(
            @RequestHeader(name = "x-caller-hospital-id", required = false) String callerHospitalId,
            @RequestHeader(name = "x-hospital-id", required = false) String headerHospitalId,
            @RequestParam(name = "hospitalId", required = false) String queryHospitalId) {
        String requestedHospitalId = queryHospitalId != null ? queryHospitalId : headerHospitalId;
        return hospitalService.getDoctorActivity(callerHospitalId, requestedHospitalId);
    }

    // ── Doctor-specific audit logs ────────────────────────────────────

    @GetMapping("/doctors/{doctorId}/audit-logs")
    public List<Map<String, Object>> getDoctorAuditLogs(
            @PathVariable String doctorId,
            @RequestHeader(name = "x-caller-hospital-id", required = false) String callerHospitalId,
            @RequestHeader(name = "x-hospital-id", required = false) String headerHospitalId,
            @RequestParam(name = "hospitalId", required = false) String queryHospitalId) {
        String requestedHospitalId = queryHospitalId != null ? queryHospitalId : headerHospitalId;
        return hospitalService.getDoctorAuditLogs(doctorId, callerHospitalId, requestedHospitalId);
    }

    // ── Hospital-scoped records ───────────────────────────────────────

    @GetMapping("/records")
    public List<Map<String, Object>> getRecords(
            @RequestHeader(name = "x-caller-hospital-id", required = false) String callerHospitalId,
            @RequestHeader(name = "x-hospital-id", required = false) String headerHospitalId,
            @RequestParam(name = "hospitalId", required = false) String queryHospitalId,
            @RequestParam(name = "doctorName", required = false) String doctorName,
            @RequestParam(name = "doctorId", required = false) String doctorId,
            @RequestParam(name = "doctor", required = false) String doctor,
            @RequestParam(name = "department", required = false) String department,
            @RequestParam(name = "dept", required = false) String dept,
            @RequestParam(name = "patientId", required = false) String patientId,
            @RequestParam(name = "nexusHealthId", required = false) String nexusHealthId,
            @RequestParam(name = "globalHealthId", required = false) String globalHealthId,
            @RequestParam(name = "patientHealthId", required = false) String patientHealthId,
            @RequestParam(name = "search", required = false) String search) {
        String requestedHospitalId = queryHospitalId != null ? queryHospitalId : headerHospitalId;
        return hospitalService.getRecords(callerHospitalId, requestedHospitalId,
                doctorName, doctorId, doctor, department, dept, patientId,
                nexusHealthId, globalHealthId, patientHealthId, search);
    }

    @GetMapping("/{hospitalId}/records")
    public List<Map<String, Object>> getHospitalRecords(
            @PathVariable String hospitalId,
            @RequestHeader(name = "x-caller-hospital-id", required = false) String callerHospitalId,
            @RequestHeader(name = "x-hospital-id", required = false) String headerHospitalId,
            @RequestParam(name = "hospitalId", required = false) String queryHospitalId,
            @RequestParam(name = "doctorName", required = false) String doctorName,
            @RequestParam(name = "doctorId", required = false) String doctorId,
            @RequestParam(name = "doctor", required = false) String doctor,
            @RequestParam(name = "department", required = false) String department,
            @RequestParam(name = "dept", required = false) String dept,
            @RequestParam(name = "patientId", required = false) String patientId,
            @RequestParam(name = "nexusHealthId", required = false) String nexusHealthId,
            @RequestParam(name = "globalHealthId", required = false) String globalHealthId,
            @RequestParam(name = "patientHealthId", required = false) String patientHealthId,
            @RequestParam(name = "search", required = false) String search) {
        String requestedHospitalId = hospitalId;
        return hospitalService.getRecords(callerHospitalId, requestedHospitalId,
                doctorName, doctorId, doctor, department, dept, patientId,
                nexusHealthId, globalHealthId, patientHealthId, search);
    }
}
