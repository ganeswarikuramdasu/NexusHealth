package com.nexushealth.service;

import com.nexushealth.common.ApiException;
import com.nexushealth.common.ApiResponse;
import com.nexushealth.dto.medicalRecord.MedicalRecordRequests.CreateLabRequest;
import com.nexushealth.dto.medicalRecord.MedicalRecordRequests.CreateRecordRequest;
import com.nexushealth.dto.medicalRecord.MedicalRecordRequests.CreateVitalsRequest;
import com.nexushealth.entity.Doctor;
import com.nexushealth.entity.MedicalRecord;
import com.nexushealth.entity.PatientMedication;
import com.nexushealth.repository.DoctorRepository;
import com.nexushealth.repository.MedicalRecordRepository;
import com.nexushealth.repository.PatientMedicationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientMedicationRepository patientMedicationRepository;
    private final DoctorRepository doctorRepository;
    private final PatientResolver patientResolver;
    private final AuditLogService auditLogService;

    public MedicalRecordService(MedicalRecordRepository medicalRecordRepository,
                                PatientMedicationRepository patientMedicationRepository,
                                DoctorRepository doctorRepository,
                                PatientResolver patientResolver,
                                AuditLogService auditLogService) {
        this.medicalRecordRepository = medicalRecordRepository;
        this.patientMedicationRepository = patientMedicationRepository;
        this.doctorRepository = doctorRepository;
        this.patientResolver = patientResolver;
        this.auditLogService = auditLogService;
    }

    private Doctor resolveDoctor(String doctorId) {
        if (doctorId == null || doctorId.isBlank()) return null;
        return doctorRepository.findById(doctorId)
                .or(() -> doctorRepository.findByUserId(doctorId))
                .orElse(null);
    }

    private void assertApproved(Doctor doctor, String patientHealthId) {
        if (doctor != null && !"APPROVED".equals(doctor.getStatus())) {
            auditLogService.log(doctor.getName(), "DOCTOR", "CREATE_RECORD_BLOCKED",
                    patientHealthId, "Record creation blocked: Hospital approval pending");
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Action Blocked: Dr. " + doctor.getName() + "'s hospital affiliation with "
                            + (doctor.getHospitalName() != null ? doctor.getHospitalName() : "hospital")
                            + " is currently PENDING APPROVAL. Cannot issue clinical records until approved.");
        }
    }

    private void assertApprovedLab(Doctor doctor, String patientHealthId) {
        if (doctor != null && !"APPROVED".equals(doctor.getStatus())) {
            auditLogService.log(doctor != null ? doctor.getName() : "Doctor", "DOCTOR", "CREATE_LAB_BLOCKED",
                    patientHealthId, "Lab upload blocked: Hospital approval pending");
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Action Blocked: Hospital approval required before issuing lab records.");
        }
    }

    private Map<String, Object> resolvePatient(String patientHealthId) {
        PatientResolver.Resolved resolved = patientResolver.resolve(patientHealthId).orElse(null);
        Map<String, Object> result = new LinkedHashMap<>();
        if (resolved != null) {
            result.put("userId", resolved.userId);
            result.put("globalHealthId", resolved.globalHealthId);
            result.put("name", resolved.name);
        }
        return result;
    }

    private String ts() {
        return String.valueOf(System.currentTimeMillis());
    }

    private LocalDate today() {
        return LocalDate.now();
    }

    private String todayStr() {
        return today().toString();
    }

    private Map<String, Object> recordToNodeShape(MedicalRecord r, Map<String, Object> extra) {
        Map<String, Object> shape = new LinkedHashMap<>();
        shape.put("id", r.getId());
        shape.put("patientId", r.getPatientId());
        shape.put("patientHealthId", r.getPatientHealthId());
        shape.put("doctorId", r.getDoctorId());
        shape.put("date", r.getRecordDate() != null ? r.getRecordDate().toString() : null);
        shape.put("recordType", r.getRecordType());
        shape.put("title", r.getTitle());
        shape.put("diagnosis", r.getDiagnosis());
        shape.put("clinicalNotes", r.getClinicalNotes());
        shape.put("description", r.getDescription());
        if (extra != null) {
            shape.putAll(extra);
        }
        return shape;
    }

    public ApiResponse createRecord(CreateRecordRequest req) {
        Doctor doctor = resolveDoctor(req.getDoctorId());
        String patientHealthId = req.getPatientHealthId();
        assertApproved(doctor, patientHealthId);

        Map<String, Object> pRes = resolvePatient(patientHealthId);
        String patientId = pRes.containsKey("userId") ? (String) pRes.get("userId") : "u_pat_" + ts();
        String resolvedHealthId = patientHealthId;
        if (resolvedHealthId == null || resolvedHealthId.isBlank()) {
            resolvedHealthId = pRes.containsKey("globalHealthId") ? (String) pRes.get("globalHealthId") : "NH-IND-2026-00000000";
        }
        String patientName = pRes.containsKey("name") ? (String) pRes.get("name") : "Patient";

        String recId = "rec_" + ts();
        String doctorName = doctor != null ? doctor.getName() : "Attending Physician";
        String hospitalName = doctor != null && doctor.getHospitalName() != null ? doctor.getHospitalName() : "Specialty Clinic";
        String licenseOrMci = doctor != null && doctor.getLicenseNumber() != null ? doctor.getLicenseNumber() : "MCI";
        LocalDate recordDate = today();

        List<String> symptoms = req.getSymptoms();
        if (symptoms == null || symptoms.isEmpty()) {
            symptoms = new ArrayList<>();
        }

        Map<String, Object> vitals = req.getVitals();
        if (vitals == null || vitals.isEmpty()) {
            vitals = new LinkedHashMap<>();
            vitals.put("bp", "120/80 mmHg");
            vitals.put("heartRate", "72 bpm");
            vitals.put("spo2", "99%");
            vitals.put("temp", "98.6 F");
        }

        List<Map<String, Object>> medicines = req.getMedicines();
        if (medicines == null) medicines = new ArrayList<>();

        Map<String, Object> extra = new LinkedHashMap<>();
        extra.put("doctorName", doctorName);
        extra.put("hospitalName", hospitalName);
        extra.put("symptoms", symptoms);
        extra.put("vitals", vitals);
        extra.put("medicines", medicines);
        extra.put("labResults", new ArrayList<>());
        extra.put("doctorNotes", req.getDoctorNotes() != null ? req.getDoctorNotes() : "Consultation complete.");
        extra.put("doctorSignature", "DIGITAL_SIG_" + licenseOrMci + "_" + ts());

        MedicalRecord record = MedicalRecord.builder()
                .id(recId)
                .patientId(patientId)
                .patientHealthId(resolvedHealthId)
                .doctorId(doctor != null ? doctor.getId() : req.getDoctorId())
                .hospitalId(doctor != null ? doctor.getHospitalId() : null)
                .recordType("PRESCRIPTION")
                .title(req.getTitle() != null ? req.getTitle() : "Clinical Consultation")
                .diagnosis(req.getDiagnosis() != null ? req.getDiagnosis() : "General Medical Evaluation")
                .clinicalNotes(req.getDoctorNotes() != null ? req.getDoctorNotes() : "Consultation complete.")
                .recordDate(recordDate)
                .extra(extra)
                .build();

        medicalRecordRepository.save(record);

        if (!medicines.isEmpty()) {
            for (int idx = 0; idx < medicines.size(); idx++) {
                Map<String, Object> m = medicines.get(idx);
                String medName = (String) m.getOrDefault("medicationName", m.get("name"));
                if (medName == null || medName.isBlank()) continue;

                int durationDays = 30;
                Object ddRaw = m.get("durationDays");
                if (ddRaw != null) {
                    try { durationDays = Integer.parseInt(String.valueOf(ddRaw)); } catch (NumberFormatException ignored) {}
                }

                LocalDate startDate = today();
                LocalDate endDate = startDate.plusDays(durationDays);

                String instructions = (String) m.getOrDefault("instructions", m.get("notes"));
                if (instructions == null) instructions = "Take as directed.";

                PatientMedication med = PatientMedication.builder()
                        .id("med_rx_" + ts() + "_" + idx)
                        .patientId(patientId)
                        .patientHealthId(resolvedHealthId)
                        .prescriptionId(recId)
                        .doctorId(doctor != null ? doctor.getId() : req.getDoctorId())
                        .hospitalId(doctor != null ? doctor.getHospitalId() : "hosp_1")
                        .medicationName(medName)
                        .genericName((String) m.getOrDefault("genericName", ""))
                        .dosage((String) m.getOrDefault("dosage", "As prescribed"))
                        .unit((String) m.getOrDefault("unit", "mg"))
                        .frequency((String) m.getOrDefault("frequency", "Once Daily"))
                        .route((String) m.getOrDefault("route", "Oral"))
                        .timing((String) m.getOrDefault("timing", "After Meals"))
                        .startDate(startDate)
                        .endDate(endDate)
                        .duration(durationDays + " Days")
                        .indication(req.getDiagnosis() != null ? req.getDiagnosis() : "Issued E-Prescription")
                        .instructions(instructions)
                        .status("ACTIVE")
                        .build();

                patientMedicationRepository.save(med);
            }
        }

        auditLogService.log(doctorName, "DOCTOR", "RECORD_CREATE", resolvedHealthId,
                "Created prescription record " + recId + " for diagnosis: " + record.getDiagnosis());

        Map<String, Object> nodeShape = new LinkedHashMap<>();
        nodeShape.put("id", recId);
        nodeShape.put("patientId", patientId);
        nodeShape.put("patientHealthId", resolvedHealthId);
        nodeShape.put("doctorId", record.getDoctorId());
        nodeShape.put("doctorName", doctorName);
        nodeShape.put("hospitalName", hospitalName);
        nodeShape.put("date", todayStr());
        nodeShape.put("recordType", "PRESCRIPTION");
        nodeShape.put("title", record.getTitle());
        nodeShape.put("diagnosis", record.getDiagnosis());
        nodeShape.put("symptoms", symptoms);
        nodeShape.put("vitals", vitals);
        nodeShape.put("medicines", medicines);
        nodeShape.put("labResults", new ArrayList<>());
        nodeShape.put("doctorNotes", record.getClinicalNotes());
        nodeShape.put("doctorSignature", extra.get("doctorSignature"));

        return ApiResponse.ok().with("record", nodeShape);
    }

    public ApiResponse createLabRecord(CreateLabRequest req) {
        Doctor doctor = resolveDoctor(req.getDoctorId());
        String patientHealthId = req.getPatientHealthId();
        assertApprovedLab(doctor, patientHealthId);

        Map<String, Object> pRes = resolvePatient(patientHealthId);
        String patientId = pRes.containsKey("userId") ? (String) pRes.get("userId") : "u_pat_" + ts();
        String resolvedHealthId = patientHealthId;
        if (resolvedHealthId == null || resolvedHealthId.isBlank()) {
            resolvedHealthId = pRes.containsKey("globalHealthId") ? (String) pRes.get("globalHealthId") : "NH-IND-2026-00000000";
        }
        String patientName = pRes.containsKey("name") ? (String) pRes.get("name") : "";

        String displayTitle = req.getTestName() != null ? req.getTestName()
                : (req.getTitle() != null ? req.getTitle() : "Laboratory & Diagnostic Report");
        String displayLab = req.getLaboratoryName() != null ? req.getLaboratoryName()
                : (doctor != null && doctor.getHospitalName() != null ? doctor.getHospitalName() : "Central Pathology Labs");
        LocalDate displayDate = req.getTestDate() != null ? LocalDate.parse(req.getTestDate()) : today();

        String doctorName = doctor != null ? doctor.getName() : "Attending Physician";
        String licenseOrMci = doctor != null && doctor.getLicenseNumber() != null ? doctor.getLicenseNumber() : "MCI";

        Map<String, Object> extra = new LinkedHashMap<>();
        extra.put("doctorName", doctorName);
        extra.put("hospitalName", displayLab);
        extra.put("category", "LAB_REPORT");
        extra.put("testName", displayTitle);
        extra.put("testCategory", req.getTestCategory() != null ? req.getTestCategory() : "Pathology / Hematology");
        extra.put("labResults", req.getLabResults() != null ? req.getLabResults() : new ArrayList<>());
        extra.put("referenceRange", req.getReferenceRange() != null ? req.getReferenceRange() : "Standard Adult Reference");
        extra.put("attachmentUrl", req.getAttachmentUrl() != null ? req.getAttachmentUrl() : "");
        extra.put("fileName", req.getFileName() != null ? req.getFileName() : "Lab_Report.pdf");
        extra.put("fileSize", req.getFileSize() != null ? req.getFileSize() : "1.2 MB");
        extra.put("imagingCategory", req.getImagingCategory() != null ? req.getImagingCategory()
                : (req.getTestCategory() != null ? req.getTestCategory() : "Laboratory Panel"));
        extra.put("doctorNotes", req.getDoctorNotes() != null ? req.getDoctorNotes() : "Lab report uploaded and verified.");
        extra.put("doctorSignature", "DIGITAL_SIG_" + licenseOrMci + "_" + ts());
        extra.put("symptoms", List.of("Diagnostic Screening"));

        String recId = "rec_lab_" + ts();

        MedicalRecord record = MedicalRecord.builder()
                .id(recId)
                .patientId(patientId)
                .patientHealthId(resolvedHealthId)
                .doctorId(doctor != null ? doctor.getId() : req.getDoctorId())
                .hospitalId(doctor != null ? doctor.getHospitalId() : null)
                .recordType(req.getRecordType() != null ? req.getRecordType() : "LAB_REPORT")
                .title(displayTitle)
                .diagnosis(req.getDiagnosis() != null ? req.getDiagnosis() : "Diagnostic Assessment")
                .clinicalNotes(req.getDoctorNotes() != null ? req.getDoctorNotes() : "Lab report uploaded and verified.")
                .recordDate(displayDate)
                .extra(extra)
                .build();

        medicalRecordRepository.save(record);

        auditLogService.log(doctorName, "DOCTOR", "LAB_REPORT_UPLOADED", resolvedHealthId,
                "Uploaded " + record.getRecordType() + " (" + record.getTitle() + ") from " + displayLab + ".");

        Map<String, Object> nodeShape = new LinkedHashMap<>();
        nodeShape.put("id", recId);
        nodeShape.put("patientId", patientId);
        nodeShape.put("patientHealthId", resolvedHealthId);
        nodeShape.put("patientName", patientName);
        nodeShape.put("doctorId", record.getDoctorId());
        nodeShape.put("doctorName", doctorName);
        nodeShape.put("hospitalName", displayLab);
        nodeShape.put("date", displayDate.toString());
        nodeShape.put("recordType", record.getRecordType());
        nodeShape.put("category", "LAB_REPORT");
        nodeShape.put("testName", displayTitle);
        nodeShape.put("testCategory", extra.get("testCategory"));
        nodeShape.put("title", displayTitle);
        nodeShape.put("diagnosis", record.getDiagnosis());
        nodeShape.put("symptoms", extra.get("symptoms"));
        nodeShape.put("labResults", extra.get("labResults"));
        nodeShape.put("referenceRange", extra.get("referenceRange"));
        nodeShape.put("attachmentUrl", extra.get("attachmentUrl"));
        nodeShape.put("fileName", extra.get("fileName"));
        nodeShape.put("fileSize", extra.get("fileSize"));
        nodeShape.put("imagingCategory", extra.get("imagingCategory"));
        nodeShape.put("doctorNotes", record.getClinicalNotes());
        nodeShape.put("doctorSignature", extra.get("doctorSignature"));
        nodeShape.put("createdAt", record.getCreatedAt() != null ? record.getCreatedAt().toString() : null);

        return ApiResponse.ok().with("record", nodeShape);
    }

    public ApiResponse createVitals(CreateVitalsRequest req) {
        Doctor doctor = resolveDoctor(req.getDoctorId());
        String patientHealthId = req.getPatientHealthId();

        Map<String, Object> pRes = resolvePatient(patientHealthId);
        String patientId = pRes.containsKey("userId") ? (String) pRes.get("userId") : "u_pat_" + ts();
        String resolvedHealthId = patientHealthId;
        if (resolvedHealthId == null || resolvedHealthId.isBlank()) {
            resolvedHealthId = pRes.containsKey("globalHealthId") ? (String) pRes.get("globalHealthId") : "NH-IND-2026-00000000";
        }

        Map<String, Object> vitals = req.getVitals();
        if (vitals == null) vitals = new LinkedHashMap<>();

        String doctorName = doctor != null ? doctor.getName()
                : (vitals.containsKey("doctorName") ? String.valueOf(vitals.get("doctorName")) : "Attending Clinician");
        String hospitalName = doctor != null && doctor.getHospitalName() != null ? doctor.getHospitalName() : "Medical Center";
        String licenseOrMci = doctor != null && doctor.getLicenseNumber() != null ? doctor.getLicenseNumber() : "MCI";

        String vitalsDateStr = vitals.containsKey("date") ? String.valueOf(vitals.get("date")) : null;
        LocalDate vitalsDate = vitalsDateStr != null ? LocalDate.parse(vitalsDateStr) : today();
        String vitalsNotes = vitals.containsKey("notes") ? String.valueOf(vitals.get("notes")) : "Routine vital check.";

        String recId = "rec_vit_" + ts();

        Map<String, Object> extra = new LinkedHashMap<>();
        extra.put("doctorName", doctorName);
        extra.put("hospitalName", hospitalName);
        extra.put("category", "VITALS");
        extra.put("vitals", vitals);

        MedicalRecord record = MedicalRecord.builder()
                .id(recId)
                .patientId(patientId)
                .patientHealthId(resolvedHealthId)
                .doctorId(doctor != null ? doctor.getId() : req.getDoctorId())
                .hospitalId(doctor != null ? doctor.getHospitalId() : null)
                .recordType("VITALS")
                .title("Vital Signs Measurement")
                .clinicalNotes(vitalsNotes)
                .recordDate(vitalsDate)
                .extra(extra)
                .build();

        medicalRecordRepository.save(record);

        auditLogService.log(doctorName, "DOCTOR", "VITAL_CREATED", resolvedHealthId,
                "Recorded vital signs for patient.");

        Map<String, Object> nodeShape = new LinkedHashMap<>();
        nodeShape.put("id", recId);
        nodeShape.put("patientId", patientId);
        nodeShape.put("patientHealthId", resolvedHealthId);
        nodeShape.put("doctorId", record.getDoctorId());
        nodeShape.put("doctorName", doctorName);
        nodeShape.put("hospitalName", hospitalName);
        nodeShape.put("date", vitalsDate.toString());
        nodeShape.put("recordType", "VITALS");
        nodeShape.put("category", "VITALS");
        nodeShape.put("title", "Vital Signs Measurement");
        nodeShape.put("vitals", vitals);
        nodeShape.put("doctorNotes", vitalsNotes);
        nodeShape.put("doctorSignature", "DIGITAL_SIG_" + licenseOrMci + "_" + ts());
        nodeShape.put("createdAt", record.getCreatedAt() != null ? record.getCreatedAt().toString() : null);

        return ApiResponse.ok().with("record", nodeShape);
    }

    public ApiResponse getPatientRecords(String patientHealthId) {
        PatientResolver.Resolved resolved = patientResolver.resolve(patientHealthId).orElse(null);
        String targetUserId = resolved != null ? resolved.userId : patientHealthId;

        List<MedicalRecord> records = medicalRecordRepository.findForPatient(targetUserId);

        List<Map<String, Object>> shaped = records.stream().map(r -> {
            Map<String, Object> extra = r.getExtra() != null ? r.getExtra() : new LinkedHashMap<>();
            Map<String, Object> shape = new LinkedHashMap<>();
            shape.put("id", r.getId());
            shape.put("patientId", r.getPatientId());
            shape.put("patientHealthId", r.getPatientHealthId());
            shape.put("doctorId", r.getDoctorId());
            shape.put("date", r.getRecordDate() != null ? r.getRecordDate().toString() : null);
            shape.put("recordType", r.getRecordType());
            shape.put("title", r.getTitle());
            shape.put("diagnosis", r.getDiagnosis());
            shape.put("clinicalNotes", r.getClinicalNotes());
            shape.put("description", r.getDescription());

            shape.put("doctorName", extra.get("doctorName"));
            shape.put("hospitalName", extra.get("hospitalName"));
            shape.put("category", extra.get("category"));
            shape.put("symptoms", extra.get("symptoms"));
            shape.put("vitals", extra.get("vitals"));
            shape.put("medicines", extra.get("medicines"));
            shape.put("labResults", extra.get("labResults"));
            shape.put("doctorNotes", extra.get("doctorNotes"));
            shape.put("doctorSignature", extra.get("doctorSignature"));
            shape.put("testName", extra.get("testName"));
            shape.put("testCategory", extra.get("testCategory"));
            shape.put("referenceRange", extra.get("referenceRange"));
            shape.put("attachmentUrl", extra.get("attachmentUrl"));
            shape.put("fileName", extra.get("fileName"));
            shape.put("fileSize", extra.get("fileSize"));
            shape.put("imagingCategory", extra.get("imagingCategory"));
            shape.put("createdAt", r.getCreatedAt() != null ? r.getCreatedAt().toString() : null);

            return shape;
        }).collect(Collectors.toList());

        return ApiResponse.ok().with("records", shaped);
    }
}
