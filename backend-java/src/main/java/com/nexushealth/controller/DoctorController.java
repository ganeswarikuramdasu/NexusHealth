package com.nexushealth.controller;

import com.nexushealth.common.ApiResponse;
import com.nexushealth.dto.doctor.DoctorRequests.*;
import com.nexushealth.service.DoctorService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/doctors", "/api/doctor"})
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    // ========================================================================
    // Global endpoints (no {id} path variable)
    // ========================================================================

    @GetMapping
    public List<Map<String, Object>> list() {
        return doctorService.list();
    }

    @PostMapping("/register")
    public ApiResponse register(@RequestBody RegisterDoctorRequest req) {
        return doctorService.register(req);
    }

    /** GET /access-history and /access-logs - both aliases. */
    @GetMapping({"/access-history", "/access-logs"})
    public List<Map<String, Object>> getAccessHistory(
            @RequestParam(required = false) String doctorId,
            @RequestParam(required = false) String accessType,
            @RequestParam(required = false) String accessMethod,
            @RequestParam(required = false) String patientId,
            @RequestParam(required = false) String search) {
        return doctorService.getAccessHistory(doctorId, accessType, accessMethod, patientId, search);
    }

    /** POST /access-records and /access-patient-records - both aliases. */
    @PostMapping({"/access-records", "/access-patient-records"})
    public ApiResponse accessPatientRecords(@RequestBody AccessRecordsRequest req) {
        return doctorService.accessPatientRecords(req);
    }

    @PostMapping("/access-sessions")
    public ApiResponse createAccessSession(@RequestBody AccessSessionsRequest req) {
        return doctorService.createAccessSession(req);
    }

    /** Global toggle-active (body has doctorId). */
    @PostMapping("/toggle-active")
    public ApiResponse toggleActiveGlobal(@RequestBody ToggleActiveRequest req) {
        return doctorService.toggleActiveGlobal(req);
    }

    /** GET /records - global doctor records listing. */
    @GetMapping("/records")
    public List<Map<String, Object>> getRecordsGlobal(
            @RequestParam(required = false) String doctorId,
            @RequestHeader(value = "x-doctor-id", required = false) String headerDocId,
            @RequestHeader(value = "x-caller-doctor-id", required = false) String callerHeaderDocId,
            @RequestParam(required = false) String search) {
        String callerDocId = callerHeaderDocId != null ? callerHeaderDocId : headerDocId;
        String targetDocId = doctorId != null ? doctorId : (headerDocId != null ? headerDocId : "doc_1");
        return doctorService.getDoctorRecords(callerDocId, targetDocId, search);
    }

    /** GET /feedback/{doctorId} */
    @GetMapping("/feedback/{doctorId}")
    public List<Map<String, Object>> getFeedback(@PathVariable String doctorId) {
        return doctorService.getFeedback(doctorId);
    }

    // ========================================================================
    // Doctor-scoped endpoints (/{id}/...)
    // ========================================================================

    @GetMapping("/{id}/profile")
    public ApiResponse getProfile(@PathVariable String id) {
        return doctorService.getProfile(id);
    }

    @PutMapping("/{id}/profile")
    public ApiResponse updateProfile(@PathVariable String id, @RequestBody UpdateDoctorProfileRequest req) {
        return doctorService.updateProfile(id, req);
    }

    @GetMapping("/{id}/schedule")
    public ApiResponse getSchedule(@PathVariable String id) {
        return doctorService.getSchedule(id);
    }

    @PutMapping("/{id}/schedule")
    public ApiResponse updateSchedule(@PathVariable String id, @RequestBody UpdateDoctorScheduleRequest req) {
        return doctorService.updateSchedule(id, req);
    }

    /** GET /{doctorId}/records - doctor-scoped records listing. */
    @GetMapping("/{doctorId}/records")
    public List<Map<String, Object>> getDoctorRecords(
            @PathVariable String doctorId,
            @RequestHeader(value = "x-caller-doctor-id", required = false) String callerDocId,
            @RequestHeader(value = "x-doctor-id", required = false) String headerDocId,
            @RequestParam(required = false) String search) {
        String effectiveCaller = callerDocId != null ? callerDocId : headerDocId;
        return doctorService.getDoctorRecords(effectiveCaller, doctorId, search);
    }

    @PostMapping("/{id}/date-overrides")
    public ApiResponse addDateOverride(@PathVariable String id, @RequestBody DateOverrideRequest req) {
        return doctorService.addDateOverride(id, req);
    }

    @PostMapping("/{id}/leaves")
    public ApiResponse addLeave(@PathVariable String id, @RequestBody LeaveRequest req) {
        return doctorService.addLeave(id, req);
    }

    @DeleteMapping("/{id}/leaves/{leaveId}")
    public ApiResponse deleteLeave(@PathVariable String id, @PathVariable String leaveId) {
        return doctorService.deleteLeave(id, leaveId);
    }

    @PostMapping("/{id}/emergency-unavailability")
    public ApiResponse setEmergencyUnavailability(@PathVariable String id,
                                                  @RequestBody EmergencyUnavailabilityRequest req) {
        return doctorService.setEmergencyUnavailability(id, req);
    }

    @PostMapping("/{id}/clear-emergency")
    public ApiResponse clearEmergency(@PathVariable String id) {
        return doctorService.clearEmergency(id);
    }

    /** Doctor-scoped toggle-active (body has activeStatus/targetScope/actionType/reason). */
    @PostMapping("/{id}/toggle-active")
    public ApiResponse toggleActiveScoped(@PathVariable String id, @RequestBody ToggleActiveRequest req) {
        return doctorService.toggleActiveScoped(id, req);
    }

    @PostMapping("/{id}/custom-slots")
    public ApiResponse addCustomSlot(@PathVariable String id, @RequestBody CustomSlotRequest req) {
        return doctorService.addCustomSlot(id, req);
    }

    @DeleteMapping("/{id}/custom-slots/{slotId}")
    public ApiResponse deleteCustomSlot(@PathVariable String id, @PathVariable String slotId) {
        return doctorService.deleteCustomSlot(id, slotId);
    }

    @GetMapping("/{id}/availability-summary")
    public ApiResponse getAvailabilitySummary(@PathVariable String id) {
        return doctorService.getAvailabilitySummary(id);
    }

    @GetMapping("/{id}/analytics")
    public ApiResponse getAnalytics(@PathVariable String id) {
        return doctorService.getAnalytics(id);
    }

    @PostMapping("/access-sessions/{id}/action")
    public ApiResponse sessionAction(@PathVariable String id, @RequestBody SessionActionRequest req) {
        return doctorService.sessionAction(id, req);
    }

    @PostMapping("/access-sessions/{id}/end")
    public ApiResponse endAccessSession(@PathVariable String id) {
        return doctorService.endAccessSession(id);
    }
}
