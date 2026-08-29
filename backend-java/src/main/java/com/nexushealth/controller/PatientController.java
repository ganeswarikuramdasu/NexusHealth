package com.nexushealth.controller;

import com.nexushealth.common.ApiResponse;
import com.nexushealth.dto.patient.PatientRequests.AddDietPlanRequest;
import com.nexushealth.dto.patient.PatientRequests.AddManualRecordRequest;
import com.nexushealth.dto.patient.PatientRequests.GrantConsentRequest;
import com.nexushealth.dto.patient.PatientRequests.SubmitFeedbackRequest;
import com.nexushealth.service.PatientService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/patients", "/api/patient"})
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @GetMapping("/lookup/{healthId}")
    public ApiResponse lookup(@PathVariable String healthId) {
        return patientService.lookup(healthId);
    }

    @GetMapping("/profile/{userId}")
    public Map<String, Object> profile(@PathVariable String userId) {
        return patientService.profile(userId);
    }

    @GetMapping("/records/{patientId}")
    public List<Map<String, Object>> records(@PathVariable String patientId) {
        return patientService.records(patientId);
    }

    @GetMapping("/consents/{patientId}")
    public List<Map<String, Object>> consents(@PathVariable String patientId) {
        return patientService.consents(patientId);
    }

    @PostMapping("/consents/grant")
    public ApiResponse grantConsent(@RequestBody GrantConsentRequest req) {
        return patientService.grantConsent(req);
    }

    @PostMapping("/consents/revoke/{consentId}")
    public ApiResponse revokeConsent(@PathVariable String consentId) {
        return patientService.revokeConsent(consentId);
    }

    @PostMapping("/add-manual-record")
    public ApiResponse addManualRecord(@RequestBody AddManualRecordRequest req) {
        return patientService.addManualRecord(req);
    }

    @PostMapping("/submit-feedback")
    public ApiResponse submitFeedback(@RequestBody SubmitFeedbackRequest req) {
        return patientService.submitFeedback(req);
    }

    @GetMapping("/diet-plans/{patientId}")
    public List<Map<String, Object>> getDietPlans(@PathVariable String patientId) {
        return patientService.getDietPlans(patientId);
    }

    @PostMapping("/add-diet-plan")
    public ApiResponse addDietPlan(@RequestBody AddDietPlanRequest req) {
        return patientService.addDietPlan(req);
    }

    @GetMapping({"/access-history", "/access-history/{patientId}"})
    public List<Map<String, Object>> accessHistory(
            @PathVariable(required = false) String patientId,
            @RequestParam(required = false) String patientIdQuery,
            @RequestHeader(value = "x-patient-id", required = false) String headerPatientId) {
        String pid = patientId != null ? patientId : (patientIdQuery != null ? patientIdQuery : headerPatientId);
        return patientService.accessHistory(pid);
    }
}
