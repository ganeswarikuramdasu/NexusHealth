package com.nexushealth.service;

import com.nexushealth.common.ApiException;
import com.nexushealth.common.ApiResponse;
import com.nexushealth.common.PasswordValidator;
import com.nexushealth.dto.admin.AdminRequests.AddHospitalRequest;
import com.nexushealth.dto.hospital.HospitalRequests.AddEquipmentRequest;
import com.nexushealth.entity.Doctor;
import com.nexushealth.entity.Hospital;
import com.nexushealth.entity.MedicalRecord;
import com.nexushealth.entity.RecordAccessLog;
import com.nexushealth.entity.User;
import com.nexushealth.repository.DoctorRepository;
import com.nexushealth.repository.HospitalRepository;
import com.nexushealth.repository.MedicalRecordRepository;
import com.nexushealth.repository.RecordAccessLogRepository;
import com.nexushealth.repository.UserRepository;
import com.nexushealth.service.store.EquipmentStore;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class HospitalService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final HospitalRepository hospitalRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final EquipmentStore equipmentStore;
    private final RecordAccessLogRepository recordAccessLogRepository;
    private final MedicalRecordRepository medicalRecordRepository;

    public HospitalService(HospitalRepository hospitalRepository, DoctorRepository doctorRepository,
                            UserRepository userRepository, PasswordEncoder passwordEncoder,
                            AuditLogService auditLogService, EquipmentStore equipmentStore,
                            RecordAccessLogRepository recordAccessLogRepository,
                            MedicalRecordRepository medicalRecordRepository) {
        this.hospitalRepository = hospitalRepository;
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
        this.equipmentStore = equipmentStore;
        this.recordAccessLogRepository = recordAccessLogRepository;
        this.medicalRecordRepository = medicalRecordRepository;
    }

    /** GET /api/hospitals - the frontend expects a raw array, not wrapped in {success,...}. */
    public List<Map<String, Object>> list() {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Hospital h : hospitalRepository.findAllByOrderByCreatedAtDesc()) {
            out.add(toPublic(h));
        }
        return out;
    }

    /**
     * Super Admin directly provisions a hospital - immediately ACTIVE, no
     * approval step (unlike the self-service flow this replaces). This is
     * the only way hospitals get created in this app: POST
     * /api/admin/add-hospital, called from the Super Admin panel.
     */
    @Transactional
    public ApiResponse addHospital(AddHospitalRequest req) {
        if (isBlank(req.getName()) || isBlank(req.getEmail()) || isBlank(req.getPassword())) {
            throw ApiException.badRequest("Hospital Name, Admin Email, and Initial Password are required.");
        }
        PasswordValidator.Result pwdCheck = PasswordValidator.validate(req.getPassword());
        if (!pwdCheck.valid()) {
            throw ApiException.badRequest("Weak Password: " + pwdCheck.message());
        }

        String cleanEmail = req.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(cleanEmail)) {
            throw ApiException.badRequest("An account with email '" + req.getEmail() + "' is already registered.");
        }

        int totalBeds = req.getTotalBeds() != null ? req.getTotalBeds() : 150;
        long now = System.currentTimeMillis();
        String hospitalId = "hosp_" + now;
        String userId = "u_hosp_" + now;
        String licenseNumber = req.getLicenseNumber() != null ? req.getLicenseNumber()
                : "HOSP-2026-" + (10000 + RANDOM.nextInt(90000));

        Map<String, Object> extra = new LinkedHashMap<>();
        extra.put("departments", List.of("General Medicine", "Emergency ER", "Cardiology", "Pediatrics"));
        extra.put("departmentStatuses", new LinkedHashMap<>());

        Hospital hospital = Hospital.builder()
                .id(hospitalId)
                .adminUserId(userId)
                .name(req.getName().trim())
                .email(cleanEmail)
                .phone(req.getPhone() != null ? req.getPhone() : "+91 11 4000 8000")
                .address(req.getAddress() != null ? req.getAddress() : "Main Medical Sector, Healthcare City")
                .licenseNumber(licenseNumber)
                .totalBeds(totalBeds)
                .availableBeds((int) Math.floor(totalBeds * 0.3))
                .status("APPROVED")
                .extra(extra)
                .build();
        hospitalRepository.save(hospital);

        User user = User.builder()
                .id(userId)
                .name(hospital.getName())
                .email(cleanEmail)
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .role("HOSPITAL_ADMIN")
                .status("ACTIVE")
                .build();
        userRepository.save(user);

        auditLogService.log("Super Administrator", "SUPER_ADMIN", "HOSPITAL_PROVISIONED", null,
                "Super Admin provisioned hospital " + hospital.getName() + " (" + cleanEmail + ")");

        return ApiResponse.ok("Hospital '" + hospital.getName() + "' provisioned and activated successfully! " +
                        "Admin can log in using '" + cleanEmail + "'.")
                .with("hospital", toPublic(hospital));
    }

    @Transactional
    public ApiResponse toggleStatus(com.nexushealth.dto.hospital.HospitalRequests.ToggleHospitalStatusRequest req) {
        Hospital hospital = findHospitalOrThrow(req.getHospitalId());
        String newStatus = ("INACTIVE".equals(req.getStatus()) || "ACTIVE".equals(req.getStatus()))
                ? req.getStatus()
                : ("INACTIVE".equals(hospital.getStatus()) ? "ACTIVE" : "INACTIVE");
        hospital.setStatus(newStatus);
        hospitalRepository.save(hospital);

        // Cascade: doctors follow the hospital's active/inactive state.
        List<Doctor> doctors = doctorRepository.findByHospitalId(hospital.getId());
        for (Doctor d : doctors) {
            d.setIsActive("ACTIVE".equals(newStatus));
        }
        doctorRepository.saveAll(doctors);

        auditLogService.log(hospital.getName(), "HOSPITAL_ADMIN", "HOSPITAL_STATUS_TOGGLE", null,
                "Hospital status changed to " + newStatus + ". Doctor cascade updated.");

        return ApiResponse.ok("Hospital status set to " + newStatus + ".").with("hospital", toPublic(hospital));
    }

    @Transactional
    public ApiResponse toggleDepartment(com.nexushealth.dto.hospital.HospitalRequests.ToggleDepartmentRequest req) {
        Hospital hospital = findHospitalOrThrow(req.getHospitalId());
        Map<String, Object> extra = new LinkedHashMap<>(hospital.getExtra());
        @SuppressWarnings("unchecked")
        Map<String, Object> departmentStatuses = extra.get("departmentStatuses") instanceof Map
                ? new LinkedHashMap<>((Map<String, Object>) extra.get("departmentStatuses"))
                : new LinkedHashMap<>();

        String current = String.valueOf(departmentStatuses.getOrDefault(req.getDepartmentName(), "ACTIVE"));
        String nextStatus = req.getStatus() != null ? req.getStatus() : ("ACTIVE".equals(current) ? "INACTIVE" : "ACTIVE");
        departmentStatuses.put(req.getDepartmentName(), nextStatus);
        extra.put("departmentStatuses", departmentStatuses);
        hospital.setExtra(extra);
        hospitalRepository.save(hospital);

        auditLogService.log(hospital.getName(), "HOSPITAL_ADMIN", "DEPARTMENT_STATUS_TOGGLE", null,
                "Department '" + req.getDepartmentName() + "' status set to " + nextStatus);

        return ApiResponse.ok("Department '" + req.getDepartmentName() + "' is now " + nextStatus + ".")
                .with("departmentStatuses", departmentStatuses);
    }

    @Transactional
    public ApiResponse updateSettings(com.nexushealth.dto.hospital.HospitalRequests.UpdateHospitalSettingsRequest req) {
        Hospital hospital = findHospitalOrThrow(req.getHospitalId());
        User adminUser = hospital.getAdminUserId() != null ? userRepository.findById(hospital.getAdminUserId()).orElse(null) : null;

        if (!isBlank(req.getPhone())) hospital.setPhone(req.getPhone().trim());
        if (!isBlank(req.getAddress())) hospital.setAddress(req.getAddress().trim());
        if (!isBlank(req.getEmergencyPhone())) {
            Map<String, Object> extra = new LinkedHashMap<>(hospital.getExtra());
            extra.put("emergencyPhone", req.getEmergencyPhone().trim());
            hospital.setExtra(extra);
        }

        if (!isBlank(req.getEmail()) && !req.getEmail().trim().equalsIgnoreCase(hospital.getEmail())) {
            String cleanEmail = req.getEmail().trim().toLowerCase();
            boolean emailTaken = userRepository.findByEmailIgnoreCase(cleanEmail)
                    .map(u -> !u.getId().equals(hospital.getAdminUserId())).orElse(false);
            if (emailTaken) {
                throw ApiException.badRequest("This email address is already in use by another account.");
            }
            hospital.setEmail(cleanEmail);
            if (adminUser != null) adminUser.setEmail(cleanEmail);
        }

        if (!isBlank(req.getNewPassword())) {
            PasswordValidator.Result pwdCheck = PasswordValidator.validate(req.getNewPassword().trim());
            if (!pwdCheck.valid()) {
                throw ApiException.badRequest("Password Error: " + pwdCheck.message());
            }
            if (adminUser != null) adminUser.setPasswordHash(passwordEncoder.encode(req.getNewPassword().trim()));
        }

        hospitalRepository.save(hospital);
        if (adminUser != null) userRepository.save(adminUser);

        auditLogService.log(hospital.getName(), "HOSPITAL_ADMIN", "HOSPITAL_SETTINGS_UPDATED", null,
                "Updated settings and security credentials for hospital " + hospital.getName());

        return ApiResponse.ok("Hospital settings and security credentials updated successfully!")
                .with("hospital", toPublic(hospital));
    }

    @Transactional
    public ApiResponse approveHospital(com.nexushealth.dto.admin.AdminRequests.ApproveHospitalRequest req) {
        Hospital hospital = hospitalRepository.findById(req.getHospitalId())
                .orElseThrow(() -> ApiException.notFound("Hospital not found."));
        if ("APPROVE".equals(req.getAction())) {
            hospital.setStatus("APPROVED");
            auditLogService.log("Super Administrator", "SUPER_ADMIN", "HOSPITAL_APPROVAL", null,
                    "Super Admin APPROVED hospital " + hospital.getName());
        } else {
            hospital.setStatus("REJECTED");
            auditLogService.log("Super Administrator", "SUPER_ADMIN", "HOSPITAL_REJECTION", null,
                    "Super Admin REJECTED hospital " + hospital.getName());
        }
        hospitalRepository.save(hospital);
        return ApiResponse.ok().with("hospital", toPublic(hospital));
    }

    @Transactional
    public ApiResponse deleteHospital(String hospitalId) {
        Hospital hospital = hospitalRepository.findById(hospitalId).orElse(null);
        if (hospital != null) {
            hospitalRepository.delete(hospital);
            List<Doctor> affected = doctorRepository.findByHospitalId(hospitalId);
            for (Doctor d : affected) {
                d.setHospitalId(null);
                d.setHospitalName("Unattached Independent Practice");
                d.setStatus("PENDING_APPROVAL");
            }
            doctorRepository.saveAll(affected);
            auditLogService.log("Developer Super Admin", "SUPER_ADMIN", "HOSPITAL_DELETE", null,
                    "Deactivated hospital " + hospital.getName() + ". Attached doctors reset to PENDING_APPROVAL.");
        }
        return ApiResponse.ok();
    }

    @Transactional
    public ApiResponse editHospital(com.nexushealth.dto.admin.AdminRequests.EditHospitalRequest req) {
        Hospital hospital = hospitalRepository.findById(req.getHospitalId())
                .orElseThrow(() -> ApiException.notFound("Hospital not found."));

        if (!isBlank(req.getName())) hospital.setName(req.getName().trim());
        if (!isBlank(req.getEmail())) hospital.setEmail(req.getEmail().trim().toLowerCase());
        if (!isBlank(req.getLicenseNumber())) hospital.setLicenseNumber(req.getLicenseNumber().trim());
        if (!isBlank(req.getAddress())) hospital.setAddress(req.getAddress().trim());
        if (!isBlank(req.getPhone())) hospital.setPhone(req.getPhone().trim());
        if (req.getTotalBeds() != null) hospital.setTotalBeds(req.getTotalBeds());
        if (req.getAvailableBeds() != null) hospital.setAvailableBeds(req.getAvailableBeds());
        if (!isBlank(req.getStatus())) hospital.setStatus(req.getStatus().trim());
        hospitalRepository.save(hospital);

        if (hospital.getAdminUserId() != null) {
            userRepository.findById(hospital.getAdminUserId()).ifPresent(u -> {
                u.setName(hospital.getName());
                u.setEmail(hospital.getEmail());
                userRepository.save(u);
            });
        }

        auditLogService.log("Super Administrator", "SUPER_ADMIN", "HOSPITAL_EDIT", null,
                "Super Admin updated hospital details for " + hospital.getName());

        return ApiResponse.ok("Hospital '" + hospital.getName() + "' updated successfully!")
                .with("hospital", toPublic(hospital));
    }

    public Hospital findHospitalOrThrow(String hospitalIdOrAdminUserId) {
        Hospital hospital = hospitalRepository.findById(hospitalIdOrAdminUserId).orElse(null);
        if (hospital == null) hospital = hospitalRepository.findByAdminUserId(hospitalIdOrAdminUserId).orElse(null);
        if (hospital == null) throw ApiException.notFound("Hospital not found.");
        return hospital;
    }

    /** Flattens the fixed columns + `extra` JSON into one map, matching the Node object shape exactly. */
    public Map<String, Object> toPublic(Hospital h) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", h.getId());
        out.put("userId", h.getAdminUserId());
        out.put("name", h.getName());
        out.put("email", h.getEmail());
        out.put("licenseNumber", h.getLicenseNumber());
        out.put("address", h.getAddress());
        out.put("phone", h.getPhone());
        out.put("totalBeds", h.getTotalBeds());
        out.put("availableBeds", h.getAvailableBeds());
        out.put("status", h.getStatus());
        if (h.getExtra() != null) out.putAll(h.getExtra());
        return out;
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    // ── Hospital isolation guard ──────────────────────────────────────

    private void enforceHospitalIsolation(String callerHospitalId, String requestedHospitalId) {
        if (!isBlank(callerHospitalId) && !isBlank(requestedHospitalId)
                && !callerHospitalId.equals(requestedHospitalId)
                && !"SUPER_ADMIN".equals(callerHospitalId)) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Forbidden: Hospital Admin is strictly restricted to accessing records belonging to their own hospital.");
        }
    }

    // ── Equipment endpoints ───────────────────────────────────────────

    public List<Map<String, Object>> getEquipment(String hospitalId) {
        return equipmentStore.forHospital(hospitalId);
    }

    @Transactional
    public ApiResponse addEquipment(AddEquipmentRequest req) {
        String hid = req.getHospitalId() != null ? req.getHospitalId() : "hosp_1";
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("hospitalId", hid);
        data.put("name", req.getName());
        data.put("category", req.getCategory());
        data.put("status", req.getStatus());
        data.put("quantity", req.getQuantity());
        data.put("location", req.getLocation());
        data.put("serialNumber", req.getSerialNumber());
        data.put("lastMaintenance", req.getLastMaintenance());

        Map<String, Object> newItem = equipmentStore.add(data);

        auditLogService.log("Hospital Admin", "HOSPITAL_ADMIN", "EQUIPMENT_ADDED", null,
                "Added " + newItem.get("quantity") + "x " + newItem.get("name")
                        + " (" + newItem.get("serialNumber") + ") in " + newItem.get("location"));

        List<Map<String, Object>> list = equipmentStore.forHospital(hid);
        return ApiResponse.ok().with("equipment", newItem).with("list", list);
    }

    // ── Audit-logs (hospital-scoped) ──────────────────────────────────

    public List<Map<String, Object>> getAuditLogs(String callerHospitalId, String requestedHospitalId,
                                                   String doctorId, String patientId,
                                                   String accessMethod, String accessStatus,
                                                   String emergencyFlag, String search) {
        enforceHospitalIsolation(callerHospitalId, requestedHospitalId);
        String targetHospitalId = !isBlank(requestedHospitalId) ? requestedHospitalId : "hosp_1";

        List<RecordAccessLog> filtered = recordAccessLogRepository.findForHospital(targetHospitalId);

        if (!isBlank(doctorId) && !"ALL".equals(doctorId)) {
            String did = doctorId.trim();
            filtered = filtered.stream()
                    .filter(l -> did.equals(l.getDoctorId()))
                    .collect(Collectors.toList());
        }
        if (!isBlank(patientId) && !"ALL".equals(patientId)) {
            String pid = patientId.trim();
            filtered = filtered.stream()
                    .filter(l -> pid.equals(l.getPatientId()) || pid.equals(l.getPatientHealthId()))
                    .collect(Collectors.toList());
        }
        if (!isBlank(accessMethod) && !"ALL".equals(accessMethod)) {
            String am = accessMethod.trim();
            filtered = filtered.stream()
                    .filter(l -> am.equals(l.getAccessMethod()))
                    .collect(Collectors.toList());
        }
        if (!isBlank(accessStatus) && !"ALL".equals(accessStatus)) {
            String as = accessStatus.trim();
            filtered = filtered.stream()
                    .filter(l -> as.equals(l.getAccessStatus()))
                    .collect(Collectors.toList());
        }
        if (!isBlank(emergencyFlag) && !"ALL".equals(emergencyFlag)) {
            boolean isEmerg = "true".equalsIgnoreCase(emergencyFlag.trim());
            filtered = filtered.stream()
                    .filter(l -> Boolean.TRUE.equals(l.getEmergencyFlag()) == isEmerg)
                    .collect(Collectors.toList());
        }
        if (!isBlank(search)) {
            String q = search.trim().toLowerCase();
            filtered = filtered.stream()
                    .filter(l -> matchesSearch(l, q))
                    .collect(Collectors.toList());
        }

        List<Map<String, Object>> out = new ArrayList<>();
        for (RecordAccessLog l : filtered) {
            out.add(recordToMap(l));
        }
        return out;
    }

    private boolean matchesSearch(RecordAccessLog l, String q) {
        return (l.getDoctorName() != null && l.getDoctorName().toLowerCase().contains(q))
                || (l.getPatientName() != null && l.getPatientName().toLowerCase().contains(q))
                || (l.getPatientHealthId() != null && l.getPatientHealthId().toLowerCase().contains(q))
                || (l.getReason() != null && l.getReason().toLowerCase().contains(q))
                || (l.getId() != null && l.getId().toLowerCase().contains(q));
    }

    private Map<String, Object> recordToMap(RecordAccessLog l) {
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
        m.put("timestamp", l.getTimestamp());
        m.put("ipAddress", l.getIpAddress());
        return m;
    }

    // ── Audit-statistics ──────────────────────────────────────────────

    public Map<String, Object> getAuditStatistics(String callerHospitalId, String requestedHospitalId) {
        enforceHospitalIsolation(callerHospitalId, requestedHospitalId);
        String targetHospitalId = !isBlank(requestedHospitalId) ? requestedHospitalId : "hosp_1";

        List<RecordAccessLog> hospLogs = recordAccessLogRepository.findForHospital(targetHospitalId);

        long totalAccesses = hospLogs.size();
        long successfulAccesses = hospLogs.stream().filter(l -> "SUCCESS".equals(l.getAccessStatus())).count();
        long deniedAccesses = hospLogs.stream().filter(l -> "DENIED".equals(l.getAccessStatus())).count();
        long emergencyAccesses = hospLogs.stream()
                .filter(l -> Boolean.TRUE.equals(l.getEmergencyFlag()) || "EMERGENCY".equals(l.getAccessMethod()))
                .count();
        long appointmentAccesses = hospLogs.stream().filter(l -> "APPOINTMENT".equals(l.getAccessMethod())).count();
        long cardAccesses = hospLogs.stream().filter(l -> "ACCESS_CARD".equals(l.getAccessMethod())).count();
        long biometricAccesses = hospLogs.stream().filter(l -> "BIOMETRIC".equals(l.getAccessMethod())).count();
        long faceScanAccesses = hospLogs.stream().filter(l -> "FACE_SCAN".equals(l.getAccessMethod())).count();

        List<Doctor> hospitalDoctors = doctorRepository.findByHospitalId(targetHospitalId);
        long totalDoctors = hospitalDoctors.size();
        long activeDoctors = hospitalDoctors.stream()
                .filter(d -> Boolean.TRUE.equals(d.getIsActive()) && "APPROVED".equals(d.getStatus()))
                .count();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("hospitalId", targetHospitalId);
        stats.put("totalAccesses", totalAccesses);
        stats.put("successfulAccesses", successfulAccesses);
        stats.put("deniedAccesses", deniedAccesses);
        stats.put("emergencyAccesses", emergencyAccesses);
        stats.put("appointmentAccesses", appointmentAccesses);
        stats.put("cardAccesses", cardAccesses);
        stats.put("biometricAccesses", biometricAccesses);
        stats.put("faceScanAccesses", faceScanAccesses);
        stats.put("totalDoctors", totalDoctors);
        stats.put("activeDoctors", activeDoctors);
        return stats;
    }

    // ── Doctor activity ───────────────────────────────────────────────

    public List<Map<String, Object>> getDoctorActivity(String callerHospitalId, String requestedHospitalId) {
        enforceHospitalIsolation(callerHospitalId, requestedHospitalId);
        String targetHospitalId = !isBlank(requestedHospitalId) ? requestedHospitalId : "hosp_1";

        List<Doctor> hospitalDoctors = doctorRepository.findByHospitalId(targetHospitalId);
        List<RecordAccessLog> allLogs = recordAccessLogRepository.findAllByOrderByTimestampDesc();

        List<Map<String, Object>> activity = new ArrayList<>();
        for (Doctor doc : hospitalDoctors) {
            List<RecordAccessLog> docLogs = allLogs.stream()
                    .filter(l -> doc.getId().equals(l.getDoctorId()) || doc.getName().equals(l.getDoctorName()))
                    .collect(Collectors.toList());

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("doctorId", doc.getId());
            entry.put("doctorName", doc.getName());
            entry.put("specialization", doc.getSpecialization());
            entry.put("department", doc.getExtra() != null ? doc.getExtra().get("department") : null);
            entry.put("status", doc.getStatus());
            entry.put("isActive", doc.getIsActive());
            entry.put("totalAccesses", docLogs.size());
            entry.put("appointmentAccesses", docLogs.stream().filter(l -> "APPOINTMENT".equals(l.getAccessMethod())).count());
            entry.put("emergencyAccesses", docLogs.stream()
                    .filter(l -> Boolean.TRUE.equals(l.getEmergencyFlag()) || "EMERGENCY".equals(l.getAccessMethod()))
                    .count());
            entry.put("cardAccesses", docLogs.stream().filter(l -> "ACCESS_CARD".equals(l.getAccessMethod())).count());
            entry.put("biometricAccesses", docLogs.stream().filter(l -> "BIOMETRIC".equals(l.getAccessMethod())).count());
            entry.put("faceScanAccesses", docLogs.stream().filter(l -> "FACE_SCAN".equals(l.getAccessMethod())).count());
            entry.put("deniedAttempts", docLogs.stream().filter(l -> "DENIED".equals(l.getAccessStatus())).count());

            List<Map<String, Object>> recent = docLogs.stream().limit(5)
                    .map(this::recordToMap).collect(Collectors.toList());
            entry.put("recentLogs", recent);

            activity.add(entry);
        }
        return activity;
    }

    // ── Doctor-specific audit logs ────────────────────────────────────

    public List<Map<String, Object>> getDoctorAuditLogs(String doctorId,
                                                         String callerHospitalId,
                                                         String requestedHospitalId) {
        Doctor doc = doctorRepository.findById(doctorId).orElse(null);

        String effectiveRequested = !isBlank(requestedHospitalId) ? requestedHospitalId
                : (doc != null && doc.getHospitalId() != null ? doc.getHospitalId() : "hosp_1");

        enforceHospitalIsolation(callerHospitalId, effectiveRequested);

        if (doc != null && !isBlank(doc.getHospitalId()) && !doc.getHospitalId().equals(effectiveRequested)
                && !"SUPER_ADMIN".equals(callerHospitalId)) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Forbidden: Physician belongs to a different hospital.");
        }

        List<RecordAccessLog> allLogs = recordAccessLogRepository.findAllByOrderByTimestampDesc();
        String docName = doc != null ? doc.getName() : null;
        List<RecordAccessLog> docLogs = allLogs.stream()
                .filter(l -> doctorId.equals(l.getDoctorId()) || (docName != null && docName.equals(l.getDoctorName())))
                .collect(Collectors.toList());

        List<Map<String, Object>> out = new ArrayList<>();
        for (RecordAccessLog l : docLogs) {
            out.add(recordToMap(l));
        }
        return out;
    }

    // ── Hospital-scoped records ───────────────────────────────────────

    public List<Map<String, Object>> getRecords(String callerHospitalId, String requestedHospitalId,
                                                 String doctorNameFilter, String doctorIdFilter,
                                                 String doctorFilter, String departmentFilter,
                                                 String deptFilter, String patientIdFilter,
                                                 String nexusHealthIdFilter, String globalHealthIdFilter,
                                                 String patientHealthIdFilter, String searchFilter) {
        enforceHospitalIsolation(callerHospitalId, requestedHospitalId);
        String targetHospitalId = !isBlank(requestedHospitalId) ? requestedHospitalId : "hosp_1";

        Hospital hospital = hospitalRepository.findById(targetHospitalId).orElse(null);
        if (hospital == null) hospital = hospitalRepository.findByAdminUserId(targetHospitalId).orElse(null);
        String hospitalName = hospital != null ? hospital.getName() : null;
        String effectiveHospId = hospital != null ? hospital.getId() : targetHospitalId;

        List<Doctor> hospitalDoctors = doctorRepository.findByHospitalId(effectiveHospId);
        Set<String> hospitalDoctorIds = hospitalDoctors.stream().map(Doctor::getId).collect(Collectors.toSet());

        List<MedicalRecord> allRecords = medicalRecordRepository.findAll();
        List<MedicalRecord> records = allRecords.stream()
                .filter(r -> {
                    if (r.getHospitalId() != null && r.getHospitalId().equals(effectiveHospId)) return true;
                    if (hospitalName != null && r.getExtra() != null) {
                        Object hn = r.getExtra().get("hospitalName");
                        if (hn != null && hospitalName.equalsIgnoreCase(String.valueOf(hn))) return true;
                    }
                    return r.getDoctorId() != null && hospitalDoctorIds.contains(r.getDoctorId());
                })
                .collect(Collectors.toList());

        // Doctor name/id filter — match doctorId directly OR resolve doctor names
        String doctorFilterValue = !isBlank(doctorNameFilter) ? doctorNameFilter
                : (!isBlank(doctorIdFilter) ? doctorIdFilter : doctorFilter);
        if (!isBlank(doctorFilterValue) && !"ALL".equals(doctorFilterValue.trim())) {
            String dLower = doctorFilterValue.trim().toLowerCase();
            List<Doctor> allDoctors = doctorRepository.findAll();
            Set<String> matchedDoctorIds = allDoctors.stream()
                    .filter(d -> d.getId().toLowerCase().equals(dLower)
                            || (d.getName() != null && d.getName().toLowerCase().contains(dLower)))
                    .map(Doctor::getId)
                    .collect(Collectors.toSet());
            records = records.stream()
                    .filter(r -> matchedDoctorIds.contains(r.getDoctorId()))
                    .collect(Collectors.toList());
        }

        // Department filter
        String deptFilterValue = !isBlank(departmentFilter) ? departmentFilter : deptFilter;
        if (!isBlank(deptFilterValue) && !"ALL".equals(deptFilterValue.trim())) {
            String depLower = deptFilterValue.trim().toLowerCase();
            List<Doctor> allDoctors = doctorRepository.findAll();
            records = records.stream()
                    .filter(r -> {
                        Doctor doc = allDoctors.stream()
                                .filter(d -> d.getId().equals(r.getDoctorId())
                                        || (r.getExtra() != null && d.getName() != null
                                            && d.getName().equals(r.getExtra().get("doctorName"))))
                                .findFirst().orElse(null);
                        String docDep = (doc != null && doc.getExtra() != null)
                                ? String.valueOf(doc.getExtra().getOrDefault("department", "")).toLowerCase() : "";
                        String recDep = (r.getExtra() != null)
                                ? String.valueOf(r.getExtra().getOrDefault("department", "")).toLowerCase() : "";
                        return docDep.contains(depLower) || recDep.contains(depLower);
                    })
                    .collect(Collectors.toList());
        }

        // Patient ID filter
        if (!isBlank(patientIdFilter) && !"ALL".equals(patientIdFilter.trim())) {
            String pLower = patientIdFilter.trim().toLowerCase();
            records = records.stream()
                    .filter(r -> r.getPatientId() != null && r.getPatientId().toLowerCase().contains(pLower))
                    .collect(Collectors.toList());
        }

        // NexusHealth / GlobalHealth / PatientHealth ID filter
        String nhFilter = !isBlank(nexusHealthIdFilter) ? nexusHealthIdFilter
                : (!isBlank(globalHealthIdFilter) ? globalHealthIdFilter : patientHealthIdFilter);
        if (!isBlank(nhFilter) && !"ALL".equals(nhFilter.trim())) {
            String nhLower = nhFilter.trim().toLowerCase();
            records = records.stream()
                    .filter(r -> r.getPatientHealthId() != null && r.getPatientHealthId().toLowerCase().contains(nhLower))
                    .collect(Collectors.toList());
        }

        // Search filter
        if (!isBlank(searchFilter)) {
            String sLower = searchFilter.trim().toLowerCase();
            records = records.stream()
                    .filter(r -> (r.getTitle() != null && r.getTitle().toLowerCase().contains(sLower))
                            || (r.getDiagnosis() != null && r.getDiagnosis().toLowerCase().contains(sLower))
                            || (r.getDoctorId() != null && r.getDoctorId().toLowerCase().contains(sLower))
                            || (r.getPatientHealthId() != null && r.getPatientHealthId().toLowerCase().contains(sLower))
                            || (r.getPatientId() != null && r.getPatientId().toLowerCase().contains(sLower)))
                    .collect(Collectors.toList());
        }

        List<Map<String, Object>> out = new ArrayList<>();
        for (MedicalRecord r : records) {
            out.add(recordToMap(r));
        }
        return out;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> recordToMap(MedicalRecord r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("patientId", r.getPatientId());
        m.put("patientHealthId", r.getPatientHealthId());
        m.put("doctorId", r.getDoctorId());
        m.put("hospitalId", r.getHospitalId());
        m.put("recordType", r.getRecordType());
        m.put("title", r.getTitle());
        m.put("diagnosis", r.getDiagnosis());
        m.put("clinicalNotes", r.getClinicalNotes());
        m.put("description", r.getDescription());
        m.put("recordDate", r.getRecordDate());
        m.put("fileUrl", r.getFileUrl());
        m.put("createdAt", r.getCreatedAt());
        if (r.getExtra() != null && !r.getExtra().isEmpty()) {
            m.putAll(r.getExtra());
        }
        return m;
    }
}
