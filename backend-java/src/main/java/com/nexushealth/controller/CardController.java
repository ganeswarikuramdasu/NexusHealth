package com.nexushealth.controller;

import com.nexushealth.common.ApiResponse;
import com.nexushealth.dto.card.CardRequests.*;
import com.nexushealth.service.CardService;
import com.nexushealth.service.MobileBridgeService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/card")
public class CardController {

    private final CardService cardService;
    private final MobileBridgeService mobileBridgeService;

    public CardController(CardService cardService, MobileBridgeService mobileBridgeService) {
        this.cardService = cardService;
        this.mobileBridgeService = mobileBridgeService;
    }

    @GetMapping("/admin/all-cards")
    public ApiResponse allCards() {
        return cardService.allCards();
    }

    @GetMapping("/my-card/{patientId}")
    public ApiResponse myCard(@PathVariable String patientId) {
        return cardService.myCard(patientId);
    }

    @PostMapping("/issue")
    public ApiResponse issue(@RequestBody IssueCardRequest req) {
        return cardService.issue(req);
    }

    @PostMapping("/toggle-status")
    public ApiResponse toggleStatus(@RequestBody ToggleCardStatusRequest req) {
        return cardService.toggleStatus(req);
    }

    @PostMapping("/report-lost")
    public ApiResponse reportLost(@RequestBody ReportLostRequest req) {
        return cardService.reportLost(req);
    }

    @PostMapping("/request-replacement")
    public ApiResponse requestReplacement(@RequestBody RequestReplacementRequest req) {
        return cardService.requestReplacement(req);
    }

    @GetMapping("/access-history/{patientId}")
    public List<Map<String, Object>> accessHistory(@PathVariable String patientId) {
        return cardService.accessHistory(patientId);
    }

    @PostMapping("/scan")
    public ApiResponse scan(@RequestBody ScanRequest req) {
        return cardService.scan(req);
    }

    @PostMapping("/assisted-consent")
    public ApiResponse assistedConsent(@RequestBody AssistedConsentRequest req) {
        return cardService.assistedConsent(req);
    }

    @PostMapping("/mobile-bridge/create")
    public ApiResponse mobileBridgeCreate(@RequestBody(required = false) MobileBridgeCreateRequest req) {
        if (req == null) req = new MobileBridgeCreateRequest();
        return mobileBridgeService.create(req.getDoctorId(), req.getDoctorName(), req.getHospitalName());
    }

    @PostMapping("/mobile-bridge/submit")
    public ApiResponse mobileBridgeSubmit(@RequestBody MobileBridgeSubmitRequest req) {
        return mobileBridgeService.submit(req.getSessionId(), req.getScannedCode(), req.getScanType(), req.getPhotoData());
    }

    @GetMapping("/mobile-bridge/poll/{sessionId}")
    public ApiResponse mobileBridgePoll(@PathVariable String sessionId) {
        return mobileBridgeService.poll(sessionId);
    }
}
