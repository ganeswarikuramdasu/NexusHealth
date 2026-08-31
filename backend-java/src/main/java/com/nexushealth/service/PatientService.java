package com.nexushealth.service;

import com.nexushealth.common.ApiException;
import com.nexushealth.common.ApiResponse;
import com.nexushealth.dto.patient.PatientRequests.AddDietPlanRequest;
import com.nexushealth.dto.patient.PatientRequests.AddManualRecordRequest;
import com.nexushealth.dto.patient.PatientRequests.GrantConsentRequest;
import com.nexushealth.dto.patient.PatientRequests.SubmitFeedbackRequest;
import com.nexushealth.entity.Consent;
import com.nexushealth.entity.Doctor;
import com.nexushealth.entity.Hospital;
import com.nexushealth.entity.MedicalRecord;
import com.nexushealth.entity.RecordAccessLog;
import com.nexushealth.repository.ConsentRepository;
import com.nexushealth.repository.DoctorRepository;
import com.nexushealth.repository.HospitalRepository;
import com.nexushealth.repository.MedicalRecordRepository;
import com.nexushealth.repository.RecordAccessLogRepository;
import com.nexushealth.service.store.DietPlanStore;
import com.nexushealth.service.store.FeedbackStore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class PatientService {

    private final PatientResolver patientResolver;
    private final MedicalRecordRepository medicalRecordRepository;
    private final ConsentRepository consentRepository;
    private final DoctorRepository doctorRepository;
    private final HospitalRepository hospitalRepository;
    private final AuditLogService auditLogService;
    private final FeedbackStore feedbackStore;
    private final DietPlanStore dietPlanStore;
    private final RecordAccessLogRepository recordAccessLogRepository;

    public PatientService(PatientResolver patientResolver, MedicalRecordRepository medicalRecordRepository,
                           ConsentRepository consentRepository, DoctorRepository doctorRepository,
                           HospitalRepository hospitalRepository, AuditLogService auditLogService,
                           FeedbackStore feedbackStore, DietPlanStore dietPlanStore,
                           RecordAccessLogRepository recordAccessLogRepository) {
        this.patientResolver = patientResolver;
        this.medicalRecordRepository = medicalRecordRepository;
        this.consentRepository = consentRepository;
        this.doctorRepository = doctorRepository;
        this.hospitalRepository = hospitalRepository;
        this.auditLogService = auditLogService;
        this.feedbackStore = feedbackStore;
        this.dietPlanStore = dietPlanStore;
        this.recordAccessLogRepository = recordAccessLogRepository;
    }

    public ApiResponse lookup(String healthId) {
        String rawId = healthId != null ? healthId.trim() : "";
        if (rawId.isEmpty()) {
            ApiResponse resp = ApiResponse.fail("Please enter a valid Patient Global Health ID.");
            resp.put("code", "MISSING_HEALTH_ID");
            return resp;
        }
        var resolved = patientResolver.resolve(rawId).orElse(null);
        if (resolved == null) {
            ApiResponse resp = ApiResponse.fail("No patient record registered with Global Unique Health ID: \"" + rawId + "\".");
            resp.put("code", "PATIENT_NOT_FOUND");
            return resp;
        }
        List<Map<String, Object>> records = toPublicRecords(medicalRecordRepository.findForPatient(resolved.userId));
        List<Map<String, Object>> consents = toPublicConsents(consentRepository.findActiveForPatient(resolved.userId));
        auditLogService.log(resolved.name, "PATIENT", "PATIENT_LOOKUP", resolved.globalHealthId,
                "Looked up patient " + resolved.globalHealthId + ".");

        return ApiResponse.ok().with("patient", patientResolver.toPublicProfile(resolved))
                .with("records", records).with("consents", consents);
    }

    public Map<String, Object> profile(String userId) {
        var resolved = patientResolver.resolve(userId)
                .orElseThrow(() -> new ApiException(org.springframework.http.HttpStatus.NOT_FOUND, "Patient profile not found."));
        auditLogService.log(resolved.name, "PATIENT", "PATIENT_PROFILE_VIEWED", resolved.globalHealthId,
                "Retrieved patient profile " + resolved.globalHealthId + ".");
        return patientResolver.toPublicProfile(resolved);
    }

    public List<Map<String, Object>> records(String patientId) {
        var resolved = patientResolver.resolve(patientId).orElse(null);
        String targetId = resolved != null ? resolved.userId : patientId;
        List<MedicalRecord> records = medicalRecordRepository.findForPatient(targetId);
        auditLogService.log(resolved != null ? resolved.name : "Patient", "PATIENT", "PATIENT_RECORDS_VIEWED",
                resolved != null ? resolved.globalHealthId : patientId,
                "Retrieved " + records.size() + " medical record(s).");
        return toPublicRecords(records);
    }

    public List<Map<String, Object>> consents(String patientId) {
        var resolved = patientResolver.resolve(patientId).orElse(null);
        String targetId = resolved != null ? resolved.userId : patientId;
        List<Consent> consents = consentRepository.findActiveForPatient(targetId);
        auditLogService.log(resolved != null ? resolved.name : "Patient", "PATIENT", "CONSENTS_VIEWED",
                resolved != null ? resolved.globalHealthId : patientId,
                "Retrieved " + consents.size() + " active consent(s).");
        return toPublicConsents(consents);
    }

    @Transactional
    public ApiResponse grantConsent(GrantConsentRequest req) {
        var resolved = patientResolver.resolve(req.getPatientId()).orElse(null);
        Doctor doctor = req.getDoctorId() != null
                ? doctorRepository.findById(req.getDoctorId()).orElseGet(() -> doctorRepository.findByUserId(req.getDoctorId()).orElse(null))
                : null;

        String targetPatientUserId = resolved != null ? resolved.userId : (req.getPatientId() != null ? req.getPatientId() : "");
        String targetPatientName = resolved != null ? resolved.name : "Patient Citizen";
        String docId = doctor != null ? doctor.getId() : req.getDoctorId();
        String docName = doctor != null ? doctor.getName() : "Attending Physician";

        Consent existing = consentRepository.findByPatientIdAndDoctorId(targetPatientUserId, docId).orElse(null);

        Consent consent = existing != null ? existing : Consent.builder()
                .id("c_" + System.currentTimeMillis())
                .patientId(targetPatientUserId)
                .doctorId(docId)
                .build();
        consent.setHospitalId(doctor != null ? doctor.getHospitalId() : consent.getHospitalId());
        consent.setConsentType(req.getConsentType() != null ? req.getConsentType() : "TEMPORARY");
        consent.setScope(req.getAllowedCategories() != null ? req.getAllowedCategories() : List.of("ALL_RECORDS"));
        consent.setExpiresAt(parseDateOr(req.getValidUntil(), LocalDate.of(2027, 12, 31)));
        consent.setStatus("GRANTED");
        consentRepository.save(consent);

        auditLogService.log(targetPatientName, "PATIENT", "CONSENT_GRANT", resolved != null ? resolved.globalHealthId : null,
                "Granted " + consent.getConsentType() + " record access to " + docName);

        return ApiResponse.ok().with("consent", toPublicConsent(consent));
    }

    @Transactional
    public ApiResponse revokeConsent(String consentId) {
        Consent consent = consentRepository.findById(consentId).orElse(null);
        if (consent == null) {
            // Node also allows revoking by doctorId if no exact consent id match; approximate here.
            consent = consentRepository.findAll().stream()
                    .filter(c -> consentId.equals(c.getDoctorId())).findFirst().orElse(null);
        }
        String docName = "Attending Physician";
        if (consent != null) {
            consent.setStatus("REVOKED");
            consent.setRevokedAt(java.time.LocalDateTime.now());
            consentRepository.save(consent);
            Doctor doctor = doctorRepository.findById(consent.getDoctorId()).orElse(null);
            if (doctor != null) docName = doctor.getName();
        }
        auditLogService.log("Patient", "PATIENT", "CONSENT_REVOKE", null, "Revoked access from " + docName);
        return ApiResponse.ok("Access revoked from " + docName);
    }

    @Transactional
    public ApiResponse addManualRecord(AddManualRecordRequest req) {
        var resolved = patientResolver.resolve(req.getPatientId()).orElse(null);
        if (resolved == null) {
            throw new ApiException(org.springframework.http.HttpStatus.NOT_FOUND, "Patient record not found.");
        }
        MedicalRecord record = MedicalRecord.builder()
                .id("rec_manual_" + System.currentTimeMillis())
                .patientId(resolved.userId)
                .patientHealthId(resolved.globalHealthId)
                .recordType(req.getRecordType() != null ? req.getRecordType() : "LAB_REPORT")
                .title(req.getTitle() != null ? req.getTitle() : "Uploaded Medical Record")
                .diagnosis(req.getDiagnosis() != null ? req.getDiagnosis() : "Patient Uploaded Document")
                .clinicalNotes(req.getDoctorNotes() != null ? req.getDoctorNotes() : "Manually recorded by patient in NexusHealth PHR.")
                .recordDate(parseDateOr(req.getDate(), LocalDate.now()))
                .fileUrl(req.getAttachmentUrl())
                .build();

        Map<String, Object> extra = new LinkedHashMap<>();
        if (req.getSymptoms() != null) extra.put("symptoms", normalizeList(req.getSymptoms()));
        if (req.getLabResults() != null) extra.put("labResults", req.getLabResults());
        if (req.getDoctorName() != null) extra.put("doctorName", req.getDoctorName());
        if (req.getHospitalName() != null) extra.put("hospitalName", req.getHospitalName());
        if (!extra.isEmpty()) record.setExtra(extra);
        medicalRecordRepository.save(record);

        auditLogService.log(resolved.name, "PATIENT", "MANUAL_RECORD_ADD", resolved.globalHealthId,
                "Patient manually added " + record.getRecordType() + ": " + record.getTitle());

        return ApiResponse.ok().with("record", toPublicRecord(record));
    }

    // ---- submit feedback ----

    public ApiResponse submitFeedback(SubmitFeedbackRequest req) {
        Doctor doctor = req.getDoctorId() != null
                ? doctorRepository.findById(req.getDoctorId()).orElse(null)
                : null;

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("patientId", req.getPatientId() != null ? req.getPatientId() : "");
        data.put("patientName", req.getPatientName() != null ? req.getPatientName() : "Patient");
        data.put("doctorId", req.getDoctorId());
        data.put("doctorName", doctor != null ? doctor.getName() : "Doctor");
        data.put("rating", req.getRating() != null ? parseRating(req.getRating()) : 5);
        data.put("comment", req.getComment() != null ? req.getComment() : "Great consultation.");

        Map<String, Object> feedback = feedbackStore.add(data);

        Double doctorRating = null;
        if (doctor != null) {
            List<Map<String, Object>> allFeedback = feedbackStore.forDoctor(doctor.getId());
            double sum = 0;
            for (Map<String, Object> f : allFeedback) {
                sum += parseRating(f.get("rating"));
            }
            doctorRating = Math.round((sum / allFeedback.size()) * 10.0) / 10.0;
            Map<String, Object> extra = doctor.getExtra() != null ? doctor.getExtra() : new LinkedHashMap<>();
            extra.put("rating", doctorRating);
            doctor.setExtra(extra);
            doctorRepository.save(doctor);
        }

        auditLogService.log(req.getPatientName() != null ? req.getPatientName() : "Patient",
                "PATIENT", "SUBMIT_FEEDBACK", "N/A",
                "Rated " + (doctor != null ? doctor.getName() : "Unknown") + " " + req.getRating() + "/5 stars.");

        return ApiResponse.ok().with("feedback", feedback).with("doctorRating", doctorRating);
    }

    // ---- diet plans ----

    public List<Map<String, Object>> getDietPlans(String patientId) {
        var resolved = patientResolver.resolve(patientId).orElse(null);
        String targetUserId = resolved != null ? resolved.userId : patientId;
        return dietPlanStore.forPatient(targetUserId);
    }

    public ApiResponse addDietPlan(AddDietPlanRequest req) {
        var resolved = patientResolver.resolve(req.getPatientId()).orElse(null);
        String targetUserId = resolved != null ? resolved.userId : req.getPatientId();
        String targetHealthId = resolved != null ? resolved.globalHealthId : "";

        Map<String, Object> diet = new LinkedHashMap<>();
        diet.put("patientId", targetUserId);
        diet.put("patientHealthId", targetHealthId);
        diet.put("doctorId", req.getDoctorId() != null ? req.getDoctorId() : "doc_1");
        diet.put("doctorName", req.getDoctorName() != null ? req.getDoctorName() : "Attending Clinical Nutritionist");
        diet.put("hospitalName", req.getHospitalName() != null ? req.getHospitalName() : "NexusHealth Preventive Care");
        diet.put("title", req.getTitle() != null ? req.getTitle() : "Balanced Healthcare Diet Plan");
        diet.put("category", req.getCategory() != null ? req.getCategory() : "General Wellness");
        diet.put("dailyCaloriesTarget", req.getDailyCaloriesTarget() != null ? req.getDailyCaloriesTarget() : "2000 kcal");
        diet.put("waterIntakeLiters", req.getWaterIntakeLiters() != null ? parseDouble(req.getWaterIntakeLiters()) : 3.0);
        diet.put("meals", req.getMeals() != null ? req.getMeals() : Map.of(
                "breakfast", "Oats with nuts & fresh fruits",
                "lunch", "Brown rice, grilled vegetables & dal",
                "eveningSnack", "Herbal tea & handful of almonds",
                "dinner", "Light vegetable soup & multigrain bread"));
        diet.put("restrictedFoods", req.getRestrictedFoods() != null ? req.getRestrictedFoods()
                : List.of("Excess refined sugar", "Deep fried foods", "High sodium snacks"));
        diet.put("recommendedFoods", req.getRecommendedFoods() != null ? req.getRecommendedFoods()
                : List.of("Fresh leafy greens", "Whole grains", "Plenty of water"));
        diet.put("doctorAdvice", req.getDoctorAdvice() != null ? req.getDoctorAdvice()
                : "Maintain regular meal times and stay hydrated.");

        Map<String, Object> stored = dietPlanStore.add(diet);

        auditLogService.log(req.getDoctorName() != null ? req.getDoctorName() : "Patient",
                req.getDoctorId() != null ? "DOCTOR" : "PATIENT",
                "DIET_PLAN_CREATED", targetHealthId,
                "Created diet plan: " + stored.get("title"));

        return ApiResponse.ok().with("dietPlan", stored);
    }

    // ---- access history ----

    public List<Map<String, Object>> accessHistory(String patientId) {
        List<Map<String, Object>> out = new ArrayList<>();
        List<RecordAccessLog> logs;

        if (patientId == null || patientId.isBlank()) {
            logs = recordAccessLogRepository.findAllByOrderByTimestampDesc();
        } else {
            var resolved = patientResolver.resolve(patientId).orElse(null);
            String targetUserId = resolved != null ? resolved.userId : patientId;
            String targetHealthId = resolved != null ? resolved.globalHealthId : patientId;
            logs = recordAccessLogRepository.findForPatient(targetUserId, targetHealthId);
        }

        for (RecordAccessLog l : logs) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", l.getId());
            m.put("doctorId", l.getDoctorId());
            m.put("doctorName", l.getDoctorName());
            m.put("patientId", l.getPatientId());
            m.put("patientHealthId", l.getPatientHealthId());
            m.put("patientName", l.getPatientName());
            m.put("hospitalId", l.getHospitalId());
            m.put("hospitalName", l.getHospitalName());
            m.put("accessMethod", l.getAccessMethod());
            m.put("accessStatus", l.getAccessStatus());
            m.put("accessType", l.getAccessType());
            m.put("emergencyFlag", l.getEmergencyFlag());
            m.put("reason", l.getReason());
            m.put("denialReason", l.getDenialReason());
            m.put("recordsAccessed", l.getRecordsAccessed());
            m.put("verificationMethod", l.getVerificationMethod());
            m.put("verificationStatus", l.getVerificationStatus());
            m.put("sessionId", l.getSessionId());
            m.put("appointmentId", l.getAppointmentId());
            m.put("timestamp", l.getTimestamp() != null ? l.getTimestamp().toString() : null);
            m.put("ipAddress", l.getIpAddress());
            out.add(m);
        }
        return out;
    }

    // ---- mapping ----

    private List<Map<String, Object>> toPublicRecords(List<MedicalRecord> records) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (MedicalRecord r : records) out.add(toPublicRecord(r));
        return out;
    }

    private Map<String, Object> toPublicRecord(MedicalRecord r) {
        Doctor doctor = r.getDoctorId() != null ? doctorRepository.findById(r.getDoctorId()).orElse(null) : null;
        Hospital hospital = r.getHospitalId() != null ? hospitalRepository.findById(r.getHospitalId()).orElse(null) : null;
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", r.getId());
        out.put("patientId", r.getPatientId());
        out.put("patientHealthId", r.getPatientHealthId());
        out.put("doctorId", r.getDoctorId());
        out.put("doctorName", doctor != null ? doctor.getName() : "Self / External Facility");
        out.put("hospitalName", hospital != null ? hospital.getName() : "Independent Diagnostic Care");
        out.put("date", r.getRecordDate().toString());
        out.put("recordType", r.getRecordType());
        out.put("title", r.getTitle());
        out.put("diagnosis", r.getDiagnosis() != null ? r.getDiagnosis() : "");
        out.put("symptoms", List.of());
        out.put("vitals", Map.of());
        out.put("medicines", List.of());
        out.put("labResults", List.of());
        out.put("attachmentUrl", r.getFileUrl() != null ? r.getFileUrl() : "");
        out.put("doctorNotes", r.getClinicalNotes() != null ? r.getClinicalNotes() : "");
        out.put("doctorSignature", "");
        return out;
    }

    private List<Map<String, Object>> toPublicConsents(List<Consent> consents) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Consent c : consents) out.add(toPublicConsent(c));
        return out;
    }

    private Map<String, Object> toPublicConsent(Consent c) {
        Doctor doctor = c.getDoctorId() != null ? doctorRepository.findById(c.getDoctorId()).orElse(null) : null;
        Hospital hospital = c.getHospitalId() != null ? hospitalRepository.findById(c.getHospitalId()).orElse(null) : null;
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", c.getId());
        out.put("patientId", c.getPatientId());
        out.put("doctorId", c.getDoctorId());
        out.put("doctorName", doctor != null ? doctor.getName() : "Attending Physician");
        out.put("hospitalName", hospital != null ? hospital.getName() : (doctor != null ? doctor.getHospitalName() : "Medical Center"));
        out.put("consentType", c.getConsentType());
        out.put("allowedCategories", c.getScope());
        out.put("validUntil", c.getExpiresAt() != null ? c.getExpiresAt().toString() : null);
        out.put("status", "GRANTED".equals(c.getStatus()) ? "ACTIVE" : c.getStatus());
        out.put("grantedAt", c.getGrantedAt().toString());
        return out;
    }

    private static LocalDate parseDateOr(String dateStr, LocalDate fallback) {
        if (dateStr == null || dateStr.isBlank()) return fallback;
        try {
            return LocalDate.parse(dateStr);
        } catch (Exception e) {
            return fallback;
        }
    }

    private static int parseRating(Object value) {
        if (value instanceof Number n) return n.intValue();
        if (value != null) {
            try { return Integer.parseInt(value.toString().trim()); } catch (Exception ignored) {}
        }
        return 5;
    }

    private static double parseDouble(Object value) {
        if (value instanceof Number n) return n.doubleValue();
        if (value != null) {
            try { return Double.parseDouble(value.toString().trim()); } catch (Exception ignored) {}
        }
        return 3.0;
    }

    @SuppressWarnings("unchecked")
    private static Object normalizeList(Object value) {
        if (value instanceof List<?>) {
            return new ArrayList<>((List<Object>) value);
        }
        if (value instanceof String s && !s.isBlank() && s.contains(",")) {
            List<String> out = new ArrayList<>();
            for (String part : s.split(",")) {
                String trimmed = part.trim();
                if (!trimmed.isEmpty()) out.add(trimmed);
            }
            return out;
        }
        return value;
    }
}
