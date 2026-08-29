package com.nexushealth.service;

import com.nexushealth.common.ApiException;
import com.nexushealth.common.ApiResponse;
import com.nexushealth.dto.medication.MedicationRequests.*;
import com.nexushealth.entity.Doctor;
import com.nexushealth.entity.MedicationDoseLog;
import com.nexushealth.entity.PatientMedication;
import com.nexushealth.repository.DoctorRepository;
import com.nexushealth.repository.MedicationDoseLogRepository;
import com.nexushealth.repository.PatientMedicationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class MedicationService {

    private static final Set<String> LOGGABLE_STATUSES = Set.of("TAKEN", "MISSED", "SKIPPED");

    private final PatientMedicationRepository medicationRepository;
    private final MedicationDoseLogRepository doseLogRepository;
    private final DoctorRepository doctorRepository;
    private final PatientResolver patientResolver;
    private final AuditLogService auditLogService;

    public MedicationService(PatientMedicationRepository medicationRepository, MedicationDoseLogRepository doseLogRepository,
                              DoctorRepository doctorRepository, PatientResolver patientResolver,
                              AuditLogService auditLogService) {
        this.medicationRepository = medicationRepository;
        this.doseLogRepository = doseLogRepository;
        this.doctorRepository = doctorRepository;
        this.patientResolver = patientResolver;
        this.auditLogService = auditLogService;
    }

    public ApiResponse getForPatient(String patientId) {
        var resolved = patientResolver.resolve(patientId).orElse(null);
        String targetPatientId = resolved != null ? resolved.userId : patientId;
        String targetHealthId = resolved != null ? resolved.globalHealthId : patientId;

        List<PatientMedication> allMeds = medicationRepository.findForPatient(targetPatientId);
        List<Map<String, Object>> active = new ArrayList<>();
        List<Map<String, Object>> history = new ArrayList<>();
        for (PatientMedication m : allMeds) {
            List<Map<String, Object>> bucket = "ACTIVE".equals(m.getStatus()) ? active : history;
            bucket.add(toPublic(m));
        }

        List<MedicationDoseLog> allDoseLogs = doseLogRepository.findForPatient(targetPatientId);
        String todayStr = LocalDate.now().toString();
        List<Map<String, Object>> todayDoseLogs = new ArrayList<>();
        for (MedicationDoseLog d : allDoseLogs) {
            if (todayStr.equals(d.getScheduledDate().toString())) todayDoseLogs.add(toPublicDoseLog(d));
        }

        auditLogService.log(resolved != null ? resolved.name : "Patient", "PATIENT", "MEDICATION_VIEWED", targetHealthId,
                "Retrieved " + active.size() + " active medication(s) and " + history.size() + " historical record(s).");

        ApiResponse response = ApiResponse.ok();
        response.put("patientId", targetPatientId);
        response.put("patientHealthId", targetHealthId);
        response.put("activeMedications", active);
        response.put("medicationHistory", history);
        response.put("todayDoseLogs", todayDoseLogs);
        response.put("adherenceSummary", calculateAdherence(allDoseLogs));
        return response;
    }

    @Transactional
    public ApiResponse addMedication(AddMedicationRequest req) {
        if (isBlank(req.getMedicationName())) throw ApiException.badRequest("Medication Name is required.");
        if (isBlank(req.getDosage())) throw ApiException.badRequest("Dosage is required.");
        if (isBlank(req.getFrequency())) throw ApiException.badRequest("Frequency is required.");
        if (isBlank(req.getStartDate())) throw ApiException.badRequest("Start Date is required.");

        LocalDate startDate = parseDateOr(req.getStartDate(), LocalDate.now());
        LocalDate endDate = req.getEndDate() != null ? parseDateOr(req.getEndDate(), null) : startDate.plusDays(30);
        if (endDate != null && endDate.isBefore(startDate)) {
            throw ApiException.badRequest("End Date cannot be before Start Date.");
        }

        String identifier = !isBlank(req.getPatientId()) ? req.getPatientId() : req.getPatientHealthId();
        var resolved = patientResolver.resolve(identifier).orElse(null);
        if (resolved == null) throw ApiException.notFound("Patient record not found.");

        PatientMedication medication = PatientMedication.builder()
                .id("med_" + System.currentTimeMillis())
                .patientId(resolved.userId)
                .patientHealthId(resolved.globalHealthId)
                .prescriptionId(req.getPrescriptionId())
                .doctorId(req.getDoctorId())
                .medicationName(req.getMedicationName().trim())
                .genericName(req.getGenericName() != null ? req.getGenericName().trim() : "")
                .dosage(req.getDosage().trim())
                .unit(req.getUnit() != null ? req.getUnit() : "mg")
                .frequency(req.getFrequency().trim())
                .route(req.getRoute() != null ? req.getRoute() : "Oral")
                .timing(req.getTiming())
                .startDate(startDate)
                .endDate(endDate)
                .duration(req.getDuration() != null ? req.getDuration() : "30 Days")
                .indication(req.getIndication() != null ? req.getIndication() : "Clinical Indication")
                .instructions(req.getInstructions() != null ? req.getInstructions() : "Take as directed.")
                .status("ACTIVE")
                .build();
        medicationRepository.save(medication);

        auditLogService.log(req.getDoctorId() != null ? req.getDoctorId() : "Doctor", "DOCTOR", "MEDICATION_CREATED",
                medication.getPatientHealthId(),
                "Added active medication " + medication.getMedicationName() + " (" + medication.getDosage() + ", " + medication.getFrequency() + ").");

        return ApiResponse.ok("Medication " + medication.getMedicationName() + " added successfully.")
                .with("medication", toPublic(medication));
    }

    @Transactional
    public ApiResponse updateMedication(String id, UpdateMedicationRequest req) {
        PatientMedication med = medicationRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Medication record not found."));

        if (!isBlank(req.getDosage())) med.setDosage(req.getDosage().trim());
        if (req.getUnit() != null) med.setUnit(req.getUnit());
        if (!isBlank(req.getFrequency())) med.setFrequency(req.getFrequency().trim());
        if (req.getRoute() != null) med.setRoute(req.getRoute());
        if (req.getTiming() != null) med.setTiming(req.getTiming());
        if (req.getEndDate() != null) med.setEndDate(parseDateOr(req.getEndDate(), med.getEndDate()));
        if (req.getDuration() != null) med.setDuration(req.getDuration());
        if (req.getIndication() != null) med.setIndication(req.getIndication());
        if (req.getInstructions() != null) med.setInstructions(req.getInstructions());
        medicationRepository.save(med);

        Doctor doctor = med.getDoctorId() != null ? doctorRepository.findById(med.getDoctorId()).orElse(null) : null;
        auditLogService.log(req.getDoctorId() != null ? req.getDoctorId() : (doctor != null ? doctor.getName() : "Doctor"),
                "DOCTOR", "MEDICATION_UPDATED", med.getPatientHealthId(),
                "Updated medication " + med.getMedicationName() + " (" + med.getDosage() + ", " + med.getFrequency() + ").");

        return ApiResponse.ok("Medication " + med.getMedicationName() + " updated.").with("medication", toPublic(med));
    }

    @Transactional
    public ApiResponse discontinueMedication(String id, DiscontinueMedicationRequest req) {
        if (isBlank(req.getDiscontinuationReason())) {
            throw ApiException.badRequest("Discontinuation Reason is mandatory when stopping a medication.");
        }
        PatientMedication med = medicationRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Medication record not found."));

        String safeDoctorName = req.getDoctorName() != null ? req.getDoctorName()
                : (req.getDoctorId() != null ? req.getDoctorId() : "Attending Physician");

        med.setStatus("DISCONTINUED");
        med.setDiscontinuedAt(java.time.LocalDateTime.now());
        med.setDiscontinuedBy(safeDoctorName);
        med.setDiscontinuationReason(req.getDiscontinuationReason().trim());
        medicationRepository.save(med);

        auditLogService.log(safeDoctorName, "DOCTOR", "MEDICATION_DISCONTINUED", med.getPatientHealthId(),
                "Discontinued medication " + med.getMedicationName() + ". Reason: " + med.getDiscontinuationReason() + ".");

        return ApiResponse.ok("Medication " + med.getMedicationName() + " discontinued.").with("medication", toPublic(med));
    }

    @Transactional
    public ApiResponse logDose(LogDoseRequest req) {
        if (isBlank(req.getPatientId()) || isBlank(req.getMedicationId()) || isBlank(req.getStatus())) {
            throw ApiException.badRequest("patientId, medicationId, and status are required.");
        }
        if (!LOGGABLE_STATUSES.contains(req.getStatus())) {
            throw ApiException.badRequest("Status must be TAKEN, MISSED, or SKIPPED.");
        }
        PatientMedication med = medicationRepository.findById(req.getMedicationId())
                .orElseThrow(() -> ApiException.notFound("Medication record not found."));

        LocalDate scheduledDate = !isBlank(req.getScheduledDate()) ? parseDateOr(req.getScheduledDate(), LocalDate.now()) : LocalDate.now();
        MedicationDoseLog doseLog = doseLogRepository.findByMedicationIdAndScheduledDate(med.getId(), scheduledDate).orElse(null);
        if (doseLog == null) {
            doseLog = MedicationDoseLog.builder()
                    .id("dose_" + System.currentTimeMillis())
                    .medicationId(med.getId())
                    .patientId(med.getPatientId())
                    .patientHealthId(med.getPatientHealthId())
                    .medicationName(med.getMedicationName())
                    .scheduledDate(scheduledDate)
                    .build();
        }
        doseLog.setScheduledTime(!isBlank(req.getScheduledTime()) ? req.getScheduledTime() : "Today Dose");
        doseLog.setStatus(req.getStatus());
        doseLog.setActualTime(java.time.LocalDateTime.now());
        doseLogRepository.save(doseLog);

        auditLogService.log(req.getPatientId(), "PATIENT", "MEDICATION_DOSE_MARKED_" + req.getStatus(), med.getPatientHealthId(),
                "Patient logged dose status " + req.getStatus() + " for " + med.getMedicationName() + ".");

        return ApiResponse.ok().with("doseLog", toPublicDoseLog(doseLog))
                .with("adherenceSummary", calculateAdherence(doseLogRepository.findForPatient(med.getPatientId())));
    }

    // ---- mapping & helpers ----

    private Map<String, Object> toPublic(PatientMedication m) {
        Doctor doctor = m.getDoctorId() != null ? doctorRepository.findById(m.getDoctorId()).orElse(null) : null;
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", m.getId());
        out.put("patientId", m.getPatientId());
        out.put("patientHealthId", m.getPatientHealthId());
        out.put("prescriptionId", m.getPrescriptionId());
        out.put("doctorId", m.getDoctorId());
        out.put("doctorName", doctor != null ? doctor.getName() : "Attending Physician");
        out.put("medicationName", m.getMedicationName());
        out.put("genericName", m.getGenericName());
        out.put("dosage", m.getDosage());
        out.put("unit", m.getUnit());
        out.put("frequency", m.getFrequency());
        out.put("route", m.getRoute());
        out.put("timing", m.getTiming());
        out.put("startDate", m.getStartDate() != null ? m.getStartDate().toString() : null);
        out.put("endDate", m.getEndDate() != null ? m.getEndDate().toString() : null);
        out.put("duration", m.getDuration());
        out.put("indication", m.getIndication());
        out.put("instructions", m.getInstructions());
        out.put("status", m.getStatus());
        out.put("discontinuedAt", m.getDiscontinuedAt() != null ? m.getDiscontinuedAt().toString() : null);
        out.put("discontinuedBy", m.getDiscontinuedBy());
        out.put("discontinuationReason", m.getDiscontinuationReason());
        out.put("createdAt", m.getCreatedAt().toString());
        return out;
    }

    private Map<String, Object> toPublicDoseLog(MedicationDoseLog d) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", d.getId());
        out.put("medicationId", d.getMedicationId());
        out.put("patientId", d.getPatientId());
        out.put("patientHealthId", d.getPatientHealthId());
        out.put("medicationName", d.getMedicationName());
        out.put("scheduledDate", d.getScheduledDate().toString());
        out.put("scheduledTime", d.getScheduledTime());
        out.put("actualTime", d.getActualTime() != null ? d.getActualTime().toString() : null);
        out.put("status", d.getStatus());
        out.put("createdAt", d.getCreatedAt().toString());
        return out;
    }

    private Map<String, Object> calculateAdherence(List<MedicationDoseLog> logs) {
        String todayStr = LocalDate.now().toString();
        String sevenDaysAgoStr = LocalDate.now().minusDays(7).toString();

        List<MedicationDoseLog> todayLogs = logs.stream().filter(l -> todayStr.equals(l.getScheduledDate().toString())).toList();
        long todayTaken = todayLogs.stream().filter(l -> "TAKEN".equals(l.getStatus())).count();
        int todayTotal = Math.max(todayLogs.size(), 1);
        int todayPercentage = (int) Math.round((todayTaken * 100.0) / todayTotal);

        List<MedicationDoseLog> last7Logs = logs.stream()
                .filter(l -> l.getScheduledDate().toString().compareTo(sevenDaysAgoStr) >= 0).toList();
        long last7Taken = last7Logs.stream().filter(l -> "TAKEN".equals(l.getStatus())).count();
        int last7Total = Math.max(last7Logs.size(), 1);
        int last7Percentage = (int) Math.round((last7Taken * 100.0) / last7Total);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("todayTaken", todayTaken);
        out.put("todayTotal", todayLogs.size());
        out.put("todayPercentage", todayLogs.isEmpty() ? 100 : todayPercentage);
        out.put("last7DaysPercentage", last7Logs.isEmpty() ? 92 : last7Percentage);
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

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
