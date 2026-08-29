package com.nexushealth.controller;

import com.nexushealth.common.ApiResponse;
import com.nexushealth.dto.emergency.EmergencyRequests.AddNoteRequest;
import com.nexushealth.dto.emergency.EmergencyRequests.IdentifyRequest;
import com.nexushealth.dto.emergency.EmergencyRequests.StartSessionRequest;
import com.nexushealth.dto.emergency.EmergencyRequests.UpdateProfileRequest;
import com.nexushealth.service.EmergencyService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/emergency"})
public class EmergencyController {

    private final EmergencyService emergencyService;

    public EmergencyController(EmergencyService emergencyService) {
        this.emergencyService = emergencyService;
    }

    @PostMapping("/identify")
    public ApiResponse identify(@RequestBody IdentifyRequest req) {
        return emergencyService.identify(req);
    }

    @PostMapping("/start-session")
    public ApiResponse startSession(@RequestBody StartSessionRequest req) {
        return emergencyService.startSession(req);
    }

    @GetMapping("/active-sessions")
    public List<Map<String, Object>> activeSessions() {
        return emergencyService.activeSessions();
    }

    @GetMapping("/session/{sessionId}")
    public ApiResponse getSession(@PathVariable String sessionId) {
        return emergencyService.getSession(sessionId);
    }

    @PostMapping("/session/{sessionId}/end")
    public ApiResponse endSession(@PathVariable String sessionId) {
        return emergencyService.endSession(sessionId);
    }

    @GetMapping("/summary/{sessionId}")
    public ApiResponse getSummary(@PathVariable String sessionId) {
        return emergencyService.getSummary(sessionId);
    }

    @GetMapping("/ai-summary/{sessionId}")
    public ApiResponse aiSummary(@PathVariable String sessionId) {
        return emergencyService.aiSummary(sessionId);
    }

    @PostMapping("/session/{sessionId}/full-records")
    public ApiResponse fullRecords(@PathVariable String sessionId) {
        return emergencyService.fullRecords(sessionId);
    }

    @PostMapping("/session/{sessionId}/add-note")
    public ApiResponse addNote(@PathVariable String sessionId, @RequestBody AddNoteRequest req) {
        return emergencyService.addNote(sessionId, req);
    }

    @GetMapping("/patient/{patientId}/profile")
    public ApiResponse patientProfile(@PathVariable String patientId) {
        return emergencyService.patientProfile(patientId);
    }

    @PostMapping("/patient/{patientId}/profile")
    public ApiResponse updatePatientProfile(@PathVariable String patientId, @RequestBody UpdateProfileRequest req) {
        return emergencyService.updatePatientProfile(patientId, req);
    }

    @GetMapping("/patient/{patientId}/history")
    public ApiResponse patientHistory(@PathVariable String patientId) {
        return emergencyService.patientHistory(patientId);
    }

    @PostMapping("/patient/notifications/{notifId}/read")
    public ApiResponse markNotificationRead(@PathVariable String notifId) {
        return emergencyService.markNotificationRead(notifId);
    }

    @GetMapping("/hospital/{hospitalId}/sessions")
    public ApiResponse hospitalSessions(@PathVariable String hospitalId) {
        return emergencyService.hospitalSessions(hospitalId);
    }

    @GetMapping("/admin/sessions")
    public ApiResponse adminSessions() {
        return emergencyService.adminSessions();
    }
}
