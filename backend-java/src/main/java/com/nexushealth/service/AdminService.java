package com.nexushealth.service;

import com.nexushealth.common.ApiException;
import com.nexushealth.common.ApiResponse;
import com.nexushealth.entity.*;
import com.nexushealth.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditLogService auditLogService;
    private final RecordAccessLogRepository recordAccessLogRepository;
    private final DoctorRepository doctorRepository;
    private final HospitalRepository hospitalRepository;
    private final MedicalRecordRepository medicalRecordRepository;

    public AdminService(UserRepository userRepository, PatientProfileRepository patientProfileRepository,
                         AuditLogRepository auditLogRepository, AuditLogService auditLogService,
                         RecordAccessLogRepository recordAccessLogRepository,
                         DoctorRepository doctorRepository, HospitalRepository hospitalRepository,
                         MedicalRecordRepository medicalRecordRepository) {
        this.userRepository = userRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.auditLogRepository = auditLogRepository;
        this.auditLogService = auditLogService;
        this.recordAccessLogRepository = recordAccessLogRepository;
        this.doctorRepository = doctorRepository;
        this.hospitalRepository = hospitalRepository;
        this.medicalRecordRepository = medicalRecordRepository;
    }

    public List<Map<String, Object>> getPatients() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (User u : userRepository.findAll()) {
            if (!"PATIENT".equals(u.getRole())) continue;
            PatientProfile profile = patientProfileRepository.findById(u.getId()).orElse(null);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", u.getId());
            entry.put("name", u.getName());
            entry.put("email", u.getEmail());
            entry.put("globalHealthId", profile != null ? profile.getPatientHealthId() : "N/A");
            entry.put("bloodGroup", profile != null && profile.getBloodGroup() != null ? profile.getBloodGroup() : "O+");
            entry.put("gender", u.getGender() != null ? u.getGender() : "N/A");
            entry.put("dob", u.getDateOfBirth() != null ? u.getDateOfBirth().toString() : "N/A");
            entry.put("emergencyContactName", "N/A");
            entry.put("insuranceProvider", "N/A");
            out.add(entry);
        }
        return out;
    }

    @Transactional
    public ApiResponse deletePatient(String patientUserId) {
        User user = userRepository.findById(patientUserId).orElse(null);
        if (user != null) {
            patientProfileRepository.deleteById(patientUserId);
            userRepository.delete(user);
            auditLogService.log("Developer Super Admin", "SUPER_ADMIN", "PATIENT_DELETE", null,
                    "Deleted patient account " + user.getName());
        }
        return ApiResponse.ok();
    }

    public List<Map<String, Object>> getAuditLogs() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (AuditLog log : auditLogRepository.findAllByOrderByTimestampDesc()) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", log.getId());
            entry.put("timestamp", log.getTimestamp().toString());
            entry.put("actorName", log.getActorName());
            entry.put("actorRole", log.getActorRole());
            entry.put("action", log.getAction());
            entry.put("targetPatientHealthId", log.getTargetPatientHealthId());
            entry.put("details", log.getDetails());
            entry.put("ipAddress", log.getIpAddress());
            out.add(entry);
        }
        return out;
    }

    private static final DateTimeFormatter ISO_TIMESTAMP = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public List<Map<String, Object>> getAllRecords() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (MedicalRecord r : medicalRecordRepository.findAll()) {
            Map<String, Object> extra = r.getExtra() != null ? r.getExtra() : Collections.emptyMap();
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", r.getId());
            entry.put("patientId", r.getPatientId());
            entry.put("patientHealthId", r.getPatientHealthId());
            entry.put("doctorId", r.getDoctorId());
            entry.put("date", r.getRecordDate() != null ? r.getRecordDate().toString() : null);
            entry.put("recordType", r.getRecordType());
            entry.put("title", r.getTitle());
            entry.put("diagnosis", r.getDiagnosis());
            entry.put("clinicalNotes", r.getClinicalNotes());
            entry.put("description", r.getDescription());
            entry.put("doctorName", extra.get("doctorName"));
            entry.put("hospitalName", extra.get("hospitalName"));
            entry.put("category", extra.get("category"));
            entry.put("symptoms", extra.get("symptoms"));
            entry.put("vitals", extra.get("vitals"));
            entry.put("medicines", extra.get("medicines"));
            entry.put("labResults", extra.get("labResults"));
            entry.put("doctorNotes", extra.get("doctorNotes"));
            entry.put("doctorSignature", extra.get("doctorSignature"));
            entry.put("createdAt", r.getCreatedAt() != null ? r.getCreatedAt().toString() : null);
            out.add(entry);
        }
        return out;
    }

    private Map<String, Object> toLogMap(RecordAccessLog l) {
        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("id", l.getId());
        entry.put("doctorId", l.getDoctorId());
        entry.put("doctorName", l.getDoctorName());
        entry.put("patientId", l.getPatientId());
        entry.put("patientHealthId", l.getPatientHealthId());
        entry.put("patientName", l.getPatientName());
        entry.put("hospitalId", l.getHospitalId());
        entry.put("hospitalName", l.getHospitalName());
        entry.put("accessMethod", l.getAccessMethod());
        entry.put("accessStatus", l.getAccessStatus());
        entry.put("timestamp", l.getTimestamp() != null ? l.getTimestamp().format(ISO_TIMESTAMP) : null);
        entry.put("reason", l.getReason());
        entry.put("appointmentId", l.getAppointmentId());
        entry.put("accessCardId", null);
        entry.put("recordsAccessed", l.getRecordsAccessed());
        entry.put("emergencyFlag", Boolean.TRUE.equals(l.getEmergencyFlag()));
        entry.put("verificationMethod", l.getVerificationMethod());
        entry.put("verificationStatus", l.getVerificationStatus());
        entry.put("denialReason", l.getDenialReason());
        entry.put("ipAddress", l.getIpAddress());
        entry.put("sessionId", l.getSessionId());
        return entry;
    }

    public List<Map<String, Object>> getRecordAccessLogs(String hospitalId, String doctorId, String patientId,
                                                          String accessMethod, String accessStatus,
                                                          String emergencyFlag, String search) {
        List<RecordAccessLog> list = recordAccessLogRepository.findAllByOrderByTimestampDesc();
        List<RecordAccessLog> filtered = new ArrayList<>();
        for (RecordAccessLog l : list) {
            if (hospitalId != null && !"ALL".equals(hospitalId) && !hospitalId.equals(l.getHospitalId())) continue;
            if (doctorId != null && !"ALL".equals(doctorId) && !doctorId.equals(l.getDoctorId())) continue;
            if (patientId != null && !"ALL".equals(patientId)
                    && !patientId.equals(l.getPatientId()) && !patientId.equals(l.getPatientHealthId())) continue;
            if (accessMethod != null && !"ALL".equals(accessMethod) && !accessMethod.equals(l.getAccessMethod())) continue;
            if (accessStatus != null && !"ALL".equals(accessStatus) && !accessStatus.equals(l.getAccessStatus())) continue;
            if (emergencyFlag != null && !"ALL".equals(emergencyFlag)) {
                boolean isEmerg = "true".equals(String.valueOf(emergencyFlag));
                if (Boolean.TRUE.equals(l.getEmergencyFlag()) != isEmerg) continue;
            }
            if (search != null && search.trim().length() > 0) {
                String q = search.trim().toLowerCase();
                boolean match =
                        (l.getDoctorName() != null && l.getDoctorName().toLowerCase().contains(q)) ||
                        (l.getPatientName() != null && l.getPatientName().toLowerCase().contains(q)) ||
                        (l.getPatientHealthId() != null && l.getPatientHealthId().toLowerCase().contains(q)) ||
                        (l.getHospitalName() != null && l.getHospitalName().toLowerCase().contains(q)) ||
                        (l.getReason() != null && l.getReason().toLowerCase().contains(q)) ||
                        (l.getId() != null && l.getId().toLowerCase().contains(q));
                if (!match) continue;
            }
            filtered.add(l);
        }
        return filtered.stream().map(this::toLogMap).collect(Collectors.toList());
    }

    public Map<String, Object> getRecordAccessLogDetail(String id) {
        RecordAccessLog log = recordAccessLogRepository.findById(id).orElse(null);
        if (log == null) {
            throw ApiException.notFound("Audit access log entry not found.");
        }

        Map<String, Object> doctor = new LinkedHashMap<>();
        Doctor d = log.getDoctorId() != null ? doctorRepository.findById(log.getDoctorId()).orElse(null) : null;
        if (d != null) {
            doctor.put("id", d.getId());
            doctor.put("name", d.getName());
            doctor.put("specialization", d.getSpecialization());
        } else {
            doctor.put("id", log.getDoctorId());
            doctor.put("name", log.getDoctorName());
            doctor.put("specialization", "General Medicine");
        }

        Map<String, Object> hospital = new LinkedHashMap<>();
        Hospital h = log.getHospitalId() != null ? hospitalRepository.findById(log.getHospitalId()).orElse(null) : null;
        if (h != null) {
            hospital.put("id", h.getId());
            hospital.put("name", h.getName());
            hospital.put("licenseNumber", h.getLicenseNumber());
        } else {
            hospital.put("id", log.getHospitalId());
            hospital.put("name", log.getHospitalName());
            hospital.put("licenseNumber", "HOSP-2026-REG");
        }

        PatientProfile profile = null;
        if (log.getPatientHealthId() != null) {
            profile = patientProfileRepository.findByPatientHealthId(log.getPatientHealthId()).orElse(null);
        }
        if (profile == null && log.getPatientId() != null) {
            profile = patientProfileRepository.findById(log.getPatientId()).orElse(null);
        }

        String bloodGroup = "O+";
        String gender = "N/A";
        if (profile != null) {
            if (profile.getBloodGroup() != null) bloodGroup = profile.getBloodGroup();
        }
        if (log.getPatientId() != null) {
            User u = userRepository.findById(log.getPatientId()).orElse(null);
            if (u != null && u.getGender() != null) gender = u.getGender();
        }

        Map<String, Object> patient = new LinkedHashMap<>();
        patient.put("userId", log.getPatientId());
        patient.put("globalHealthId", log.getPatientHealthId());
        patient.put("name", log.getPatientName());
        patient.put("bloodGroup", bloodGroup);
        patient.put("gender", gender);

        Map<String, Object> relationshipTrace = new LinkedHashMap<>();
        relationshipTrace.put("doctor", doctor);
        relationshipTrace.put("hospital", hospital);
        relationshipTrace.put("patient", patient);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("log", toLogMap(log));
        out.put("relationshipTrace", relationshipTrace);
        return out;
    }

    public Map<String, Object> getAuditStatistics() {
        List<RecordAccessLog> logs = recordAccessLogRepository.findAllByOrderByTimestampDesc();

        int totalAccesses = logs.size();
        int successfulAccesses = 0, deniedAccesses = 0, emergencyAccesses = 0;
        int appointmentAccesses = 0, cardAccesses = 0, biometricAccesses = 0;
        int faceScanAccesses = 0, patientIdAccesses = 0;

        for (RecordAccessLog l : logs) {
            if ("SUCCESS".equals(l.getAccessStatus())) successfulAccesses++;
            if ("DENIED".equals(l.getAccessStatus())) deniedAccesses++;
            if (Boolean.TRUE.equals(l.getEmergencyFlag()) || "EMERGENCY".equals(l.getAccessMethod())) emergencyAccesses++;
            if ("APPOINTMENT".equals(l.getAccessMethod())) appointmentAccesses++;
            if ("ACCESS_CARD".equals(l.getAccessMethod())) cardAccesses++;
            if ("BIOMETRIC".equals(l.getAccessMethod())) biometricAccesses++;
            if ("FACE_SCAN".equals(l.getAccessMethod())) faceScanAccesses++;
            if ("PATIENT_ID".equals(l.getAccessMethod())) patientIdAccesses++;
        }

        Map<String, Map<String, Object>> hospitalMap = new LinkedHashMap<>();
        for (Hospital h : hospitalRepository.findAll()) {
            Map<String, Object> e = new LinkedHashMap<>();
            e.put("hospitalId", h.getId());
            e.put("hospitalName", h.getName());
            e.put("totalAccesses", 0);
            e.put("successCount", 0);
            e.put("deniedCount", 0);
            e.put("emergencyCount", 0);
            hospitalMap.put(h.getId(), e);
        }
        for (RecordAccessLog l : logs) {
            Map<String, Object> e = hospitalMap.get(l.getHospitalId());
            if (e == null) {
                e = new LinkedHashMap<>();
                e.put("hospitalId", l.getHospitalId());
                e.put("hospitalName", l.getHospitalName());
                e.put("totalAccesses", 0);
                e.put("successCount", 0);
                e.put("deniedCount", 0);
                e.put("emergencyCount", 0);
                hospitalMap.put(l.getHospitalId(), e);
            }
            e.put("totalAccesses", (Integer) e.get("totalAccesses") + 1);
            if ("SUCCESS".equals(l.getAccessStatus())) e.put("successCount", (Integer) e.get("successCount") + 1);
            if ("DENIED".equals(l.getAccessStatus())) e.put("deniedCount", (Integer) e.get("deniedCount") + 1);
            if (Boolean.TRUE.equals(l.getEmergencyFlag()) || "EMERGENCY".equals(l.getAccessMethod()))
                e.put("emergencyCount", (Integer) e.get("emergencyCount") + 1);
        }

        Map<String, Map<String, Object>> doctorMap = new LinkedHashMap<>();
        for (RecordAccessLog l : logs) {
            Map<String, Object> e = doctorMap.get(l.getDoctorId());
            if (e == null) {
                e = new LinkedHashMap<>();
                e.put("doctorId", l.getDoctorId());
                e.put("doctorName", l.getDoctorName());
                e.put("hospitalId", l.getHospitalId());
                e.put("hospitalName", l.getHospitalName());
                e.put("totalAccesses", 0);
                e.put("emergencyCount", 0);
                e.put("deniedCount", 0);
                doctorMap.put(l.getDoctorId(), e);
            }
            e.put("totalAccesses", (Integer) e.get("totalAccesses") + 1);
            if (Boolean.TRUE.equals(l.getEmergencyFlag()) || "EMERGENCY".equals(l.getAccessMethod()))
                e.put("emergencyCount", (Integer) e.get("emergencyCount") + 1);
            if ("DENIED".equals(l.getAccessStatus())) e.put("deniedCount", (Integer) e.get("deniedCount") + 1);
        }

        List<RecordAccessLog> suspicious = logs.stream()
                .filter(l -> "DENIED".equals(l.getAccessStatus())
                        || Boolean.TRUE.equals(l.getEmergencyFlag())
                        || (l.getDenialReason() != null && l.getDenialReason().length() > 0))
                .collect(Collectors.toList());

        List<Map<String, Object>> recentSuspicious = new ArrayList<>();
        int limit = Math.min(10, suspicious.size());
        for (int i = 0; i < limit; i++) {
            recentSuspicious.add(toLogMap(suspicious.get(i)));
        }

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalAccesses", totalAccesses);
        stats.put("successfulAccesses", successfulAccesses);
        stats.put("deniedAccesses", deniedAccesses);
        stats.put("emergencyAccesses", emergencyAccesses);
        stats.put("appointmentAccesses", appointmentAccesses);
        stats.put("cardAccesses", cardAccesses);
        stats.put("biometricAccesses", biometricAccesses);
        stats.put("faceScanAccesses", faceScanAccesses);
        stats.put("patientIdAccesses", patientIdAccesses);
        stats.put("accessesByHospital", new ArrayList<>(hospitalMap.values()));
        stats.put("accessesByDoctor", new ArrayList<>(doctorMap.values()));
        stats.put("suspiciousActivitiesCount", suspicious.size());
        stats.put("recentSuspiciousActivities", recentSuspicious);
        return stats;
    }
}
