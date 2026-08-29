package com.nexushealth.controller;

import com.nexushealth.common.ApiResponse;
import com.nexushealth.dto.medicalRecord.MedicalRecordRequests.CreateLabRequest;
import com.nexushealth.dto.medicalRecord.MedicalRecordRequests.CreateRecordRequest;
import com.nexushealth.dto.medicalRecord.MedicalRecordRequests.CreateVitalsRequest;
import com.nexushealth.service.MedicalRecordService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/medical-records", "/api/medical-record"})
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    public MedicalRecordController(MedicalRecordService medicalRecordService) {
        this.medicalRecordService = medicalRecordService;
    }

    @PostMapping("/create")
    public ApiResponse create(@RequestBody CreateRecordRequest req) {
        return medicalRecordService.createRecord(req);
    }

    @PostMapping("/create-lab")
    public ApiResponse createLab(@RequestBody CreateLabRequest req) {
        return medicalRecordService.createLabRecord(req);
    }

    @PostMapping("/vitals")
    public ApiResponse vitals(@RequestBody CreateVitalsRequest req) {
        return medicalRecordService.createVitals(req);
    }

    @GetMapping("/patient/{patientHealthId}")
    public ApiResponse getPatientRecords(@PathVariable String patientHealthId) {
        return medicalRecordService.getPatientRecords(patientHealthId);
    }
}
