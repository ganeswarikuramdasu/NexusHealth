package com.nexushealth.controller;

import com.nexushealth.common.ApiResponse;
import com.nexushealth.dto.complaint.ComplaintRequests.RaiseComplaintRequest;
import com.nexushealth.dto.complaint.ComplaintRequests.ResolveComplaintRequest;
import com.nexushealth.service.ComplaintService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    @PostMapping("/raise")
    public ApiResponse raise(@RequestBody RaiseComplaintRequest req) {
        return complaintService.raise(req);
    }

    @GetMapping("/mine")
    public List<Map<String, Object>> mine(@RequestParam String role,
                                          @RequestParam(required = false) String userId) {
        return complaintService.forRole(role, userId);
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return complaintService.stats();
    }

    @PostMapping("/{complaintId}/resolve")
    public ApiResponse resolve(@PathVariable String complaintId, @RequestBody ResolveComplaintRequest req) {
        return complaintService.resolve(complaintId, req);
    }
}