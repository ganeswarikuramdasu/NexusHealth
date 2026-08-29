package com.nexushealth.controller;

import com.nexushealth.common.ApiResponse;
import com.nexushealth.dto.medication.MedicationRequests.*;
import com.nexushealth.service.MedicationService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/medications")
public class MedicationController {

    private final MedicationService medicationService;

    public MedicationController(MedicationService medicationService) {
        this.medicationService = medicationService;
    }

    @GetMapping("/patient/{patientId}")
    public ApiResponse getForPatient(@PathVariable String patientId) {
        return medicationService.getForPatient(patientId);
    }

    @PostMapping
    public ApiResponse add(@RequestBody AddMedicationRequest req) {
        return medicationService.addMedication(req);
    }

    @PutMapping("/{id}")
    public ApiResponse update(@PathVariable String id, @RequestBody UpdateMedicationRequest req) {
        return medicationService.updateMedication(id, req);
    }

    @PostMapping("/{id}/discontinue")
    public ApiResponse discontinue(@PathVariable String id, @RequestBody DiscontinueMedicationRequest req) {
        return medicationService.discontinueMedication(id, req);
    }

    @PostMapping("/doses/log")
    public ApiResponse logDose(@RequestBody LogDoseRequest req) {
        return medicationService.logDose(req);
    }
}
