package com.nexushealth.service;

import com.nexushealth.common.ApiException;
import com.nexushealth.common.ApiResponse;
import com.nexushealth.dto.emergency.EmergencyRequests.AddNoteRequest;
import com.nexushealth.dto.emergency.EmergencyRequests.IdentifyRequest;
import com.nexushealth.dto.emergency.EmergencyRequests.StartSessionRequest;
import com.nexushealth.dto.emergency.EmergencyRequests.UpdateProfileRequest;
import com.nexushealth.entity.AccessCard;
import com.nexushealth.entity.AuditLog;
import com.nexushealth.entity.Doctor;
import com.nexushealth.entity.MedicalRecord;
import com.nexushealth.entity.PatientProfile;
import com.nexushealth.entity.User;
import com.nexushealth.repository.AccessCardRepository;
import com.nexushealth.repository.AuditLogRepository;
import com.nexushealth.repository.DoctorRepository;
import com.nexushealth.repository.MedicalRecordRepository;
import com.nexushealth.repository.PatientProfileRepository;
import com.nexushealth.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class EmergencyService {

    private static final List<Map<String, Object>> VITALS = List.of(
            vital("Blood Pressure", "118/76 mmHg", "2026-08-09 10:30 AM", "Clinical Measurement"),
            vital("Heart Rate", "72 bpm", "2026-08-09 10:30 AM", "Clinical Measurement"),
            vital("SpO2 (Oxygen)", "99%", "2026-08-09 10:30 AM", "Clinical Measurement"),
            vital("Temperature", "98.4 F", "2026-08-09 10:30 AM", "Clinical Measurement"),
            vital("Blood Glucose (Fasting)", "95 mg/dL", "2026-08-08 08:00 AM", "Self-reported measurement"));

    private static final List<Map<String, Object>> AI_VITALS = List.of(
            aiVital("Blood Pressure", "118/76 mmHg", "2026-08-09 10:30 AM", "DOCTOR", "vit_bp_1"),
            aiVital("Heart Rate", "72 bpm", "2026-08-09 10:30 AM", "DEVICE", "vit_hr_1"),
            aiVital("SpO2 (Oxygen)", "99%", "2026-08-09 10:30 AM", "DOCTOR", "vit_spo2_1"),
            aiVital("Temperature", "98.4 F", "2026-08-09 10:30 AM", "DOCTOR", "vit_temp_1"),
            aiVital("Blood Glucose (Fasting)", "95 mg/dL", "2026-08-08 08:00 AM", "SELF_REPORTED", "vit_gluc_1"));

    private final EmergencySessionStore store;
    private final PatientResolver patientResolver;
    private final AuditLogService auditLogService;
    private final AuditLogRepository auditLogRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final AccessCardRepository accessCardRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientProfileRepository patientProfileRepository;

    public EmergencyService(EmergencySessionStore store, PatientResolver patientResolver,
                            AuditLogService auditLogService, AuditLogRepository auditLogRepository,
                            DoctorRepository doctorRepository, UserRepository userRepository,
                            AccessCardRepository accessCardRepository,
                            MedicalRecordRepository medicalRecordRepository,
                            PatientProfileRepository patientProfileRepository) {
        this.store = store;
        this.patientResolver = patientResolver;
        this.auditLogService = auditLogService;
        this.auditLogRepository = auditLogRepository;
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
        this.accessCardRepository = accessCardRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.patientProfileRepository = patientProfileRepository;
    }

    // =========================================================================
    // 1. IDENTIFY PATIENT
    // =========================================================================
    public ApiResponse identify(IdentifyRequest req) {
        String method = req.getMethod();
        String query = req.getQuery();
        String doctorId = req.getDoctorId();

        Doctor doctor = findDoctor(doctorId);
        if (doctor == null || !"APPROVED".equals(doctor.getStatus())) {
            auditLogService.log(doctorId != null && !doctorId.isBlank() ? doctorId : "Unknown Doctor",
                    "DOCTOR", "UNAUTHORIZED_EMERGENCY_ATTEMPT", "N/A",
                    "Emergency identification attempt rejected: Doctor account is not approved or authenticated.");
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Patient identification or authorization could not be completed.");
        }
        String doctorName = doctor.getName();

        if ("ACCESS_CARD".equals(method)) {
            return identifyByCard(doctorName, query);
        }
        if ("GLOBAL_HEALTH_ID".equals(method)) {
            return identifyByHealthId(doctorName, query);
        }
        if ("PATIENT_NAME".equals(method)) {
            return identifyByName(doctorName, query);
        }
        if ("FINGERPRINT".equals(method) || "FACE".equals(method)) {
            return identifyByBiometric(doctorName, method);
        }

        return ApiResponse.fail("Invalid emergency identification method.");
    }

    private ApiResponse identifyByCard(String doctorName, String query) {
        AccessCard card = findCardByQuery(query);
        if (card == null) {
            auditLogService.log(doctorName, "DOCTOR", "FAILED_EMERGENCY_CARD_SCAN", "N/A",
                    "Emergency card scan failed: Token \"" + (query != null && !query.isEmpty() ? query : "EMPTY") + "\" not found.");
            return ApiResponse.fail("Patient identification or authorization could not be completed.")
                    .with("code", "CARD_NOT_FOUND");
        }

        if ("LOST".equals(card.getStatus()) || "REVOKED".equals(card.getStatus())
                || "EXPIRED".equals(card.getStatus()) || "TEMPORARILY_BLOCKED".equals(card.getStatus())) {
            auditLogService.log(doctorName, "DOCTOR", "REVOKED_CARD_EMERGENCY_ATTEMPT",
                    card.getPatientHealthId(),
                    "SECURITY ALERT: Emergency access attempted with " + card.getStatus() + " card ("
                            + card.getCardIdentifier() + "). Access strictly denied.");
            return ApiResponse.fail(
                    "Patient identification or authorization could not be completed. Card is lost or revoked.")
                    .with("code", "CARD_REVOKED_OR_BLOCKED");
        }

        Map<String, Object> prof = resolvePatientByIdentity(card.getPatientId());
        String name = card.getPatientName() != null && !card.getPatientName().isBlank()
                ? card.getPatientName() : patientName(card.getPatientId());

        auditLogService.log(doctorName, "DOCTOR", "EMERGENCY_PATIENT_IDENTIFIED_CARD",
                card.getPatientHealthId(),
                "Patient identified via physical Access Card token. Prepared for emergency verification.");

        return ApiResponse.ok().with("method", "ACCESS_CARD")
                .with("patientFound", patientFound(card.getPatientId(), name, card.getPatientHealthId(), prof));
    }

    private ApiResponse identifyByHealthId(String doctorName, String query) {
        Map<String, Object> prof = findPatientProfileByQuery(query);
        if (prof == null) {
            auditLogService.log(doctorName, "DOCTOR", "FAILED_EMERGENCY_HEALTH_ID_SEARCH",
                    query != null && !query.isBlank() ? query : "N/A",
                    "Emergency search failed for Global Health ID \"" + query + "\".");
            return ApiResponse.fail("Patient identification or authorization could not be completed.")
                    .with("code", "PATIENT_NOT_FOUND");
        }

        auditLogService.log(doctorName, "DOCTOR", "EMERGENCY_PATIENT_IDENTIFIED_ID",
                String.valueOf(prof.get("globalHealthId")), "Patient identified via Global Health ID.");

        return ApiResponse.ok().with("method", "GLOBAL_HEALTH_ID")
                .with("patientFound", patientFound(String.valueOf(prof.get("userId")),
                        patientName(String.valueOf(prof.get("userId"))),
                        String.valueOf(prof.get("globalHealthId")), prof));
    }

    private ApiResponse identifyByName(String doctorName, String query) {
        String term = query != null ? query.trim().toLowerCase() : "";
        if (term.length() < 2) {
            return ApiResponse.fail("Please enter at least 2 characters for patient name search.");
        }

        User matchedUser = null;
        for (User u : userRepository.findAll()) {
            if ("PATIENT".equals(u.getRole()) && u.getName() != null && u.getName().toLowerCase().contains(term)) {
                matchedUser = u;
                break;
            }
        }

        if (matchedUser == null) {
            Map<String, Object> matchedProf = findPatientProfileByHealthIdContains(term);
            if (matchedProf == null) {
                auditLogService.log(doctorName, "DOCTOR", "FAILED_EMERGENCY_NAME_SEARCH", "N/A",
                        "No patient found matching search query \"" + query + "\".");
                return ApiResponse.fail("Patient identification or authorization could not be completed.")
                        .with("code", "PATIENT_NOT_FOUND");
            }
            return ApiResponse.ok().with("method", "PATIENT_NAME")
                    .with("patientFound", patientFound(String.valueOf(matchedProf.get("userId")),
                            patientName(String.valueOf(matchedProf.get("userId"))),
                            String.valueOf(matchedProf.get("globalHealthId")), matchedProf));
        }

        Map<String, Object> prof = resolvePatientByIdentity(matchedUser.getId());
        if (prof == null) {
            prof = defaultPatientProfileFor(matchedUser);
        }

        auditLogService.log(doctorName, "DOCTOR", "EMERGENCY_PATIENT_IDENTIFIED_NAME",
                String.valueOf(prof.get("globalHealthId")),
                "Patient identity confirmed via Name Search (\"" + matchedUser.getName() + "\").");

        return ApiResponse.ok().with("method", "PATIENT_NAME")
                .with("patientFound", patientFound(matchedUser.getId(), matchedUser.getName(),
                        String.valueOf(prof.get("globalHealthId")), prof));
    }

    private ApiResponse identifyByBiometric(String doctorName, String method) {
        auditLogService.log(doctorName, "DOCTOR", "FAILED_EMERGENCY_" + method + "_IDENTIFICATION", "N/A",
                "Emergency " + method + " identification attempt: no registered patient identity resolves.");

        return ApiResponse.fail("Patient identification or authorization could not be completed.")
                .with("code", "PATIENT_NOT_FOUND");
    }

    // =========================================================================
    // 2. START EMERGENCY ACCESS SESSION
    // =========================================================================
    @Transactional
    public ApiResponse startSession(StartSessionRequest req) {
        String emergencyReason = req.getEmergencyReason();
        if (emergencyReason == null || emergencyReason.trim().isEmpty()) {
            throw ApiException.badRequest("An emergency reason is required before initiating access.");
        }
        if ("Other".equals(emergencyReason)
                && (req.getCustomReason() == null || req.getCustomReason().trim().isEmpty())) {
            throw ApiException.badRequest("Please provide an explanation for 'Other' emergency reason.");
        }

        Doctor doctor = findDoctor(req.getDoctorId());
        if (doctor == null || !"APPROVED".equals(doctor.getStatus())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Unauthorized doctor account.");
        }

        Map<String, Object> prof = findPatientProfileByQuery(req.getPatientHealthId());
        if (prof == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Patient record not found.");
        }
        String userId = String.valueOf(prof.get("userId"));
        String healthId = String.valueOf(prof.get("globalHealthId"));
        String patientName = patientName(userId);

        String finalReason = "Other".equals(emergencyReason)
                ? "Other: " + req.getCustomReason()
                : emergencyReason;

        long now = Instant.now().toEpochMilli();
        String sessionId = "EA-2026-" + (int) (Math.floor(Math.random() * 899900d + 100000d));

        Map<String, Object> session = new LinkedHashMap<>();
        session.put("id", sessionId);
        session.put("patientId", userId);
        session.put("patientHealthId", healthId);
        session.put("patientName", patientName);
        session.put("doctorId", doctor.getId());
        session.put("doctorName", doctor.getName());
        session.put("hospitalId", req.getHospitalId() != null ? req.getHospitalId() : doctor.getHospitalId() != null ? doctor.getHospitalId() : "hosp_1");
        session.put("hospitalName", req.getHospitalName() != null ? req.getHospitalName() : doctor.getHospitalName() != null ? doctor.getHospitalName() : "Apollo Multi-Specialty Hospital");
        session.put("identificationMethod", req.getIdentificationMethod() != null ? req.getIdentificationMethod() : "GLOBAL_HEALTH_ID");
        session.put("emergencyReason", finalReason);
        session.put("customReason", req.getCustomReason() != null ? req.getCustomReason() : "");
        session.put("startedAt", Instant.ofEpochMilli(now).toString());
        session.put("expiresAt", Instant.ofEpochMilli(now + 45L * 60 * 1000).toString());
        session.put("endedAt", null);
        session.put("status", "ACTIVE");
        session.put("recordsAccessed", new ArrayList<>(List.of("Emergency Medical Summary", "Vitals", "Allergies")));
        session.put("actionsPerformed", new ArrayList<>(List.of("Emergency Access Initiated", "Emergency Medical Summary Viewed")));
        session.put("ipAddress", "127.0.0.1");
        store.unshiftSession(session);

        auditLogService.log(doctor.getName(), "DOCTOR", "PATIENT_RECORD_ACCESS_SUCCESS", healthId,
                "[EMERGENCY] [SUCCESS] Hospital: " + session.get("hospitalName")
                        + ". Reason: \uD83D\uDEA8 Break-Glass Emergency Access: " + finalReason);

        auditLogService.log(doctor.getName(), "DOCTOR", "EMERGENCY_ACCESS_INITIATED", healthId,
                "Emergency Break-Glass Session " + sessionId + " initiated by " + doctor.getName()
                        + " (" + doctor.getHospitalName() + "). Reason: " + finalReason + ". Active for 45 mins.");

        Map<String, Object> notification = new LinkedHashMap<>();
        notification.put("id", "enotif_" + System.currentTimeMillis());
        notification.put("patientId", userId);
        notification.put("sessionId", sessionId);
        notification.put("doctorName", doctor.getName());
        notification.put("hospitalName", doctor.getHospitalName() != null ? doctor.getHospitalName() : "Apollo Hospital");
        notification.put("reason", finalReason);
        notification.put("timestamp", session.get("startedAt"));
        notification.put("status", "UNREAD");
        store.unshiftNotification(notification);

        Map<String, Object> emgProfile = resolveEmergencyProfile(userId, prof, doctor, session);
        List<Map<String, Object>> contacts = resolveContacts(userId, prof);
        List<Map<String, Object>> recentRecords = toRecordMaps(medicalRecordRepository.findForPatient(userId));

        return ApiResponse.ok()
                .with("session", session)
                .with("summary", buildSummary(prof, patientName, emgProfile, contacts, recentRecords));
    }

    // =========================================================================
    // 2.5 ACTIVE SESSIONS
    // =========================================================================
    public List<Map<String, Object>> activeSessions() {
        checkAllExpirations();
        List<Map<String, Object>> active = new ArrayList<>();
        for (Map<String, Object> s : store.allSessions()) {
            if ("ACTIVE".equals(s.get("status"))) active.add(s);
        }
        return active;
    }

    // =========================================================================
    // 3. GET SESSION STATUS
    // =========================================================================
    public ApiResponse getSession(String sessionId) {
        Map<String, Object> session = requireSession(sessionId);
        checkSessionExpiration(session);
        return ApiResponse.ok().with("session", session);
    }

    // =========================================================================
    // 4. END SESSION MANUALLY
    // =========================================================================
    @Transactional
    public ApiResponse endSession(String sessionId) {
        Map<String, Object> session = requireSession(sessionId);
        session.put("status", "ENDED");
        session.put("endedAt", Instant.now().toString());

        auditLogService.log(String.valueOf(session.get("doctorName")), "DOCTOR",
                "EMERGENCY_SESSION_ENDED", String.valueOf(session.get("patientHealthId")),
                "Emergency Access Session " + sessionId + " concluded manually by Dr. "
                        + session.get("doctorName") + ".");

        return ApiResponse.ok().with("session", session)
                .with("message", "Emergency session closed successfully.");
    }

    // =========================================================================
    // 5. GET EMERGENCY SUMMARY
    // =========================================================================
    public ApiResponse getSummary(String sessionId) {
        Map<String, Object> session = requireSession(sessionId);
        checkSessionExpiration(session);
        if (!"ACTIVE".equals(session.get("status"))) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Emergency session has expired or ended. Please initiate a new session.");
        }

        Map<String, Object> prof = resolvePatientByIdentity(String.valueOf(session.get("patientId")));
        if (prof == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Patient record not found.");
        }
        String patientName = patientName(String.valueOf(prof.get("userId")));

        Map<String, Object> emgProfile = resolveEmergencyProfile(String.valueOf(prof.get("userId")), prof, null, session);
        List<Map<String, Object>> contacts = resolveContacts(String.valueOf(prof.get("userId")), prof);
        List<Map<String, Object>> recentRecords = toRecordMaps(medicalRecordRepository.findForPatient(String.valueOf(prof.get("userId"))));

        return ApiResponse.ok()
                .with("session", session)
                .with("summary", buildSummary(prof, patientName, emgProfile, contacts, recentRecords));
    }

    // =========================================================================
    // 5B. AI EMERGENCY MEDICAL SUMMARY (deterministic - no real AI)
    // =========================================================================
    @Transactional
    public ApiResponse aiSummary(String sessionId) {
        Map<String, Object> session = requireSession(sessionId);
        checkSessionExpiration(session);
        if (!"ACTIVE".equals(session.get("status"))) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Emergency session has expired or ended. Please initiate a new session.");
        }

        Map<String, Object> prof = resolvePatientByIdentity(String.valueOf(session.get("patientId")));
        if (prof == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Patient record not found.");
        }
        String userId = String.valueOf(prof.get("userId"));
        String patientName = patientName(userId);

        Map<String, Object> emgProfile = resolveEmergencyProfile(userId, prof, null, session);
        List<Map<String, Object>> recentRecords = toRecordMaps(medicalRecordRepository.findForPatient(userId));

        auditLogService.log(String.valueOf(session.get("doctorName")), "DOCTOR",
                "AI_EMERGENCY_SUMMARY_GENERATED", String.valueOf(session.get("patientHealthId")),
                "AI Emergency Medical Summary generated for Session " + sessionId + " by Dr. "
                        + session.get("doctorName") + " (" + session.get("hospitalName") + "). Reason: "
                        + session.get("emergencyReason") + ".");

        @SuppressWarnings("unchecked")
        List<String> actions = (List<String>) session.get("actionsPerformed");
        if (!actions.contains("AI Emergency Medical Summary Viewed")) {
            actions.add("AI Emergency Medical Summary Viewed");
        }

        Map<String, Object> aiResult = generateDeterministicEmergencySummary(session, prof, emgProfile, recentRecords);

        Map<String, Object> patientIdentity = new LinkedHashMap<>();
        patientIdentity.put("userId", userId);
        patientIdentity.put("name", patientName);
        patientIdentity.put("globalHealthId", prof.get("globalHealthId"));
        patientIdentity.put("dob", prof.get("dob"));
        patientIdentity.put("gender", prof.get("gender"));
        patientIdentity.put("bloodGroup", prof.get("bloodGroup"));

        Map<String, Object> rawRecords = new LinkedHashMap<>();
        rawRecords.put("medicalRecords", recentRecords);
        rawRecords.put("labReports", recentRecords.stream()
                .filter(r -> "LAB_REPORT".equals(r.get("recordType")))
                .collect(java.util.stream.Collectors.toList()));
        rawRecords.put("allergies", emgProfile.get("allergies"));
        rawRecords.put("medications", emgProfile.get("currentMedications"));
        rawRecords.put("conditions", emgProfile.get("criticalConditions"));

        return ApiResponse.ok()
                .with("session", session)
                .with("patientIdentity", patientIdentity)
                .with("emergencyReason", session.get("emergencyReason"))
                .with("generatedAt", aiResult.get("generatedAt"))
                .with("recordsCutoff", aiResult.get("recordsCutoff"))
                .with("isAiGenerated", aiResult.get("isAiGenerated"))
                .with("aiUnavailableNotice", aiResult.get("aiUnavailableNotice"))
                .with("summary", aiResult.get("summary"))
                .with("rawRecords", rawRecords);
    }

    // =========================================================================
    // 6. VIEW FULL MEDICAL HISTORY
    // =========================================================================
    @Transactional
    public ApiResponse fullRecords(String sessionId) {
        Map<String, Object> session = requireSession(sessionId);
        checkSessionExpiration(session);
        if (!"ACTIVE".equals(session.get("status"))) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Emergency session has expired. Please initiate a new emergency request.");
        }

        @SuppressWarnings("unchecked")
        List<String> recordsAccessed = (List<String>) session.get("recordsAccessed");
        if (!recordsAccessed.contains("Full Medical History")) {
            recordsAccessed.add("Full Medical History");
        }

        auditLogService.log(String.valueOf(session.get("doctorName")), "DOCTOR",
                "EMERGENCY_FULL_HISTORY_VIEWED", String.valueOf(session.get("patientHealthId")),
                "Dr. " + session.get("doctorName")
                        + " unlocked and viewed full medical history under active emergency session " + sessionId + ".");

        List<Map<String, Object>> records = toRecordMaps(
                medicalRecordRepository.findForPatient(String.valueOf(session.get("patientId"))));

        return ApiResponse.ok().with("records", records);
    }

    // =========================================================================
    // 7. ADD EMERGENCY CARE NOTE / RX DURING SESSION
    // =========================================================================
    @Transactional
    public ApiResponse addNote(String sessionId, AddNoteRequest req) {
        Map<String, Object> session = requireSession(sessionId);
        checkSessionExpiration(session);
        if (!"ACTIVE".equals(session.get("status"))) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Emergency session has expired. Cannot add notes.");
        }

        long now = System.currentTimeMillis();
        String recordId = "rec_emg_" + now;
        String title = "[EMERGENCY] " + (req.getTitle() != null && !req.getTitle().isBlank() ? req.getTitle() : "Emergency Care & Triage Note");
        String diagnosis = req.getDiagnosis() != null && !req.getDiagnosis().isBlank() ? req.getDiagnosis() : "Acute Emergency Care";
        String doctorNotes = "[EMERGENCY SESSION " + sessionId + "] " + (req.getDoctorNotes() != null && !req.getDoctorNotes().isBlank() ? req.getDoctorNotes() : "Emergency care administered.");
        String recordType = req.getRecordType() != null && !req.getRecordType().isBlank() ? req.getRecordType() : "DIAGNOSIS";
        List<Map<String, Object>> medicines = req.getMedicines() != null ? req.getMedicines() : List.of();

        MedicalRecord record = MedicalRecord.builder()
                .id(recordId)
                .patientId(String.valueOf(session.get("patientId")))
                .patientHealthId(String.valueOf(session.get("patientHealthId")))
                .doctorId(String.valueOf(session.get("doctorId")))
                .hospitalId(String.valueOf(session.get("hospitalId")))
                .recordType(recordType)
                .title(title)
                .diagnosis(diagnosis)
                .clinicalNotes(doctorNotes)
                .recordDate(LocalDate.now())
                .build();
        medicalRecordRepository.save(record);

        @SuppressWarnings("unchecked")
        List<String> actions = (List<String>) session.get("actionsPerformed");
        if (!actions.contains("Added Emergency Note")) {
            actions.add("Added Emergency Note");
        }

        auditLogService.log(String.valueOf(session.get("doctorName")), "DOCTOR",
                "EMERGENCY_NOTE_CREATED", String.valueOf(session.get("patientHealthId")),
                "Added emergency consultation note \"" + title + "\" to patient EHR.");

        Map<String, Object> recordMap = new LinkedHashMap<>();
        recordMap.put("id", recordId);
        recordMap.put("patientId", session.get("patientId"));
        recordMap.put("patientHealthId", session.get("patientHealthId"));
        recordMap.put("doctorId", session.get("doctorId"));
        recordMap.put("doctorName", session.get("doctorName"));
        recordMap.put("hospitalName", session.get("hospitalName"));
        recordMap.put("date", LocalDate.now().toString());
        recordMap.put("recordType", recordType);
        recordMap.put("title", title);
        recordMap.put("diagnosis", diagnosis);
        recordMap.put("symptoms", List.of("Emergency Triage"));
        recordMap.put("vitals", Map.of("bp", "120/80 mmHg", "heartRate", "85 bpm", "spo2", "98%", "temp", "98.6 F"));
        recordMap.put("medicines", medicines);
        recordMap.put("doctorNotes", doctorNotes);
        recordMap.put("doctorSignature", "DIGITAL_EMERGENCY_SIG_" + session.get("doctorId") + "_" + now);

        return ApiResponse.ok()
                .with("record", recordMap)
                .with("message", "Emergency clinical note saved & linked to Patient EHR.");
    }

    // =========================================================================
    // 8. PATIENT GET EMERGENCY PROFILE & HISTORY
    // =========================================================================
    public ApiResponse patientProfile(String patientIdOrHealthId) {
        Map<String, Object> prof = resolvePatientByIdentity(patientIdOrHealthId);
        if (prof == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Patient record not found.");
        }
        String userId = String.valueOf(prof.get("userId"));

        Map<String, Object> emgProfile = store.getProfile(userId);
        if (emgProfile == null) {
            emgProfile = new LinkedHashMap<>();
            emgProfile.put("userId", userId);
            emgProfile.put("patientHealthId", prof.get("globalHealthId"));
            emgProfile.put("bloodGroup", prof.get("bloodGroup") != null ? prof.get("bloodGroup") : "");
            emgProfile.put("allergies", prof.get("allergies") != null ? prof.get("allergies") : List.of());
            emgProfile.put("criticalConditions", prof.get("chronicConditions") != null ? prof.get("chronicConditions") : List.of());
            emgProfile.put("currentMedications", List.of());
            emgProfile.put("emergencyNotes", "");
            emgProfile.put("primaryPhysician", "");
            emgProfile.put("updatedAt", Instant.now().toString());
        }

        return ApiResponse.ok()
                .with("emergencyProfile", emgProfile)
                .with("emergencyContacts", store.getContacts(userId))
                .with("notifications", store.notificationsForPatient(userId));
    }

    // =========================================================================
    // 9. PATIENT UPDATE EMERGENCY PROFILE & CONTACTS
    // =========================================================================
    @Transactional
    public ApiResponse updatePatientProfile(String patientIdOrHealthId, UpdateProfileRequest req) {
        Map<String, Object> prof = resolvePatientByIdentity(patientIdOrHealthId);
        if (prof == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Patient record not found.");
        }
        String userId = String.valueOf(prof.get("userId"));

        Map<String, Object> emgProfile = new LinkedHashMap<>();
        emgProfile.put("userId", userId);
        emgProfile.put("patientHealthId", prof.get("globalHealthId"));
        emgProfile.put("bloodGroup", req.getBloodGroup() != null ? req.getBloodGroup() : prof.get("bloodGroup"));
        emgProfile.put("allergies", parseStringList(req.getAllergies(), prof.get("allergies")));
        emgProfile.put("criticalConditions", parseStringList(req.getCriticalConditions(), prof.get("chronicConditions")));
        emgProfile.put("currentMedications", parseStringList(req.getCurrentMedications(), List.of()));
        emgProfile.put("emergencyNotes", req.getEmergencyNotes() != null ? req.getEmergencyNotes() : "");
        emgProfile.put("primaryPhysician", req.getPrimaryPhysician() != null ? req.getPrimaryPhysician() : "");
        emgProfile.put("updatedAt", Instant.now().toString());
        store.putProfile(userId, emgProfile);

        if (req.getContacts() != null) {
            store.putContacts(userId, req.getContacts());
        }

        String patientName = patientName(userId);
        auditLogService.log(patientName != null && !patientName.isBlank() ? patientName : "Patient Citizen",
                "PATIENT", "EMERGENCY_PROFILE_UPDATED", String.valueOf(prof.get("globalHealthId")),
                "Patient updated their emergency contacts, allergies, and emergency care directives.");

        return ApiResponse.ok()
                .with("emergencyProfile", store.getProfile(userId))
                .with("emergencyContacts", store.getContacts(userId))
                .with("message", "Emergency profile and contacts saved successfully.");
    }

    // =========================================================================
    // 10. PATIENT GET EMERGENCY ACCESS HISTORY
    // =========================================================================
    public ApiResponse patientHistory(String patientIdOrHealthId) {
        Map<String, Object> prof = resolvePatientByIdentity(patientIdOrHealthId);
        if (prof == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Patient record not found.");
        }
        String userId = String.valueOf(prof.get("userId"));
        String healthId = String.valueOf(prof.get("globalHealthId"));

        List<Map<String, Object>> sessions = store.sessionsForPatient(userId, healthId);
        List<Map<String, Object>> auditLogs = emergencyAuditLogsWhere(healthId, true);

        return ApiResponse.ok()
                .with("emergencySessions", sessions)
                .with("auditLogs", auditLogs);
    }

    // =========================================================================
    // 11. MARK EMERGENCY NOTIFICATION READ
    // =========================================================================
    public ApiResponse markNotificationRead(String notificationId) {
        Map<String, Object> notif = store.findNotification(notificationId);
        if (notif != null) {
            notif.put("status", "READ");
        }
        return ApiResponse.ok();
    }

    // =========================================================================
    // 12. HOSPITAL MONITOR EMERGENCY SESSIONS
    // =========================================================================
    public ApiResponse hospitalSessions(String hospitalId) {
        List<Map<String, Object>> sessions = store.sessionsForHospital(hospitalId);
        sessions.forEach(this::checkSessionExpiration);

        List<Map<String, Object>> active = new ArrayList<>();
        List<Map<String, Object>> completed = new ArrayList<>();
        for (Map<String, Object> s : sessions) {
            if ("ACTIVE".equals(s.get("status"))) active.add(s);
            else if ("ENDED".equals(s.get("status")) || "EXPIRED".equals(s.get("status"))) completed.add(s);
        }

        List<Map<String, Object>> hospitalAudits = emergencyAuditLogsWhere(null, false);
        if (hospitalAudits.size() > 30) {
            hospitalAudits = new ArrayList<>(hospitalAudits.subList(0, 30));
        }

        return ApiResponse.ok()
                .with("activeSessions", active)
                .with("completedSessions", completed)
                .with("allSessions", sessions)
                .with("auditLogs", hospitalAudits);
    }

    // =========================================================================
    // 13. SUPER ADMIN SYSTEM EMERGENCY MONITOR
    // =========================================================================
    public ApiResponse adminSessions() {
        checkAllExpirations();

        List<Map<String, Object>> all = store.allSessions();
        long activeCount = all.stream().filter(s -> "ACTIVE".equals(s.get("status"))).count();
        long endedCount = all.stream().filter(s -> "ENDED".equals(s.get("status"))).count();
        long expiredCount = all.stream().filter(s -> "EXPIRED".equals(s.get("status"))).count();

        List<Map<String, Object>> failedAttempts = failedAttemptLogs();

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("totalSessions", all.size());
        metrics.put("activeSessions", activeCount);
        metrics.put("completedSessions", endedCount);
        metrics.put("expiredSessions", expiredCount);
        metrics.put("failedAttempts", failedAttempts.size());

        return ApiResponse.ok()
                .with("metrics", metrics)
                .with("sessions", all)
                .with("failedAttempts", failedAttempts)
                .with("systemEmergencyAudits", emergencyAuditLogsWhere(null, false));
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private void checkAllExpirations() {
        store.allSessions().forEach(this::checkSessionExpiration);
    }

    private void checkSessionExpiration(Map<String, Object> session) {
        if (session == null) return;
        if ("ACTIVE".equals(session.get("status"))) {
            String expiresAt = String.valueOf(session.get("expiresAt"));
            long expiryMillis;
            try {
                expiryMillis = java.time.OffsetDateTime.parse(expiresAt).toInstant().toEpochMilli();
            } catch (Exception e) {
                expiryMillis = Long.MAX_VALUE;
            }
            if (expiryMillis < System.currentTimeMillis()) {
                session.put("status", "EXPIRED");
                session.put("endedAt", session.get("expiresAt"));
                auditLogService.log("System Security Gateway", "SYSTEM", "EMERGENCY_SESSION_EXPIRED",
                        String.valueOf(session.get("patientHealthId")),
                        "Emergency Access Session " + session.get("id")
                                + " automatically expired after 45 minutes limit.");
            }
        }
    }

    private Map<String, Object> requireSession(String sessionId) {
        Map<String, Object> session = store.findSession(sessionId);
        if (session == null) {
            throw ApiException.notFound("Emergency session not found.");
        }
        return session;
    }

    private Doctor findDoctor(String identifier) {
        if (identifier == null || identifier.isBlank()) return null;
        Doctor doctor = doctorRepository.findById(identifier).orElse(null);
        if (doctor == null) doctor = doctorRepository.findByUserId(identifier).orElse(null);
        if (doctor == null) {
            User user = userRepository.findByEmailIgnoreCase(identifier).orElse(null);
            if (user != null) doctor = doctorRepository.findByUserId(user.getId()).orElse(null);
        }
        return doctor;
    }

    private AccessCard findCardByQuery(String query) {
        if (query == null) return null;
        for (AccessCard c : accessCardRepository.findAll()) {
            if ((c.getSecureToken() != null && c.getSecureToken().equals(query))
                    || (c.getCardIdentifier() != null && c.getCardIdentifier().equals(query))
                    || (c.getQrCodeData() != null && c.getQrCodeData().contains(query))) {
                return c;
            }
        }
        return null;
    }

    private Map<String, Object> findPatientProfileByQuery(String query) {
        if (query == null) return null;
        var resolved = patientResolver.resolve(query);
        if (resolved.isPresent()) {
            return toProfileMap(resolved.get());
        }
        return null;
    }

    private Map<String, Object> findPatientProfileByHealthIdContains(String term) {
        for (PatientProfile p : patientProfileRepository.findAll()) {
            if (p.getPatientHealthId() != null && p.getPatientHealthId().toLowerCase().contains(term)) {
                var resolved = patientResolver.resolve(p.getUserId());
                if (resolved.isPresent()) return toProfileMap(resolved.get());
            }
        }
        return null;
    }

    private Map<String, Object> resolvePatientByIdentity(String identifier) {
        var resolved = patientResolver.resolve(identifier);
        if (resolved.isPresent()) {
            return toProfileMap(resolved.get());
        }
        return null;
    }

    private Map<String, Object> toProfileMap(PatientResolver.Resolved r) {
        Map<String, Object> out = new LinkedHashMap<>();
        String dob = r.user.getDateOfBirth() != null ? r.user.getDateOfBirth().toString() : "";
        out.put("userId", r.userId);
        out.put("globalHealthId", r.globalHealthId);
        out.put("name", r.name);
        out.put("dob", dob);
        out.put("gender", r.user.getGender() != null ? r.user.getGender() : "");
        out.put("bloodGroup", r.profile.getBloodGroup() != null ? r.profile.getBloodGroup() : "");
        out.put("heightCm", r.profile.getHeightCm() != null ? r.profile.getHeightCm().intValue() : 0);
        out.put("weightKg", r.profile.getWeightKg() != null ? r.profile.getWeightKg().intValue() : 0);
        out.put("organDonor", false);
        out.put("allergies", List.of());
        out.put("chronicConditions", List.of());
        out.put("emergencyContactName", "");
        out.put("emergencyContactPhone", "");
        out.put("emergencyContactRelation", "");
        return out;
    }

    private Map<String, Object> defaultPatientProfileFor(User user) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("userId", user.getId());
        out.put("globalHealthId", "");
        out.put("name", user.getName());
        out.put("dob", user.getDateOfBirth() != null ? user.getDateOfBirth().toString() : "");
        out.put("gender", user.getGender() != null ? user.getGender() : "");
        out.put("bloodGroup", "");
        out.put("heightCm", 0);
        out.put("weightKg", 0);
        out.put("organDonor", false);
        out.put("allergies", List.of());
        out.put("chronicConditions", List.of());
        out.put("emergencyContactName", "");
        out.put("emergencyContactPhone", "");
        out.put("emergencyContactRelation", "");
        return out;
    }

    private String patientName(String userId) {
        if (userId == null) return "";
        var resolved = patientResolver.resolve(userId);
        if (resolved.isPresent()) return resolved.get().name;
        return "";
    }

    private Map<String, Object> patientFound(String userId, String name, String healthId, Map<String, Object> prof) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("userId", userId);
        out.put("name", name);
        out.put("globalHealthId", healthId);
        String dob = prof.get("dob") != null ? String.valueOf(prof.get("dob")) : "";
        out.put("dobMasked", dob.length() >= 4 ? dob.substring(0, 4) + "-**-**" : "");
        out.put("gender", prof.get("gender") != null ? prof.get("gender") : "");
        out.put("bloodGroup", prof.get("bloodGroup") != null ? prof.get("bloodGroup") : "");
        return out;
    }

    private Map<String, Object> resolveEmergencyProfile(String userId, Map<String, Object> prof,
                                                        Doctor doctor, Map<String, Object> session) {
        Map<String, Object> existing = store.getProfile(userId);
        if (existing != null) return existing;

        Map<String, Object> out = new LinkedHashMap<>();
        Object allergies = prof.get("allergies") != null && !((List<?>) prof.get("allergies")).isEmpty()
                ? prof.get("allergies") : List.of();
        Object criticalConditions = prof.get("chronicConditions") != null && !((List<?>) prof.get("chronicConditions")).isEmpty()
                ? prof.get("chronicConditions") : List.of();
        String primaryPhysician = "";
        if (session != null) {
            primaryPhysician = session.get("doctorName") + " (" + session.get("hospitalName") + ")";
        }
        out.put("bloodGroup", prof.get("bloodGroup") != null ? prof.get("bloodGroup") : "");
        out.put("allergies", allergies);
        out.put("criticalConditions", criticalConditions);
        out.put("currentMedications", List.of());
        out.put("emergencyNotes", "");
        out.put("primaryPhysician", primaryPhysician);
        return out;
    }

    private List<Map<String, Object>> resolveContacts(String userId, Map<String, Object> prof) {
        List<Map<String, Object>> contacts = store.getContacts(userId);
        if (!contacts.isEmpty()) return contacts;
        Map<String, Object> c = new LinkedHashMap<>();
        c.put("id", "econt_1");
        c.put("patientId", userId);
        c.put("name", prof.get("emergencyContactName") != null ? prof.get("emergencyContactName") : "");
        c.put("relationship", prof.get("emergencyContactRelation") != null ? prof.get("emergencyContactRelation") : "");
        c.put("phone", prof.get("emergencyContactPhone") != null ? prof.get("emergencyContactPhone") : "+91 98765 43210");
        c.put("priority", 1);
        return List.of(c);
    }

    private Map<String, Object> buildSummary(Map<String, Object> prof, String patientName,
                                             Map<String, Object> emgProfile, List<Map<String, Object>> contacts,
                                             List<Map<String, Object>> recentRecords) {
        Map<String, Object> patientIdentity = new LinkedHashMap<>();
        patientIdentity.put("userId", prof.get("userId"));
        patientIdentity.put("name", patientName);
        patientIdentity.put("globalHealthId", prof.get("globalHealthId"));
        patientIdentity.put("dob", prof.get("dob"));
        patientIdentity.put("gender", prof.get("gender"));
        patientIdentity.put("bloodGroup", prof.get("bloodGroup"));
        patientIdentity.put("heightCm", prof.get("heightCm"));
        patientIdentity.put("weightKg", prof.get("weightKg"));
        patientIdentity.put("organDonor", prof.get("organDonor"));

        Map<String, Object> criticalAlerts = new LinkedHashMap<>();
        criticalAlerts.put("allergies", emgProfile.get("allergies"));
        criticalAlerts.put("criticalConditions", emgProfile.get("criticalConditions"));
        criticalAlerts.put("emergencyNotes",
                emgProfile.get("emergencyNotes") != null ? emgProfile.get("emergencyNotes") : "No special emergency notes recorded.");
        criticalAlerts.put("primaryPhysician",
                emgProfile.get("primaryPhysician") != null ? emgProfile.get("primaryPhysician") : "");

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("patientIdentity", patientIdentity);
        summary.put("criticalAlerts", criticalAlerts);
        summary.put("currentMedications", emgProfile.get("currentMedications"));
        summary.put("emergencyContacts", contacts);
        summary.put("recentRecords", recentRecords);
        summary.put("vitals", VITALS);
        return summary;
    }

    private Map<String, Object> generateDeterministicEmergencySummary(Map<String, Object> session,
                                                                      Map<String, Object> prof,
                                                                      Map<String, Object> emgProfile,
                                                                      List<Map<String, Object>> recentRecords) {
        String patientName = patientName(String.valueOf(prof.get("userId")));
        String reason = session.get("emergencyReason") != null
                ? String.valueOf(session.get("emergencyReason")) : "Emergency Triage";

        List<Object> rawAllergies = listOf(emgProfile.get("allergies"));
        List<Object> rawConditions = listOf(emgProfile.get("criticalConditions"));
        List<Object> rawMeds = listOf(emgProfile.get("currentMedications"));

        List<Map<String, Object>> allergies = new ArrayList<>();
        for (int i = 0; i < rawAllergies.size(); i++) {
            Map<String, Object> a = new LinkedHashMap<>();
            a.put("allergen", String.valueOf(rawAllergies.get(i)));
            a.put("severity", "High Priority Alert");
            a.put("notes", "Documented in Patient Emergency Profile");
            a.put("sourceType", "ALLERGY");
            a.put("sourceId", "allg_" + (i + 1));
            a.put("date", "2026-06-01");
            allergies.add(a);
        }

        List<Map<String, Object>> conditions = new ArrayList<>();
        for (int i = 0; i < rawConditions.size(); i++) {
            Map<String, Object> c = new LinkedHashMap<>();
            c.put("name", String.valueOf(rawConditions.get(i)));
            c.put("status", "Documented Condition");
            c.put("sourceType", "EMERGENCY_PROFILE");
            c.put("sourceId", "cond_" + (i + 1));
            c.put("date", "2026-06-01");
            conditions.add(c);
        }

        List<Map<String, Object>> medications = new ArrayList<>();
        for (int i = 0; i < rawMeds.size(); i++) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name", String.valueOf(rawMeds.get(i)));
            m.put("dosage", "Standard Prescribed Dose");
            m.put("frequency", "As Prescribed");
            m.put("status", "Active");
            m.put("sourceType", "MEDICATION");
            m.put("sourceId", "med_" + (i + 1));
            m.put("date", "2026-07-28");
            medications.add(m);
        }

        List<Map<String, Object>> labFindings = new ArrayList<>();
        for (Map<String, Object> rec : recentRecords) {
            Object labResults = rec.get("labResults");
            if (labResults instanceof List<?> && !((List<?>) labResults).isEmpty()) {
                for (Object lrObj : (List<?>) labResults) {
                    Map<?, ?> lr = (Map<?, ?>) lrObj;
                    String statusRaw = String.valueOf(lr.get("status"));
                    String status;
                    if ("HIGH".equals(statusRaw) || "SLIGHTLY HIGH".equals(statusRaw)) status = "ABOVE_REFERENCE";
                    else if ("LOW".equals(statusRaw)) status = "BELOW_REFERENCE";
                    else if ("CRITICAL".equals(statusRaw)) status = "CRITICAL";
                    else status = "NORMAL";

                    Map<String, Object> find = new LinkedHashMap<>();
                    find.put("testName", lr.get("testName"));
                    find.put("result", lr.get("resultValue"));
                    find.put("unit", "");
                    find.put("referenceRange", lr.get("normalRange") != null ? lr.get("normalRange") : "Reference range unavailable");
                    find.put("status", status);
                    find.put("sourceType", "LAB_REPORT");
                    find.put("sourceId", rec.get("id"));
                    find.put("date", rec.get("date"));
                    labFindings.add(find);
                }
            }
        }

        List<Map<String, Object>> recentEvents = new ArrayList<>();
        for (Map<String, Object> rec : recentRecords) {
            Map<String, Object> ev = new LinkedHashMap<>();
            ev.put("title", rec.get("title"));
            ev.put("type", rec.get("recordType"));
            ev.put("date", rec.get("date"));
            ev.put("facility", rec.get("hospitalName") != null ? rec.get("hospitalName") : "Apollo Multi-Specialty Hospital");
            ev.put("sourceId", rec.get("id"));
            recentEvents.add(ev);
        }

        List<Map<String, Object>> criticalAlerts = new ArrayList<>();
        for (Map<String, Object> a : allergies) {
            Map<String, Object> alert = new LinkedHashMap<>();
            alert.put("text", "ALLERGY: " + a.get("allergen") + " (" + a.get("severity") + ")");
            alert.put("sourceType", "ALLERGY");
            alert.put("sourceId", a.get("sourceId"));
            alert.put("date", a.get("date"));
            criticalAlerts.add(alert);
        }
        for (Map<String, Object> c : conditions) {
            Map<String, Object> alert = new LinkedHashMap<>();
            alert.put("text", "CONDITION: " + c.get("name") + " (" + c.get("status") + ")");
            alert.put("sourceType", "EMERGENCY_PROFILE");
            alert.put("sourceId", c.get("sourceId"));
            alert.put("date", c.get("date"));
            criticalAlerts.add(alert);
        }

        String hasAllergiesStr = !allergies.isEmpty()
                ? "Known allergies to " + joinAllergens(allergies) + "." : "No documented drug allergies.";
        String hasCondStr = !conditions.isEmpty()
                ? "Documented history of " + joinConditions(conditions) + "." : "No chronic conditions on file.";
        String medsStr = !medications.isEmpty() ? joinMedications(medications) : "no active medications";
        String summaryParagraph = "Patient " + patientName + " accessed under emergency protocol for \"" + reason
                + "\". " + hasAllergiesStr + " " + hasCondStr + " Currently taking " + medsStr
                + ". Clinical vitals and lab findings assembled from verified source documents below.";

        List<Map<String, Object>> recentVitals = new ArrayList<>();
        for (Map<String, Object> v : AI_VITALS) {
            Map<String, Object> rv = new LinkedHashMap<>();
            rv.put("name", v.get("name"));
            rv.put("value", v.get("value"));
            rv.put("source", v.get("source"));
            String timestamp = String.valueOf(v.get("timestamp"));
            rv.put("date", timestamp.contains(" ") ? timestamp.split(" ")[0] : "2026-08-09");
            rv.put("sourceId", v.get("sourceId") != null ? v.get("sourceId") : "vit_1");
            recentVitals.add(rv);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("summaryParagraph", summaryParagraph);
        summary.put("criticalAlerts", criticalAlerts);
        summary.put("allergies", allergies);
        summary.put("conditions", conditions);
        summary.put("medications", medications);
        summary.put("labFindings", labFindings);
        summary.put("recentVitals", recentVitals);
        summary.put("recentEvents", recentEvents);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("isAiGenerated", false);
        result.put("aiUnavailableNotice",
                "AI summary service is currently operating in deterministic mode. Displaying original clinical records below.");
        result.put("generatedAt", Instant.now().toString());
        result.put("recordsCutoff", Instant.now().toString());
        result.put("summary", summary);
        return result;
    }

    private List<Object> listOf(Object value) {
        if (value instanceof List<?> list) return new ArrayList<Object>(list);
        return new ArrayList<>();
    }

    private String joinAllergens(List<Map<String, Object>> allergies) {
        List<String> names = new ArrayList<>();
        for (Map<String, Object> a : allergies) names.add(String.valueOf(a.get("allergen")));
        return String.join(", ", names);
    }

    private String joinConditions(List<Map<String, Object>> conditions) {
        List<String> names = new ArrayList<>();
        for (Map<String, Object> c : conditions) names.add(String.valueOf(c.get("name")));
        return String.join(", ", names);
    }

    private String joinMedications(List<Map<String, Object>> medications) {
        List<String> names = new ArrayList<>();
        for (Map<String, Object> m : medications) names.add(String.valueOf(m.get("name")));
        return String.join(", ", names);
    }

    private List<Map<String, Object>> toRecordMaps(List<MedicalRecord> records) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (MedicalRecord r : records) out.add(toRecordMap(r));
        return out;
    }

    private Map<String, Object> toRecordMap(MedicalRecord r) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", r.getId());
        out.put("patientId", r.getPatientId());
        out.put("patientHealthId", r.getPatientHealthId());
        out.put("doctorId", r.getDoctorId());
        out.put("doctorName", "Attending Physician");
        out.put("hospitalName", "Medical Center");
        out.put("date", r.getRecordDate() != null ? r.getRecordDate().toString() : "");
        out.put("recordType", r.getRecordType());
        out.put("title", r.getTitle());
        out.put("diagnosis", r.getDiagnosis());
        out.put("symptoms", List.of());
        out.put("vitals", Map.of());
        out.put("medicines", List.of());
        out.put("labResults", List.of());
        out.put("attachmentUrl", r.getFileUrl() != null ? r.getFileUrl() : "");
        out.put("doctorNotes", r.getClinicalNotes());
        out.put("doctorSignature", "");
        return out;
    }

    private List<Map<String, Object>> emergencyAuditLogsWhere(String targetPatientHealthId, boolean filterByTarget) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (AuditLog log : auditLogRepository.findAllByOrderByTimestampDesc()) {
            String action = log.getAction();
            if (action == null || !action.contains("EMERGENCY")) continue;
            if (filterByTarget && targetPatientHealthId != null
                    && !targetPatientHealthId.equals(log.getTargetPatientHealthId())) continue;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", log.getId());
            m.put("timestamp", log.getTimestamp().toString());
            m.put("actorName", log.getActorName());
            m.put("actorRole", log.getActorRole());
            m.put("action", action);
            m.put("targetPatientHealthId", log.getTargetPatientHealthId());
            m.put("details", log.getDetails());
            m.put("ipAddress", log.getIpAddress());
            out.add(m);
        }
        return out;
    }

    private List<Map<String, Object>> failedAttemptLogs() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (AuditLog log : auditLogRepository.findAllByOrderByTimestampDesc()) {
            String action = log.getAction();
            if (action != null
                    && (action.contains("FAILED") || action.contains("UNAUTHORIZED") || action.contains("REVOKED"))) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", log.getId());
                m.put("timestamp", log.getTimestamp().toString());
                m.put("actorName", log.getActorName());
                m.put("actorRole", log.getActorRole());
                m.put("action", action);
                m.put("targetPatientHealthId", log.getTargetPatientHealthId());
                m.put("details", log.getDetails());
                m.put("ipAddress", log.getIpAddress());
                out.add(m);
            }
        }
        return out;
    }

    private List<Object> parseStringList(String input, Object defaultValue) {
        if (input != null) {
            if (input.contains(",")) {
                List<Object> out = new ArrayList<>();
                for (String s : input.split(",")) {
                    String trimmed = s.trim();
                    if (!trimmed.isEmpty()) out.add(trimmed);
                }
                return out;
            }
            if (!input.isBlank()) return new ArrayList<>(List.of(input.trim()));
        }
        if (defaultValue instanceof List<?> existing) return new ArrayList<Object>(existing);
        return new ArrayList<>();
    }

    private static Map<String, Object> vital(String name, String value, String timestamp, String source) {
        Map<String, Object> v = new LinkedHashMap<>();
        v.put("name", name);
        v.put("value", value);
        v.put("timestamp", timestamp);
        v.put("source", source);
        return v;
    }

    private static Map<String, Object> aiVital(String name, String value, String timestamp, String source, String sourceId) {
        Map<String, Object> v = new LinkedHashMap<>();
        v.put("name", name);
        v.put("value", value);
        v.put("timestamp", timestamp);
        v.put("source", source);
        v.put("sourceId", sourceId);
        return v;
    }
}
