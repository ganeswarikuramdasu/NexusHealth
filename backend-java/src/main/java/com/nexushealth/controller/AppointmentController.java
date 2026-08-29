package com.nexushealth.controller;

import com.nexushealth.common.ApiResponse;
import com.nexushealth.dto.appointment.AppointmentRequests.*;
import com.nexushealth.service.AppointmentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam(required = false) String patientId,
                                           @RequestParam(required = false) String doctorId,
                                           @RequestParam(required = false) String hospitalId) {
        return appointmentService.list(patientId, doctorId, hospitalId);
    }

    @GetMapping("/available-slots")
    public ApiResponse availableSlotsQuery(@RequestParam String doctorId,
                                            @RequestParam(required = false) String date) {
        return appointmentService.availableSlots(doctorId, date);
    }

    @GetMapping("/slots/{doctorId}")
    public ApiResponse availableSlotsPath(@PathVariable String doctorId,
                                           @RequestParam(required = false) String date) {
        return appointmentService.availableSlots(doctorId, date);
    }

    @PostMapping("/book")
    public ApiResponse book(@RequestBody BookRequest req) {
        return appointmentService.book(req);
    }

    @PostMapping("/reschedule")
    public ApiResponse reschedule(@RequestBody RescheduleRequest req) {
        return appointmentService.reschedule(req);
    }

    @PostMapping("/cancel")
    public ApiResponse cancel(@RequestBody CancelRequest req) {
        return appointmentService.cancel(req);
    }

    @PostMapping("/check-in")
    public ApiResponse checkIn(@RequestBody CheckInRequest req) {
        return appointmentService.checkIn(req);
    }

    @PostMapping("/update-status")
    public ApiResponse updateStatus(@RequestBody UpdateStatusRequest req) {
        return appointmentService.updateStatus(req);
    }

    @GetMapping("/live-queue/{appointmentId}")
    public ApiResponse liveQueue(@PathVariable String appointmentId) {
        return appointmentService.liveQueue(appointmentId);
    }
}
