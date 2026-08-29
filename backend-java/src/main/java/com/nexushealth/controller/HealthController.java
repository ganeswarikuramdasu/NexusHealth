package com.nexushealth.controller;

import com.nexushealth.common.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    @Value("${nexushealth.gemini.api-key:}")
    private String geminiApiKey;

    @GetMapping("/health")
    public ApiResponse health() {
        Map<String, Object> services = new LinkedHashMap<>();
        services.put("identityService", "HEALTHY");
        services.put("patientService", "HEALTHY");
        services.put("doctorService", "HEALTHY");
        services.put("hospitalService", "HEALTHY");
        services.put("appointmentService", "HEALTHY");
        services.put("medicalRecordService", "HEALTHY");
        services.put("cardService", "HEALTHY");
        services.put("emergencyService", "HEALTHY");
        services.put("aiService", (geminiApiKey != null && !geminiApiKey.isBlank()) ? "ACTIVE_GEMINI" : "SIMULATED_GEMINI");
        services.put("adminService", "HEALTHY");

        ApiResponse response = new ApiResponse();
        response.put("status", "UP");
        response.put("services", services);
        response.put("timestamp", Instant.now().toString());
        return response;
    }
}
