package com.nexushealth.service;

import com.nexushealth.common.ApiException;
import com.nexushealth.common.ApiResponse;
import com.nexushealth.common.TimeUtils;
import com.nexushealth.dto.appointment.AppointmentRequests.*;
import com.nexushealth.entity.Appointment;
import com.nexushealth.entity.Doctor;
import com.nexushealth.entity.Hospital;
import com.nexushealth.entity.PatientProfile;
import com.nexushealth.entity.User;
import com.nexushealth.repository.AppointmentRepository;
import com.nexushealth.repository.DoctorRepository;
import com.nexushealth.repository.HospitalRepository;
import com.nexushealth.repository.PatientProfileRepository;
import com.nexushealth.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class AppointmentService {

    private static final DateTimeFormatter ISO_DATE = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final Set<String> INACTIVE_STATUSES = Set.of("CANCELLED", "NO_SHOW");
    private static final Set<String> ACTIVE_QUEUE_STATUSES = Set.of(
            "SCHEDULED", "ACCEPTED", "CHECKED_IN", "WAITING_FOR_DOCTOR", "IN_CONSULTATION");

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final HospitalRepository hospitalRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final UserRepository userRepository;
    private final DoctorService doctorService;
    private final AuditLogService auditLogService;

    public AppointmentService(AppointmentRepository appointmentRepository, DoctorRepository doctorRepository,
                               HospitalRepository hospitalRepository, PatientProfileRepository patientProfileRepository,
                               UserRepository userRepository, DoctorService doctorService,
                               AuditLogService auditLogService) {
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.hospitalRepository = hospitalRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.userRepository = userRepository;
        this.doctorService = doctorService;
        this.auditLogService = auditLogService;
    }

    public List<Map<String, Object>> list(String patientId, String doctorId, String hospitalId) {
        String patientIdAlt = patientId != null
                ? patientProfileRepository.findByPatientHealthId(patientId).map(PatientProfile::getUserId).orElse(null)
                : null;
        List<Appointment> results = appointmentRepository.search(patientId, patientIdAlt, doctorId, hospitalId);
        List<Map<String, Object>> out = new ArrayList<>();
        for (Appointment a : results) out.add(toPublic(a));
        return out;
    }

    public ApiResponse availableSlots(String doctorId, String dateStr) {
        String targetDateStr = dateStr != null ? dateStr : LocalDate.now().format(ISO_DATE);
        LocalDate targetDate;
        try {
            targetDate = LocalDate.parse(targetDateStr, ISO_DATE);
        } catch (Exception e) {
            return ApiResponse.fail("Invalid date. Provide a valid date (YYYY-MM-DD).").with("slots", List.of());
        }
        LocalDate today = LocalDate.now();
        if (targetDate.isBefore(today)) {
            return ApiResponse.fail("Cannot book for a past date.").with("slots", List.of());
        }
        if (targetDate.isAfter(today.plusDays(30))) {
            return ApiResponse.fail("Cannot book beyond 30-day booking horizon.").with("slots", List.of());
        }

        Doctor doctor = doctorRepository.findById(doctorId).orElse(null);
        if (doctor == null) {
            return ApiResponse.fail("Doctor profile not found.").with("slots", List.of());
        }
        Map<String, Object> extra = doctor.getExtra();
        if (Boolean.FALSE.equals(doctor.getIsActive()) || "INACTIVE".equals(extra.get("availabilityStatus"))) {
            return ApiResponse.ok("Dr. " + doctor.getName() + " is currently INACTIVE and not accepting new appointments.")
                    .with("slots", List.of());
        }

        String dayName = targetDate.getDayOfWeek().getDisplayName(java.time.format.TextStyle.FULL, java.util.Locale.ENGLISH);
        Object weeklyScheduleObj = extra.get("weeklySchedule");
        Map<String, Object> daySchedule = asMap(weeklyScheduleObj != null ? ((Map<?, ?>) weeklyScheduleObj).get(dayName) : null);
        if (daySchedule.isEmpty() || !Boolean.TRUE.equals(daySchedule.get("active"))) {
            return ApiResponse.ok("Dr. " + doctor.getName() + " is NOT AVAILABLE on " + dayName + " (" + targetDateStr + ").")
                    .with("slots", List.of());
        }

        if (isDateInAnyRange(extra.get("leaves"), targetDateStr)) {
            return ApiResponse.ok("Dr. " + doctor.getName() + " is on leave on " + targetDateStr + ".").with("slots", List.of());
        }
        Object emergencyAbsence = extra.get("emergencyAbsence");
        if (emergencyAbsence instanceof Map<?, ?> ea && Boolean.TRUE.equals(ea.get("active"))
                && isWithinRange(targetDateStr, String.valueOf(ea.get("startDate")), String.valueOf(ea.get("endDate")))) {
            return ApiResponse.ok("Dr. " + doctor.getName() + " has declared an EMERGENCY ABSENCE on " + targetDateStr + ". New bookings blocked.")
                    .with("slots", List.of());
        }

        int slotDurationMin = intOr(extra.get("slotDurationMin"), 15);
        int slotBufferMin = intOr(extra.get("slotBufferMin"), 5);
        int tokensPerSlot = intOr(extra.get("tokensPerSlot"), 2);
        int dailyMaxLimit = intOr(extra.get("dailyMaxAppointments"), 30);

        List<Appointment> bookingsOnDate = appointmentRepository
                .findByDoctorIdAndAppointmentDateOrderByCreatedAtAsc(doctor.getId(), targetDate)
                .stream().filter(a -> !INACTIVE_STATUSES.contains(a.getStatus())).toList();

        int slDuration = intOr(daySchedule.get("slotDurationMin"), slotDurationMin);
        int startMins = TimeUtils.timeToMins(strOr(daySchedule.get("startTime"), "09:00 AM"));
        int endMins = TimeUtils.timeToMins(strOr(daySchedule.get("endTime"), "05:00 PM"));

        List<Map<String, Object>> slots = new ArrayList<>();
        while (startMins + slDuration <= endMins) {
            String slotStartStr = TimeUtils.minsToTimeStr(startMins);
            String displayWindow = TimeUtils.minsToTimeStr(startMins) + " - " + TimeUtils.minsToTimeStr(startMins + slDuration);
            boolean alreadyAdded = slots.stream().anyMatch(s -> slotStartStr.equals(s.get("startTime")));
            if (!alreadyAdded) {
                long slotBooked = bookingsOnDate.stream()
                        .filter(a -> slotStartStr.equals(TimeUtils.minsToTimeStr(a.getAppointmentTime().getHour() * 60 + a.getAppointmentTime().getMinute())))
                        .count();
                int tokensLeft = Math.max(0, tokensPerSlot - (int) slotBooked);
                boolean isFull = tokensLeft <= 0;
                boolean dailyFull = bookingsOnDate.size() >= dailyMaxLimit;

                Map<String, Object> slot = new LinkedHashMap<>();
                slot.put("timeStr", slotStartStr);
                slot.put("displayWindow", displayWindow);
                slot.put("startTime", slotStartStr);
                slot.put("endTime", TimeUtils.minsToTimeStr(startMins + slDuration));
                slot.put("status", (isFull || dailyFull) ? "FULL" : "AVAILABLE");
                slot.put("tokensLeft", tokensLeft);
                slot.put("isDisabled", isFull || dailyFull);
                slot.put("dailyLimitReached", dailyFull);
                slot.put("cutoffExpired", false);
                slot.put("slotInfo", displayWindow);
                slots.add(slot);
            }
            int nextStart = startMins + slDuration + slotBufferMin;
            if (nextStart + slDuration > endMins) break;
            startMins = nextStart;
            if (startMins >= endMins) break;
        }
        return ApiResponse.ok().with("slots", slots);
    }

    @Transactional
    public ApiResponse book(BookRequest req) {
        if (isBlank(req.getDoctorId())) {
            throw ApiException.badRequest("Please select a physician to book an appointment.");
        }
        if (isBlank(req.getAppointmentDate())) {
            throw ApiException.badRequest("Appointment Date is mandatory. Please select a valid date.");
        }
        LocalDate appointmentDate;
        try {
            appointmentDate = LocalDate.parse(req.getAppointmentDate(), ISO_DATE);
        } catch (Exception e) {
            throw ApiException.badRequest("Invalid appointment date.");
        }
        String todayStr = LocalDate.now().format(ISO_DATE);
        if (req.getAppointmentDate().compareTo(todayStr) < 0) {
            throw ApiException.badRequest("Invalid Date: Cannot book appointment for a past date (" +
                    req.getAppointmentDate() + "). Please choose today (" + todayStr + ") or a future date.");
        }

        Doctor doctor = doctorRepository.findById(req.getDoctorId()).orElse(null);
        if (doctor == null) {
            throw ApiException.notFound("Selected physician profile not found.");
        }
        Map<String, Object> extra = doctor.getExtra();
        if (Boolean.FALSE.equals(doctor.getIsActive()) || "INACTIVE".equals(extra.get("availabilityStatus"))) {
            throw new ApiException(org.springframework.http.HttpStatus.FORBIDDEN,
                    "Physician Offline: Dr. " + doctor.getName() + " is currently INACTIVE. New appointment bookings are suspended.");
        }
        if (!"APPROVED".equals(doctor.getStatus())) {
            throw new ApiException(org.springframework.http.HttpStatus.FORBIDDEN,
                    "Cannot book appointment: Dr. " + doctor.getName() + " is currently PENDING APPROVAL by " +
                            (doctor.getHospitalName() != null ? doctor.getHospitalName() : "their hospital") + ".");
        }
        Object emergencyAbsence = extra.get("emergencyAbsence");
        if (emergencyAbsence instanceof Map<?, ?> ea && Boolean.TRUE.equals(ea.get("active"))
                && isWithinRange(req.getAppointmentDate(), String.valueOf(ea.get("startDate")), String.valueOf(ea.get("endDate")))) {
            throw new ApiException(org.springframework.http.HttpStatus.FORBIDDEN,
                    "Cannot book: Dr. " + doctor.getName() + " has declared an EMERGENCY ABSENCE on " + req.getAppointmentDate() + ".");
        }
        if (isDateInAnyRange(extra.get("leaves"), req.getAppointmentDate())) {
            throw new ApiException(org.springframework.http.HttpStatus.FORBIDDEN,
                    "Cannot book: Dr. " + doctor.getName() + " is on leave on " + req.getAppointmentDate() + ".");
        }

        String resolvedHospitalId = !isBlank(req.getHospitalId()) ? req.getHospitalId() : doctor.getHospitalId();
        Hospital hospital = !isBlank(resolvedHospitalId) ? hospitalRepository.findById(resolvedHospitalId).orElse(null) : null;
        if (hospital != null && "INACTIVE".equals(hospital.getStatus())) {
            throw new ApiException(org.springframework.http.HttpStatus.FORBIDDEN, "Hospital is currently INACTIVE and cannot accept appointments.");
        }

        String targetPatientId = resolveSinglePatientId(req.getPatientId(), req.getPatientHealthId());
        if (isBlank(targetPatientId)) {
            throw ApiException.badRequest("Valid patient identity is required to book an appointment.");
        }
        String targetPatientHealthId = req.getPatientHealthId();

        int durationMin = intOr(extra.get("slotDurationMin"), 15);
        String targetSlotStr = !isBlank(req.getSlotTime()) ? req.getSlotTime() : "09:00 AM";
        String appointmentWindow = TimeUtils.buildAppointmentWindow(targetSlotStr, durationMin);
        LocalTime appointmentTime = toLocalTime(targetSlotStr);

        List<Appointment> activeExisting = appointmentRepository.findActive(doctor.getId(), Set.of(targetPatientId));
        if (!activeExisting.isEmpty()) {
            Appointment existing = activeExisting.get(0);
            throw ApiException.badRequest("Active Journey Exists: You already have an active appointment (" +
                    existing.getAppointmentDate() + " " + existing.getAppointmentTime() + ") with Dr. " + doctor.getName() +
                    ". Please cancel or complete it before booking anew.");
        }
        int dailyMaxLimit = intOr(extra.get("dailyMaxAppointments"), 30);
        long existingDaily = appointmentRepository.countOnDate(doctor.getId(), appointmentDate);
        if (existingDaily >= dailyMaxLimit) {
            throw ApiException.badRequest("Doctor's daily appointment limit (" + dailyMaxLimit + ") has been reached on " + req.getAppointmentDate() + ".");
        }
        int tokensPerSlot = intOr(extra.get("tokensPerSlot"), 2);
        long slotBookings = appointmentRepository.countOnSlot(doctor.getId(), appointmentDate, appointmentTime);
        if (slotBookings >= tokensPerSlot) {
            throw ApiException.badRequest("This time slot (" + appointmentWindow + ") is already at full capacity. Please select another slot.");
        }

        Map<String, Object> aptExtra = new LinkedHashMap<>();
        aptExtra.put("priority", req.getPriority() != null ? req.getPriority() : "NORMAL");
        aptExtra.put("queueType", "DOCTOR_QUEUE");

        Appointment appointment = Appointment.builder()
                .id("apt_" + System.currentTimeMillis())
                .patientId(targetPatientId)
                .doctorId(doctor.getId())
                .hospitalId(!isBlank(resolvedHospitalId) ? resolvedHospitalId : "hosp_gen")
                .appointmentDate(appointmentDate)
                .appointmentTime(appointmentTime)
                .reason(!isBlank(req.getSymptoms()) ? req.getSymptoms() : "Consultation request")
                .appointmentType(!isBlank(req.getAppointmentType()) ? req.getAppointmentType() : "ROUTINE_CONSULTATION")
                .status("SCHEDULED")
                .extra(aptExtra)
                .build();
        appointmentRepository.save(appointment);

        auditLogService.log(req.getPatientName() != null ? req.getPatientName() : "Patient", "PATIENT", "APPOINTMENT_BOOK",
                targetPatientHealthId, "Booked (" + appointmentWindow + ") with Dr. " + doctor.getName() + ".");

        return ApiResponse.ok().with("appointment", toPublic(appointment));
    }

    @Transactional
    public ApiResponse reschedule(RescheduleRequest req) {
        Appointment apt = requireAppointment(req.getAppointmentId());
        if (Set.of("COMPLETED", "CANCELLED", "NO_SHOW").contains(apt.getStatus())) {
            throw ApiException.badRequest("Cannot reschedule appointment with status '" + apt.getStatus() + "'.");
        }
        if (isBlank(req.getNewDate()) || isBlank(req.getNewSlotTime())) {
            throw ApiException.badRequest("New date and new slot time are required to reschedule.");
        }
        LocalDate newDate = LocalDate.parse(req.getNewDate(), ISO_DATE);
        LocalTime newTime = toLocalTime(req.getNewSlotTime());

        Doctor doctor = doctorRepository.findById(apt.getDoctorId()).orElse(null);
        if (doctor != null) {
            int tokensPerSlot = intOr(doctor.getExtra().get("tokensPerSlot"), 2);
            long existingOnSlot = appointmentRepository.countOnSlot(doctor.getId(), newDate, newTime);
            if (existingOnSlot >= tokensPerSlot) {
                throw ApiException.badRequest("Selected slot on " + req.getNewDate() + " (" + req.getNewSlotTime() + ") is already at full capacity.");
            }
        }

        String oldDate = apt.getAppointmentDate().toString();
        String oldTime = apt.getAppointmentTime().toString();
        apt.setAppointmentDate(newDate);
        apt.setAppointmentTime(newTime);
        apt.setStatus("SCHEDULED");
        Map<String, Object> extra = new LinkedHashMap<>(apt.getExtra());
        extra.put("rescheduleReason", req.getReason() != null ? req.getReason() : "Patient/Physician schedule adjustment");
        apt.setExtra(extra);
        appointmentRepository.save(apt);

        auditLogService.log("Patient", "PATIENT", "APPOINTMENT_RESCHEDULE", null,
                "Rescheduled appointment from " + oldDate + " (" + oldTime + ") to " + req.getNewDate() + " (" + req.getNewSlotTime() + ").");

        return ApiResponse.ok("Appointment rescheduled successfully to " + req.getNewDate() + " at " + req.getNewSlotTime() + ".")
                .with("appointment", toPublic(apt));
    }

    @Transactional
    public ApiResponse cancel(CancelRequest req) {
        Appointment apt = requireAppointment(req.getAppointmentId());
        apt.setStatus("CANCELLED");
        apt.setCancellationReason(!isBlank(req.getReason()) ? req.getReason() : "Cancelled by patient");
        Map<String, Object> extra = new LinkedHashMap<>(apt.getExtra());
        extra.put("cancelledBy", req.getCancelledBy() != null ? req.getCancelledBy() : "PATIENT");
        apt.setExtra(extra);
        appointmentRepository.save(apt);

        auditLogService.log("Patient", "PATIENT", "APPOINTMENT_CANCEL", null,
                "Cancelled appointment with Dr. " + apt.getDoctorId() + ". Slot released.");

        return ApiResponse.ok("Appointment cancelled and token slot released immediately.").with("appointment", toPublic(apt));
    }

    @Transactional
    public ApiResponse checkIn(CheckInRequest req) {
        Appointment apt = requireAppointment(req.getAppointmentId());
        if (!"SCHEDULED".equals(apt.getStatus())) {
            throw ApiException.badRequest("Cannot check in. Current appointment status is '" + apt.getStatus() + "'.");
        }
        apt.setStatus("WAITING_FOR_DOCTOR");
        Map<String, Object> extra = new LinkedHashMap<>(apt.getExtra());
        extra.put("queueType", "DOCTOR_QUEUE");
        extra.put("checkInTime", java.time.Instant.now().toString());
        apt.setExtra(extra);
        appointmentRepository.save(apt);

        auditLogService.log("Patient", "PATIENT", "PATIENT_CHECK_IN", null, "Checked in. Entered Doctor Live Queue.");

        return ApiResponse.ok("Checked in successfully! You are in the live doctor queue.").with("appointment", toPublic(apt));
    }

    @Transactional
    public ApiResponse updateStatus(UpdateStatusRequest req) {
        if (isBlank(req.getAppointmentId()) || isBlank(req.getStatus())) {
            throw ApiException.badRequest("appointmentId and status are required.");
        }
        Appointment apt = requireAppointment(req.getAppointmentId());

        Map<String, Object> extra = new LinkedHashMap<>(apt.getExtra());
        String queueType = String.valueOf(extra.getOrDefault("queueType", "NONE"));
        if ("IN_CONSULTATION".equals(req.getStatus())) {
            queueType = "DOCTOR_QUEUE";
            extra.putIfAbsent("consultationStartTime", java.time.Instant.now().toString());
        } else if (Set.of("TEST_REQUIRED", "WAITING_FOR_TEST").contains(req.getStatus())) {
            queueType = "INVESTIGATION_QUEUE";
        } else if (Set.of("WAITING_FOR_REVIEW", "DOCTOR_REVIEW").contains(req.getStatus())) {
            queueType = "REVIEW_QUEUE";
        } else if ("COMPLETED".equals(req.getStatus())) {
            queueType = "NONE";
            extra.put("consultationEndTime", java.time.Instant.now().toString());
        }
        extra.put("queueType", queueType);
        if ("COMPLETED".equals(req.getStatus())) {
            if (req.getPrescription() != null) extra.put("prescription", req.getPrescription());
        }
        if (Set.of("TEST_REQUIRED", "WAITING_FOR_TEST").contains(req.getStatus()) && req.getInvestigationTests() != null) {
            List<Object> tests = new ArrayList<>();
            for (Object t : req.getInvestigationTests()) {
                if (t instanceof String s) tests.add(Map.of("testName", s, "status", "PENDING"));
                else tests.add(t);
            }
            extra.put("investigationTests", tests);
        }

        apt.setStatus(req.getStatus());
        if (req.getDoctorNotes() != null) apt.setDoctorNotes(req.getDoctorNotes());
        apt.setExtra(extra);
        appointmentRepository.save(apt);

        auditLogService.log("Healthcare Provider", "DOCTOR", "APPOINTMENT_STATUS_UPDATE", null,
                "Appointment updated to " + req.getStatus() + ".");

        return ApiResponse.ok("Appointment updated to " + req.getStatus() + ".").with("appointment", toPublic(apt));
    }

    public ApiResponse liveQueue(String appointmentId) {
        Appointment apt = requireAppointment(appointmentId);
        List<Appointment> doctorQueue = appointmentRepository
                .findByDoctorIdAndAppointmentDateOrderByCreatedAtAsc(apt.getDoctorId(), apt.getAppointmentDate())
                .stream()
                .filter(a -> ACTIVE_QUEUE_STATUSES.contains(a.getStatus()))
                .toList();

        int myIndex = -1;
        for (int i = 0; i < doctorQueue.size(); i++) {
            if (doctorQueue.get(i).getId().equals(apt.getId())) { myIndex = i; break; }
        }
        int patientsAhead = Math.max(myIndex, 0);
        Map<String, Integer> typeDurationMap = Map.of(
                "ROUTINE_CONSULTATION", 15, "TELEMEDICINE", 20, "FOLLOW_UP", 10, "EMERGENCY", 30);
        int estimatedWaitMins = 0;
        for (int i = 0; i < patientsAhead; i++) {
            estimatedWaitMins += typeDurationMap.getOrDefault(doctorQueue.get(i).getAppointmentType(), 15);
        }
        int rangeLow = Math.max(5, estimatedWaitMins);
        int rangeHigh = rangeLow + 10;

        Map<String, Object> extra = apt.getExtra();
        ApiResponse response = new ApiResponse();
        response.put("appointmentId", apt.getId());
        response.put("tokenNumber", computeTokenNumber(apt));
        response.put("status", apt.getStatus());
        response.put("queueType", extra.get("queueType"));
        response.put("patientsAhead", patientsAhead);
        response.put("queuePosition", patientsAhead + 1);
        response.put("estimatedWaitTimeText", rangeLow + " - " + rangeHigh + " minutes");
        response.put("appointmentWindow", TimeUtils.buildAppointmentWindow(formatTime(apt.getAppointmentTime()), 15));
        return response;
    }

    // ---- mapping & helpers ----

    private Map<String, Object> toPublic(Appointment a) {
        Doctor doctor = doctorRepository.findById(a.getDoctorId()).orElse(null);
        User patientUser = userRepository.findById(a.getPatientId()).orElse(null);
        PatientProfile profile = patientProfileRepository.findById(a.getPatientId()).orElse(null);
        Hospital hospital = !isBlank(a.getHospitalId()) ? hospitalRepository.findById(a.getHospitalId()).orElse(null) : null;
        String slotTime = formatTime(a.getAppointmentTime());
        int hour = a.getAppointmentTime().getHour();
        String shiftName = hour >= 17 ? "Evening Shift" : (hour >= 12 ? "Afternoon Shift" : "Morning Shift");
        Map<String, Object> aExtra = a.getExtra() != null ? a.getExtra() : new LinkedHashMap<>();

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", a.getId());
        out.put("tokenNumber", computeTokenNumber(a));
        out.put("patientId", a.getPatientId());
        out.put("patientHealthId", profile != null ? profile.getPatientHealthId() : null);
        out.put("patientName", patientUser != null ? patientUser.getName() : "Patient Citizen");
        out.put("patientPhone", patientUser != null ? patientUser.getPhone() : "");
        out.put("doctorId", a.getDoctorId());
        out.put("doctorName", doctor != null ? doctor.getName() : "Attending Physician");
        out.put("hospitalId", a.getHospitalId());
        out.put("hospitalName", hospital != null ? hospital.getName() : (doctor != null ? doctor.getHospitalName() : "Specialty Hospital"));
        out.put("specialization", doctor != null ? doctor.getSpecialization() : "");
        out.put("department", doctor != null && doctor.getExtra().get("department") != null ? doctor.getExtra().get("department") : (doctor != null ? doctor.getSpecialization() : ""));
        out.put("appointmentDate", a.getAppointmentDate().toString());
        out.put("date", a.getAppointmentDate().toString());
        out.put("slotTime", slotTime);
        out.put("timeSlot", slotTime);
        out.put("shiftName", shiftName);
        out.put("appointmentWindow", TimeUtils.buildAppointmentWindow(slotTime, 15));
        out.put("appointmentType", a.getAppointmentType());
        out.put("reason", a.getReason() != null ? a.getReason() : "");
        out.put("symptoms", a.getReason() != null ? a.getReason() : "");
        out.put("priority", aExtra.getOrDefault("priority", "NORMAL"));
        out.put("status", a.getStatus());
        out.put("vitals", Map.of());
        out.put("doctorNotes", a.getDoctorNotes() != null ? a.getDoctorNotes() : "");
        out.put("cancellationReason", a.getCancellationReason() != null ? a.getCancellationReason() : "");
        out.put("queueType", aExtra.getOrDefault("queueType", "NONE"));
        out.put("checkInTime", aExtra.get("checkInTime"));
        out.put("consultationStartTime", aExtra.get("consultationStartTime"));
        out.put("consultationEndTime", aExtra.get("consultationEndTime"));
        out.put("investigationTests", aExtra.getOrDefault("investigationTests", List.of()));
        out.put("prescription", aExtra.get("prescription"));
        out.put("createdAt", a.getCreatedAt().toString());
        out.put("updatedAt", a.getUpdatedAt().toString());
        return out;
    }

    private String computeTokenNumber(Appointment a) {
        List<Appointment> sameDayDoctor = appointmentRepository
                .findByDoctorIdAndAppointmentDateOrderByCreatedAtAsc(a.getDoctorId(), a.getAppointmentDate())
                .stream().filter(x -> !INACTIVE_STATUSES.contains(x.getStatus())).toList();
        int index = 0;
        for (int i = 0; i < sameDayDoctor.size(); i++) {
            if (sameDayDoctor.get(i).getId().equals(a.getId())) { index = i; break; }
        }
        return "A-" + String.format("%02d", index + 1);
    }

    private Appointment requireAppointment(String id) {
        return appointmentRepository.findById(id).orElseThrow(() -> ApiException.notFound("Appointment record not found."));
    }

    private String resolveSinglePatientId(String patientId, String patientHealthId) {
        if (!isBlank(patientId)) return patientId;
        if (!isBlank(patientHealthId)) {
            return patientProfileRepository.findByPatientHealthId(patientHealthId).map(PatientProfile::getUserId).orElse(null);
        }
        return null;
    }

    private static boolean isDateInAnyRange(Object leavesObj, String dateStr) {
        if (!(leavesObj instanceof List<?> leaves)) return false;
        for (Object l : leaves) {
            if (l instanceof Map<?, ?> m && isWithinRange(dateStr, String.valueOf(m.get("startDate")), String.valueOf(m.get("endDate")))) {
                return true;
            }
        }
        return false;
    }

    private static boolean isWithinRange(String dateStr, String start, String end) {
        if (dateStr == null || start == null || end == null) return false;
        return dateStr.compareTo(start) >= 0 && dateStr.compareTo(end) <= 0;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object obj) {
        return obj instanceof Map ? (Map<String, Object>) obj : new LinkedHashMap<>();
    }

    private static int intOr(Object value, int fallback) {
        if (value == null) return fallback;
        try {
            return (int) Double.parseDouble(String.valueOf(value));
        } catch (Exception e) {
            return fallback;
        }
    }

    private static String strOr(Object value, String fallback) {
        return value != null ? String.valueOf(value) : fallback;
    }

    private static LocalTime toLocalTime(String amPmTime) {
        int mins = TimeUtils.timeToMins(amPmTime);
        return LocalTime.of(mins / 60, mins % 60);
    }

    private static String formatTime(LocalTime time) {
        return TimeUtils.minsToTimeStr(time.getHour() * 60 + time.getMinute());
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
