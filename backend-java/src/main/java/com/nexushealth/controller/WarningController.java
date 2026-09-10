package com.nexushealth.controller;

import com.nexushealth.common.ApiResponse;
import com.nexushealth.dto.warning.WarningRequests.CreateWarningRequest;
import com.nexushealth.service.WarningService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/warnings")
public class WarningController {

    private final WarningService warningService;

    public WarningController(WarningService warningService) {
        this.warningService = warningService;
    }

    @GetMapping
    public List<Map<String, Object>> visible(@RequestParam(required = false) String role,
                                             @RequestParam(required = false) String module) {
        return warningService.visible(role, module);
    }

    @GetMapping("/all")
    public List<Map<String, Object>> all() {
        return warningService.all();
    }

    @PostMapping
    public ApiResponse create(@RequestBody CreateWarningRequest req) {
        return warningService.create(req);
    }

    @PostMapping("/{warningId}/deactivate")
    public ApiResponse deactivate(@PathVariable String warningId) {
        return warningService.deactivate(warningId);
    }
}