package com.nexushealth.controller;

import com.nexushealth.common.ApiResponse;
import com.nexushealth.dto.ai.AIRequests.*;
import com.nexushealth.service.AIService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    private final AIService aiService;

    public AIController(AIService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/patient-assistant")
    public ApiResponse patientAssistant(@RequestBody PatientAssistantRequest req) {
        return aiService.patientAssistant(req);
    }

    @PostMapping("/doctor-assistant")
    public ApiResponse doctorAssistant(@RequestBody DoctorAssistantRequest req) {
        return aiService.doctorAssistant(req);
    }

    @PostMapping("/prescribe-check")
    public ApiResponse prescribeCheck(@RequestBody PrescribeCheckRequest req) {
        return aiService.prescribeCheck(req);
    }

    @PostMapping("/explain-lab-report")
    public ApiResponse explainLabReport(@RequestBody ExplainLabReportRequest req) {
        return aiService.explainLabReport(req);
    }

    @PostMapping("/generate-diet-plan")
    public ApiResponse generateDietPlan(@RequestBody GenerateDietPlanRequest req) {
        return aiService.generateDietPlan(req);
    }
}
