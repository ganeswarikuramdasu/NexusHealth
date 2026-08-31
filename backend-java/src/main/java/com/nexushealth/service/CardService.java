package com.nexushealth.service;

import com.nexushealth.common.ApiException;
import com.nexushealth.common.ApiResponse;
import com.nexushealth.dto.card.CardRequests.*;
import com.nexushealth.entity.AccessCard;
import com.nexushealth.entity.Consent;
import com.nexushealth.entity.MedicalRecord;
import com.nexushealth.entity.PatientProfile;
import com.nexushealth.entity.User;
import com.nexushealth.repository.AccessCardRepository;
import com.nexushealth.repository.CardAccessLogRepository;
import com.nexushealth.repository.ConsentRepository;
import com.nexushealth.repository.MedicalRecordRepository;
import com.nexushealth.repository.PatientProfileRepository;
import com.nexushealth.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class CardService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Set<String> TOGGLEABLE_STATUSES = Set.of("ACTIVE", "TEMPORARILY_BLOCKED");

    private final AccessCardRepository accessCardRepository;
    private final CardAccessLogRepository cardAccessLogRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final UserRepository userRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final ConsentRepository consentRepository;
    private final AuditLogService auditLogService;
    private final PasswordEncoder passwordEncoder;

    public CardService(AccessCardRepository accessCardRepository, CardAccessLogRepository cardAccessLogRepository,
                        PatientProfileRepository patientProfileRepository, UserRepository userRepository,
                        MedicalRecordRepository medicalRecordRepository, ConsentRepository consentRepository,
                        AuditLogService auditLogService, PasswordEncoder passwordEncoder) {
        this.accessCardRepository = accessCardRepository;
        this.cardAccessLogRepository = cardAccessLogRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.userRepository = userRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.consentRepository = consentRepository;
        this.auditLogService = auditLogService;
        this.passwordEncoder = passwordEncoder;
    }

    public ApiResponse allCards() {
        List<Map<String, Object>> cards = new ArrayList<>();
        for (AccessCard c : accessCardRepository.findAll()) cards.add(toPublic(c));
        return ApiResponse.ok().with("cards", cards).with("recentAccessLogs", List.of());
    }

    @Transactional
    public ApiResponse myCard(String patientIdOrHealthId) {
        var target = resolveTargetIds(patientIdOrHealthId);
        List<AccessCard> cards = accessCardRepository.findForPatient(target.userId, target.healthId);
        AccessCard card = cards.stream()
                .filter(c -> Set.of("ACTIVE", "TEMPORARILY_BLOCKED", "REPLACEMENT_REQUESTED").contains(c.getStatus()))
                .findFirst()
                .or(() -> cards.stream().findFirst())
                .orElse(null);

        if (card == null) {
            card = createNewCard(target.userId, target.healthId, target.patientName, "N/A");
            accessCardRepository.save(card);
        }

        ApiResponse response = ApiResponse.ok();
        response.put("hasCard", true);
        response.put("status", card.getStatus());
        Map<String, Object> patientInfo = new LinkedHashMap<>();
        patientInfo.put("userId", target.userId);
        patientInfo.put("globalHealthId", target.healthId);
        patientInfo.put("patientName", target.patientName);
        response.put("patientInfo", patientInfo);
        response.put("card", toPublic(card));
        return response;
    }

    @Transactional
    public ApiResponse issue(IssueCardRequest req) {
        var target = resolveTargetIds(req.getPatientId());
        List<AccessCard> existing = accessCardRepository.findForPatient(target.userId, target.healthId);
        AccessCard activeCard = existing.stream().filter(c -> "ACTIVE".equals(c.getStatus())).findFirst().orElse(null);
        if (activeCard != null) {
            return ApiResponse.ok("Active card already issued.").with("card", toPublic(activeCard));
        }

        AccessCard newCard = createNewCard(target.userId, target.healthId, target.patientName,
                req.getPinCode() != null ? req.getPinCode() : "1234");
        accessCardRepository.save(newCard);

        auditLogService.log(target.patientName, "PATIENT", "ACCESS_CARD_ISSUED", target.healthId,
                "Secure Patient Access Card issued with Identifier " + newCard.getCardIdentifier());

        return ApiResponse.ok("NexusHealth Patient Access Card issued successfully.").with("card", toPublic(newCard));
    }

    @Transactional
    public ApiResponse toggleStatus(ToggleCardStatusRequest req) {
        AccessCard card = accessCardRepository.findById(req.getCardId())
                .orElseThrow(() -> ApiException.notFound("Access Card not found."));

        if (Set.of("LOST", "REVOKED").contains(card.getStatus())) {
            throw ApiException.badRequest("Cannot toggle status of a " + card.getStatus() + " card. Request a replacement card.");
        }
        if (!TOGGLEABLE_STATUSES.contains(req.getTargetStatus())) {
            throw ApiException.badRequest("Invalid target card status.");
        }
        card.setStatus(req.getTargetStatus());
        accessCardRepository.save(card);

        auditLogService.log(card.getPatientName(), "PATIENT", "CARD_STATUS_CHANGE_" + req.getTargetStatus(), card.getPatientHealthId(),
                "Card " + card.getCardIdentifier() + " status updated to " + req.getTargetStatus());

        return ApiResponse.ok("Card status changed to " + req.getTargetStatus() + ".").with("card", toPublic(card));
    }

    @Transactional
    public ApiResponse reportLost(ReportLostRequest req) {
        AccessCard card = accessCardRepository.findByIdOrPatientId(req.getCardId(), req.getPatientId())
                .orElseThrow(() -> ApiException.notFound("Access Card record not found."));

        card.setStatus("LOST");
        card.setLostAt(LocalDateTime.now());
        card.setRevokedAt(LocalDateTime.now());
        accessCardRepository.save(card);

        auditLogService.log(card.getPatientName(), "PATIENT", "CARD_REPORTED_LOST", card.getPatientHealthId(),
                "Access Card " + card.getCardIdentifier() + " reported LOST and token revoked immediately.");

        AccessCard replacementCard = null;
        if (Boolean.TRUE.equals(req.getAutoReplace())) {
            replacementCard = createNewCard(card.getPatientId(), card.getPatientHealthId(), card.getPatientName(),
                    card.getPinCode() != null ? card.getPinCode() : "1234");
            accessCardRepository.save(replacementCard);
            card.setReplacedBy(replacementCard.getId());
            accessCardRepository.save(card);

            auditLogService.log(card.getPatientName(), "PATIENT", "REPLACEMENT_CARD_ISSUED", card.getPatientHealthId(),
                    "Replacement Card " + replacementCard.getCardIdentifier() + " generated with new secure token.");
        }

        return ApiResponse.ok("Card reported LOST. Old token revoked immediately to protect medical history.")
                .with("card", toPublic(card))
                .with("replacementCard", replacementCard != null ? toPublic(replacementCard) : null);
    }

    @Transactional
    public ApiResponse requestReplacement(RequestReplacementRequest req) {
        AccessCard oldCard = accessCardRepository.findByIdOrPatientId(req.getCardId(), req.getPatientId())
                .orElseThrow(() -> ApiException.notFound("Card not found."));

        oldCard.setStatus("REVOKED");
        oldCard.setRevokedAt(LocalDateTime.now());

        AccessCard newCard = createNewCard(oldCard.getPatientId(), oldCard.getPatientHealthId(), oldCard.getPatientName(),
                req.getPinCode() != null ? req.getPinCode() : (oldCard.getPinCode() != null ? oldCard.getPinCode() : "1234"));
        accessCardRepository.save(newCard);
        oldCard.setReplacedBy(newCard.getId());
        accessCardRepository.save(oldCard);

        auditLogService.log(oldCard.getPatientName(), "PATIENT", "REPLACEMENT_CARD_REQUEST", oldCard.getPatientHealthId(),
                "Issued replacement card " + newCard.getCardIdentifier() + ". Old card token revoked.");

        return ApiResponse.ok("Replacement card issued with new secure token.")
                .with("newCard", toPublic(newCard)).with("oldCard", toPublic(oldCard));
    }

    public List<Map<String, Object>> accessHistory(String patientIdOrHealthId) {
        var target = resolveTargetIds(patientIdOrHealthId);
        List<Map<String, Object>> out = new ArrayList<>();
        for (var log : cardAccessLogRepository.findForPatient(target.userId, target.healthId)) {
            out.add(toPublicLog(log));
        }
        return out;
    }

    @Transactional
    public ApiResponse scan(ScanRequest req) {
        if (req.getScannedCode() == null || req.getScannedCode().isBlank()) {
            throw ApiException.badRequest("Scanned QR code content is required.");
        }
        String token = req.getScannedCode().trim();
        if (token.contains("NEXUSHEALTH_CARD_TOKEN:")) {
            token = token.replace("NEXUSHEALTH_CARD_TOKEN:", "").trim();
        } else if (token.contains("NEXUSHEALTH:")) {
            String[] parts = token.split(":");
            if (parts.length > 1) {
                String healthId = parts[1];
                AccessCard byHealthId = accessCardRepository.findForPatient(healthId, healthId).stream()
                        .filter(c -> "ACTIVE".equals(c.getStatus())).findFirst().orElse(null);
                if (byHealthId != null) token = byHealthId.getSecureToken();
            }
        }

        AccessCard card = accessCardRepository.findByAnyIdentifier(token).orElse(null);
        if (card == null) {
            ApiResponse resp = ApiResponse.fail("Unrecognized or Invalid NexusHealth Access Card Token. Ensure valid NexusHealth card.");
            resp.put("code", "CARD_NOT_FOUND");
            return resp;
        }

        String actorId = req.getActorId() != null ? req.getActorId() : "doc_1";
        String actorName = req.getActorName() != null ? req.getActorName() : "Attending Physician";
        String actorRole = req.getActorRole() != null ? req.getActorRole() : "DOCTOR";
        String hospitalId = req.getHospitalId() != null ? req.getHospitalId() : "hosp_1";
        String hospitalName = req.getHospitalName() != null ? req.getHospitalName() : "Healthcare Facility";

        if (!"ACTIVE".equals(card.getStatus())) {
            cardAccessLogRepository.save(com.nexushealth.entity.CardAccessLog.builder()
                    .id("calog_" + System.currentTimeMillis())
                    .cardId(card.getId()).patientId(card.getPatientId()).patientHealthId(card.getPatientHealthId())
                    .patientName(card.getPatientName()).actorId(actorId).actorName(actorName).actorRole(actorRole)
                    .hospitalId(hospitalId).hospitalName(hospitalName).accessType("SCAN_ATTEMPT")
                    .authorizationStatus("LOST".equals(card.getStatus()) ? "DENIED_CARD_LOST" : "DENIED_CARD_BLOCKED")
                    .recordsAccessed(List.of())
                    .reason("Scan rejected. Access Card status is " + card.getStatus())
                    .ipAddress("127.0.0.1").build());

            auditLogService.log(actorName, actorRole, "CARD_SCAN_DENIED", card.getPatientHealthId(),
                    "Rejected card scan for " + card.getPatientName() + ". Card status: " + card.getStatus());

            ApiResponse resp = ApiResponse.fail("Card is " + card.getStatus().replace("_", " ") +
                    ". Medical records access blocked for patient security.");
            resp.put("code", "CARD_" + card.getStatus());
            resp.put("status", card.getStatus());
            return resp;
        }

        PatientProfile profile = patientProfileRepository.findById(card.getPatientId()).orElse(null);
        User user = userRepository.findById(card.getPatientId()).orElse(null);
        Map<String, Object> patientSummary = buildPatientSummary(card, profile, user);

        List<Consent> activeConsents = consentRepository.findActiveForPatient(card.getPatientId());
        boolean hasActiveConsent = activeConsents.stream().anyMatch(c ->
                actorId.equals(c.getDoctorId()) || "GRANTED".equals(c.getStatus()));
        boolean isHospitalAdmin = "HOSPITAL_ADMIN".equals(actorRole);
        boolean isAuthorized = hasActiveConsent || isHospitalAdmin;

        if (!isAuthorized) {
            ApiResponse resp = ApiResponse.ok();
            resp.put("authorizationStatus", "REQUIRES_PATIENT_CONSENT");
            resp.put("card", toPublic(card));
            Map<String, Object> basic = new LinkedHashMap<>();
            basic.put("name", patientSummary.get("name"));
            basic.put("globalHealthId", patientSummary.get("globalHealthId"));
            basic.put("bloodGroup", patientSummary.get("bloodGroup"));
            basic.put("gender", patientSummary.get("gender"));
            basic.put("emergencyContactPhone", patientSummary.get("emergencyContactPhone"));
            resp.put("patientBasic", basic);
            resp.put("message", "Patient card scanned & verified. Please obtain patient assisted authorization to view full medical history.");
            return resp;
        }

        List<MedicalRecord> records = medicalRecordRepository.findForPatient(card.getPatientId());
        cardAccessLogRepository.save(com.nexushealth.entity.CardAccessLog.builder()
                .id("calog_" + System.currentTimeMillis())
                .cardId(card.getId()).patientId(card.getPatientId()).patientHealthId(card.getPatientHealthId())
                .patientName(String.valueOf(patientSummary.get("name"))).actorId(actorId).actorName(actorName)
                .actorRole(actorRole).hospitalId(hospitalId).hospitalName(hospitalName)
                .accessType("OUTPATIENT_CONSULTATION").authorizationStatus("AUTHORIZED")
                .recordsAccessed(List.of("Medical History", "Lab Reports", "Prescriptions", "Vitals"))
                .reason("Authorized Doctor Scan via NexusHealth Access Card").ipAddress("127.0.0.1").build());

        auditLogService.log(actorName, actorRole, "CARD_SCAN_ACCESS_GRANTED", card.getPatientHealthId(),
                "Accessed EHR ledger for " + patientSummary.get("name") + " via Patient Access Card.");

        ApiResponse resp = ApiResponse.ok();
        resp.put("authorizationStatus", "AUTHORIZED");
        resp.put("card", toPublic(card));
        resp.put("patient", patientSummary);
        List<Map<String, Object>> recordMaps = new ArrayList<>();
        for (MedicalRecord r : records) recordMaps.add(recordSummary(r));
        resp.put("records", recordMaps);
        resp.put("message", "Patient Card verified. Authorized medical summary & records loaded successfully.");
        return resp;
    }

    @Transactional
    public ApiResponse assistedConsent(AssistedConsentRequest req) {
        AccessCard card = req.getCardId() != null
                ? accessCardRepository.findById(req.getCardId()).orElse(null)
                : null;
        if (card == null && req.getPatientHealthId() != null) {
            card = accessCardRepository.findForPatient(req.getPatientHealthId(), req.getPatientHealthId())
                    .stream().findFirst().orElse(null);
        }
        PatientProfile profile = card != null ? patientProfileRepository.findById(card.getPatientId()).orElse(null)
                : (req.getPatientHealthId() != null ? patientProfileRepository.findByPatientHealthId(req.getPatientHealthId()).orElse(null) : null);

        if (card == null && profile == null) {
            throw ApiException.notFound("Patient card or profile not found.");
        }

        String targetHealthId = req.getPatientHealthId() != null ? req.getPatientHealthId()
                : (card != null ? card.getPatientHealthId() : profile.getPatientHealthId());
        String targetUserId = card != null ? card.getPatientId() : (profile != null ? profile.getUserId() : "");
        User user = userRepository.findById(targetUserId).orElse(null);
        String patientName = user != null ? user.getName() : (card != null ? card.getPatientName() : "Patient Citizen");

        Consent consent = Consent.builder()
                .id("c_assisted_" + System.currentTimeMillis())
                .patientId(targetUserId)
                .doctorId(req.getDoctorId() != null ? req.getDoctorId() : "doc_1")
                .consentType("TEMPORARY")
                .scope(List.of("ALL_RECORDS"))
                .expiresAt(LocalDate.now().plusDays(1))
                .notes(Boolean.TRUE.equals(req.getVerifiedByPin()) ? "PATIENT_PIN" : "PHYSICAL_ASSISTED_CONFIRMATION")
                .status("GRANTED")
                .build();
        consentRepository.save(consent);

        cardAccessLogRepository.save(com.nexushealth.entity.CardAccessLog.builder()
                .id("calog_" + System.currentTimeMillis())
                .cardId(card != null ? card.getId() : "card_1001").patientId(targetUserId).patientHealthId(targetHealthId)
                .patientName(patientName).actorId(consent.getDoctorId())
                .actorName(req.getDoctorName() != null ? req.getDoctorName() : "Attending Physician").actorRole("DOCTOR")
                .hospitalId("hosp_1").hospitalName(req.getHospitalName() != null ? req.getHospitalName() : "General Care Hospital")
                .accessType("ASSISTED_PATIENT_CONSENT").authorizationStatus("AUTHORIZED")
                .recordsAccessed(List.of("Medical History", "Prescriptions", "Lab Reports", "Vitals"))
                .reason("Assisted Patient Authorization Granted (" + (Boolean.TRUE.equals(req.getVerifiedByPin()) ? "PIN Verified" : "Physical Confirmation") + ")")
                .ipAddress("127.0.0.1").build());

        auditLogService.log(patientName, "PATIENT", "ASSISTED_CONSENT_GRANTED", targetHealthId,
                "Granted assisted consultation access to " + req.getDoctorName());

        List<MedicalRecord> records = medicalRecordRepository.findForPatient(targetUserId);
        ApiResponse resp = ApiResponse.ok();
        resp.put("authorizationStatus", "AUTHORIZED");
        resp.put("consent", consent);
        resp.put("patient", buildPatientSummary(null, profile, user, targetUserId, targetHealthId, patientName));
        List<Map<String, Object>> recordMaps = new ArrayList<>();
        for (MedicalRecord r : records) recordMaps.add(recordSummary(r));
        resp.put("records", recordMaps);
        resp.put("message", "Assisted patient authorization verified. EHR record ledger unlocked.");
        return resp;
    }

    // ---- helpers ----

    private record TargetIds(String userId, String healthId, String patientName) {
    }

    private TargetIds resolveTargetIds(String identifier) {
        PatientProfile profile = identifier != null ? patientProfileRepository.findById(identifier).orElse(null) : null;
        if (profile == null && identifier != null) profile = patientProfileRepository.findByPatientHealthId(identifier).orElse(null);
        String userId = profile != null ? profile.getUserId() : identifier;
        String healthId = profile != null ? profile.getPatientHealthId() : identifier;
        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        String patientName = user != null ? user.getName() : "Patient Citizen";
        return new TargetIds(userId, healthId, patientName);
    }

    private AccessCard createNewCard(String userId, String healthId, String patientName, String pinCode) {
        int cardSeq = 1000 + RANDOM.nextInt(8999);
        String suffix = healthId != null ? healthId.replace("NH-IND-2026-", "") : "0000";
        String cardIdentifier = "NX-CARD-" + suffix + "-" + cardSeq;
        String secureToken = "NXAC-" + randomHex(24);
        return AccessCard.builder()
                .id("card_" + System.currentTimeMillis())
                .patientId(userId)
                .patientHealthId(healthId)
                .patientName(patientName)
                .cardIdentifier(cardIdentifier)
                .secureToken(secureToken)
                .secureTokenHash(passwordEncoder.encode(secureToken))
                .status("ACTIVE")
                .pinCode(pinCode)
                .build();
    }

    private Map<String, Object> buildPatientSummary(AccessCard card, PatientProfile profile, User user) {
        return buildPatientSummary(card, profile, user,
                card != null ? card.getPatientId() : null,
                card != null ? card.getPatientHealthId() : null,
                user != null ? user.getName() : (card != null ? card.getPatientName() : "Patient Citizen"));
    }

    private Map<String, Object> buildPatientSummary(AccessCard card, PatientProfile profile, User user,
                                                      String userId, String healthId, String name) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("userId", userId);
        out.put("globalHealthId", healthId);
        out.put("name", name);
        out.put("dob", user != null ? user.getDateOfBirth() : null);
        out.put("gender", user != null ? user.getGender() : "Female");
        out.put("bloodGroup", profile != null ? profile.getBloodGroup() : "B+");
        out.put("heightCm", profile != null ? profile.getHeightCm() : 165);
        out.put("weightKg", profile != null ? profile.getWeightKg() : 58);
        out.put("allergies", List.of());
        out.put("chronicConditions", List.of());
        out.put("emergencyContactName", "Emergency Relative");
        out.put("emergencyContactPhone", "+91 98765 43210");
        out.put("insuranceProvider", "Universal Health Guard");
        return out;
    }

    private Map<String, Object> recordSummary(MedicalRecord r) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", r.getId());
        out.put("recordType", r.getRecordType());
        out.put("title", r.getTitle());
        out.put("date", r.getRecordDate().toString());
        out.put("diagnosis", r.getDiagnosis());
        return out;
    }

    private Map<String, Object> toPublic(AccessCard c) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", c.getId());
        out.put("patientId", c.getPatientId());
        out.put("patientHealthId", c.getPatientHealthId());
        out.put("patientName", c.getPatientName());
        out.put("cardIdentifier", c.getCardIdentifier());
        out.put("secureToken", c.getSecureToken());
        out.put("status", c.getStatus());
        out.put("issuedAt", c.getIssuedAt() != null ? c.getIssuedAt().toString() : null);
        out.put("activatedAt", c.getActivatedAt() != null ? c.getActivatedAt().toString() : null);
        out.put("lostAt", c.getLostAt() != null ? c.getLostAt().toString() : null);
        out.put("revokedAt", c.getRevokedAt() != null ? c.getRevokedAt().toString() : null);
        out.put("replacedBy", c.getReplacedBy());
        out.put("pinCode", c.getPinCode());
        out.put("qrCodeData", c.getQrCodeData() != null ? c.getQrCodeData() : "NEXUSHEALTH_CARD_TOKEN:" + c.getSecureToken());
        return out;
    }

    private Map<String, Object> toPublicLog(com.nexushealth.entity.CardAccessLog l) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", l.getId());
        out.put("cardId", l.getCardId());
        out.put("patientId", l.getPatientId());
        out.put("patientHealthId", l.getPatientHealthId());
        out.put("patientName", l.getPatientName());
        out.put("actorId", l.getActorId());
        out.put("actorName", l.getActorName());
        out.put("actorRole", l.getActorRole());
        out.put("hospitalId", l.getHospitalId());
        out.put("hospitalName", l.getHospitalName());
        out.put("timestamp", l.getTimestamp().toString());
        out.put("accessType", l.getAccessType());
        out.put("authorizationStatus", l.getAuthorizationStatus());
        out.put("recordsAccessed", l.getRecordsAccessed());
        out.put("reason", l.getReason());
        out.put("ipAddress", l.getIpAddress());
        return out;
    }

    private static String randomHex(int numChars) {
        StringBuilder sb = new StringBuilder();
        String chars = "0123456789abcdef";
        for (int i = 0; i < numChars; i++) sb.append(chars.charAt(RANDOM.nextInt(chars.length())));
        return sb.toString();
    }
}
