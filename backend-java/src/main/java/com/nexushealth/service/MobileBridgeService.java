package com.nexushealth.service;

import com.nexushealth.common.ApiException;
import com.nexushealth.common.ApiResponse;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory "Mobile Camera Remote Bridge" sessions - mirrors Node's
 * mobileBridgeSessions map (cardRoutes.ts). A doctor workstation creates a
 * bridge session, the patient's phone scans a QR code and submits the scanned
 * payload back, and the laptop polls until the scan arrives.
 */
@Service
public class MobileBridgeService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final long MAX_AGE_MS = 15L * 60L * 1000L;

    private final Map<String, Map<String, Object>> sessions = new ConcurrentHashMap<>();

    public ApiResponse create(String doctorId, String doctorName, String hospitalName) {
        String sessionHex = String.format("%08X", RANDOM.nextInt(0x10000000));
        String sessionId = "BRG-" + sessionHex;
        String pairingPin = String.valueOf(100000 + RANDOM.nextInt(900000));

        Map<String, Object> session = new LinkedHashMap<>();
        session.put("sessionId", sessionId);
        session.put("pairingPin", pairingPin);
        session.put("doctorId", doctorId != null && !doctorId.isBlank() ? doctorId : "doc_1");
        session.put("doctorName", doctorName != null && !doctorName.isBlank() ? doctorName : "Attending Physician");
        session.put("hospitalName", hospitalName != null && !hospitalName.isBlank() ? hospitalName : "Apollo Multi-Specialty Hospital");
        session.put("status", "WAITING");
        session.put("payload", null);
        session.put("createdAt", System.currentTimeMillis());

        sessions.put(sessionId, session);

        return ApiResponse.ok()
                .with("sessionId", sessionId)
                .with("pairingPin", pairingPin)
                .with("message", "Mobile Remote Camera Bridge active. Scan QR code or enter PIN on mobile device.");
    }

    public ApiResponse submit(String sessionId, String scannedCode, String scanType, Object photoData) {
        Map<String, Object> session = getValidSession(sessionId);
        if (session == null) {
            throw new ApiException(org.springframework.http.HttpStatus.NOT_FOUND,
                    "Invalid or expired bridge session.");
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("scannedCode", scannedCode != null && !scannedCode.isBlank()
                ? scannedCode : "NEXUSHEALTH_CARD_TOKEN:NXAC-a1b2c3d4e5f6");
        payload.put("scanType", scanType != null && !scanType.isBlank() ? scanType : "QR_CODE");
        payload.put("photoData", photoData);
        payload.put("scannedAt", java.time.OffsetDateTime.now().toString());

        session.put("status", "SCANNED");
        session.put("payload", payload);

        return ApiResponse.ok("Scan successfully transmitted to laptop Doctor Workstation!");
    }

    public ApiResponse poll(String sessionId) {
        Map<String, Object> session = getValidSession(sessionId);
        if (session == null) {
            return ApiResponse.ok().with("status", "EXPIRED").with("message", "Session expired.");
        }
        return ApiResponse.ok()
                .with("sessionId", sessionId)
                .with("status", session.get("status"))
                .with("payload", session.get("payload"))
                .with("pairingPin", session.get("pairingPin"));
    }

    private Map<String, Object> getValidSession(String sessionId) {
        Map<String, Object> session = sessions.get(sessionId);
        if (session == null) {
            return null;
        }
        long createdAt = ((Number) session.get("createdAt")).longValue();
        if (System.currentTimeMillis() - createdAt > MAX_AGE_MS) {
            sessions.remove(sessionId);
            return null;
        }
        return session;
    }
}
