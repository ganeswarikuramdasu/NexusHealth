package com.nexushealth.config;

import com.nexushealth.entity.AccessCard;
import com.nexushealth.entity.Appointment;
import com.nexushealth.entity.Consent;
import com.nexushealth.entity.Doctor;
import com.nexushealth.entity.Hospital;
import com.nexushealth.entity.MedicalRecord;
import com.nexushealth.entity.PatientProfile;
import com.nexushealth.entity.User;
import com.nexushealth.repository.AccessCardRepository;
import com.nexushealth.repository.AppointmentRepository;
import com.nexushealth.repository.ConsentRepository;
import com.nexushealth.repository.DoctorRepository;
import com.nexushealth.repository.HospitalRepository;
import com.nexushealth.repository.MedicalRecordRepository;
import com.nexushealth.repository.PatientProfileRepository;
import com.nexushealth.repository.UserRepository;
import com.nexushealth.service.store.FeedbackStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Seeds a complete, self-contained demonstration dataset so every demo
 * login advertised on the login page is fully functional on a fresh
 * database. Every row uses demo-prefixed ids and @nexusdemo.in accounts so
 * it can never collide with or leak into real registered users. Idempotent:
 * runs on every boot and skips anything that already exists.
 */
@Component
public class DemoDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    private static final String DEMO_HOSPITAL_ID = "hosp_citycare";
    private static final String DEMO_DOCTOR_ANAND = "doc_demo_anand";
    private static final String DEMO_DOCTOR_PRIYA = "doc_demo_priya";
    private static final String DEMO_DOCTOR_RAVI = "doc_demo_ravi";
    private static final String DEMO_PATIENT_AARAV = "u_demo_patient";
    private static final String DEMO_PATIENT_MEERA = "u_demo_patient2";

    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;
    private final DoctorRepository doctorRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final ConsentRepository consentRepository;
    private final AppointmentRepository appointmentRepository;
    private final AccessCardRepository accessCardRepository;
    private final FeedbackStore feedbackStore;
    private final PasswordEncoder passwordEncoder;

    public DemoDataSeeder(UserRepository userRepository,
                          HospitalRepository hospitalRepository,
                          DoctorRepository doctorRepository,
                          PatientProfileRepository patientProfileRepository,
                          MedicalRecordRepository medicalRecordRepository,
                          ConsentRepository consentRepository,
                          AppointmentRepository appointmentRepository,
                          AccessCardRepository accessCardRepository,
                          FeedbackStore feedbackStore,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.hospitalRepository = hospitalRepository;
        this.doctorRepository = doctorRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.consentRepository = consentRepository;
        this.appointmentRepository = appointmentRepository;
        this.accessCardRepository = accessCardRepository;
        this.feedbackStore = feedbackStore;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedHospital();
        seedDoctor(DEMO_DOCTOR_ANAND, "u_demo_doctor", "doctor.anand@nexusdemo.in",
                "Dr. Anand Rao", "Cardiology", "MCI-2026-14982", 1200);
        seedDoctor(DEMO_DOCTOR_PRIYA, "u_demo_doctor2", "dr.priya@nexusdemo.in",
                "Dr. Priya Nair", "General Medicine", "MCI-2026-22541", 800);
        seedDoctor(DEMO_DOCTOR_RAVI, "u_demo_doctor3", "dr.ravi@nexusdemo.in",
                "Dr. Ravi Menon", "Orthopedics", "MCI-2026-33877", 1000);
        seedPatientAarav();
        seedPatientMeera();
        seedCards();
        seedRecords();
        seedConsents();
        seedAppointments();
        seedFeedback();
        log.info("Demo data seeder finished.");
    }

    private User userOrCreate(String id, String name, String email, String password, String role, String phone,
                              String gender, LocalDate dob) {
        return userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            User u = User.builder()
                    .id(id)
                    .name(name)
                    .email(email)
                    .passwordHash(passwordEncoder.encode(password))
                    .role(role)
                    .phone(phone)
                    .gender(gender)
                    .dateOfBirth(dob)
                    .status("ACTIVE")
                    .build();
            userRepository.save(u);
            return u;
        });
    }

    private void seedHospital() {
        if (hospitalRepository.existsById(DEMO_HOSPITAL_ID)) return;
        User admin = userOrCreate("u_demo_hospital_admin", "CityCare Admin", "citycare@nexusdemo.in",
                "CityCare@2026", "HOSPITAL_ADMIN", "+91 90000 40001", "Female", LocalDate.of(1985, 6, 12));

        Map<String, Object> extra = new LinkedHashMap<>();
        extra.put("departments", List.of("Cardiology", "Orthopedics", "Pediatrics", "General Medicine"));
        extra.put("emergencyServices", List.of("24x7 Emergency & Trauma Care"));
        extra.put("advancedFacilities", List.of("ICU", "Operation Theatre", "Diagnostic Imaging"));
        extra.put("specialties", List.of("Cardiology", "Orthopedics", "General Medicine"));
        extra.put("departmentStatuses", Map.of("Cardiology", "OPEN", "Orthopedics", "OPEN",
                "Pediatrics", "OPEN", "General Medicine", "OPEN"));
        extra.put("icuBeds", 12);
        extra.put("odCount", 6);
        extra.put("bloodBankAvailable", true);

        Hospital h = Hospital.builder()
                .id(DEMO_HOSPITAL_ID)
                .adminUserId(admin.getId())
                .name("CityCare Multispeciality Hospital")
                .email("care@citycare.in")
                .phone("+91 90000 40001")
                .address("12, MG Road, Bengaluru, Karnataka 560001")
                .licenseNumber("HLR/KAR/2007/00854")
                .totalBeds(250)
                .availableBeds(40)
                .status("APPROVED")
                .extra(extra)
                .build();
        hospitalRepository.save(h);
        log.info("Seeded demo hospital: CityCare Multispeciality Hospital");
    }

    private void seedDoctor(String docId, String userId, String email, String name, String specialization,
                            String license, int fee) {
        if (doctorRepository.existsById(docId)) return;
        User docUser = userOrCreate(userId, name, email, "Doctor@2026", "DOCTOR", "+91 90000 40002",
                name.startsWith("Dr. Priya") ? "Female" : "Male", LocalDate.of(1980, 2, 10));

        Map<String, Object> extra = new LinkedHashMap<>();
        extra.put("skills", List.of(specialization, "Patient Counselling"));
        extra.put("workingDays", List.of("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"));
        extra.put("notificationPreferences", new LinkedHashMap<String, Object>());
        extra.put("weeklySchedule", demoWeeklySchedule());

        Doctor doctor = Doctor.builder()
                .id(docId)
                .userId(docUser.getId())
                .hospitalId(DEMO_HOSPITAL_ID)
                .hospitalName("CityCare Multispeciality Hospital")
                .name(name)
                .email(email)
                .specialization(specialization)
                .licenseNumber(license)
                .fee(BigDecimal.valueOf(fee))
                .status("APPROVED")
                .isActive(true)
                .extra(extra)
                .build();
        doctorRepository.save(doctor);
        log.info("Seeded demo doctor: {}", name);
    }

    private Map<String, Object> demoWeeklySchedule() {
        Map<String, Object> schedule = new LinkedHashMap<>();
        for (String day : List.of("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")) {
            Map<String, Object> daySched = new LinkedHashMap<>();
            daySched.put("active", true);
            daySched.put("slotDurationMin", 20);
            daySched.put("slotBufferMin", 5);
            daySched.put("tokensPerSlot", 3);
            daySched.put("dailyMaxLimit", day.equals("Saturday") ? 20 : 30);
            List<Map<String, Object>> slots = new ArrayList<>();
            for (String t : List.of("09:00 AM", "09:30 AM", "10:00 AM", "11:00 AM", "04:00 PM", "05:00 PM")) {
                Map<String, Object> slot = new LinkedHashMap<>();
                slot.put("time", t);
                slot.put("label", "General Consultation");
                slots.add(slot);
            }
            daySched.put("timeSlots", slots);
            daySched.put("breaks", List.of());
            schedule.put(day, daySched);
        }
        return schedule;
    }

    private void seedPatientAarav() {
        String email = "patient.demo@nexusdemo.in";
        if (userRepository.existsByEmailIgnoreCase(email)) return;
        User patient = userOrCreate(DEMO_PATIENT_AARAV, "Aarav Sharma", email, "Patient@2026", "PATIENT",
                "+91 90000 40003", "Male", LocalDate.of(1994, 4, 18));
        PatientProfile profile = PatientProfile.builder()
                .userId(patient.getId())
                .patientHealthId("NH-IND-2026-DEMO0001")
                .bloodGroup("O+")
                .heightCm(BigDecimal.valueOf(172))
                .weightKg(BigDecimal.valueOf(70))
                .emergencyNotes("Alergic to penicillin")
                .build();
        patientProfileRepository.save(profile);
        log.info("Seeded demo patient: {}", email);
    }

    private void seedPatientMeera() {
        String email = "meera.demo@nexusdemo.in";
        if (userRepository.existsByEmailIgnoreCase(email)) return;
        User patient = userOrCreate(DEMO_PATIENT_MEERA, "Meera Nair", email, "Meera@2026", "PATIENT",
                "+91 90000 40004", "Female", LocalDate.of(1989, 11, 3));
        PatientProfile profile = PatientProfile.builder()
                .userId(patient.getId())
                .patientHealthId("NH-IND-2026-DEMO0002")
                .bloodGroup("B+")
                .heightCm(BigDecimal.valueOf(160))
                .weightKg(BigDecimal.valueOf(58))
                .emergencyNotes("Reported dust allergy")
                .build();
        patientProfileRepository.save(profile);
        log.info("Seeded demo patient: {}", email);
    }

    private void seedCards() {
        seedCard("card_demo_1", DEMO_PATIENT_AARAV, "NH-IND-2026-DEMO0001", "CD-2026-DEMO0001",
                "NXAC-DEMO0001-7f3a92c4e1b0", "Aarav Sharma", "4321");
        seedCard("card_demo_2", DEMO_PATIENT_MEERA, "NH-IND-2026-DEMO0002", "CD-2026-DEMO0002",
                "NXAC-DEMO0002-1a8b5d7c3f2e", "Meera Nair", "1234");
    }

    private void seedCard(String id, String patientId, String healthId, String identifier, String token,
                          String patientName, String pin) {
        if (accessCardRepository.existsById(id)) return;
        AccessCard card = AccessCard.builder()
                .id(id)
                .patientId(patientId)
                .patientHealthId(healthId)
                .cardIdentifier(identifier)
                .secureToken(token)
                .secureTokenHash(passwordEncoder.encode(token))
                .patientName(patientName)
                .status("ACTIVE")
                .pinCode(pin)
                .issuedAt(LocalDateTime.now().minusDays(35))
                .activatedAt(LocalDateTime.now().minusDays(35))
                .qrCodeData("NEXUSHEALTH_CARD_TOKEN:" + token)
                .build();
        accessCardRepository.save(card);
    }

    private void seedRecords() {
        if (!medicalRecordRepository.existsById("rec_demo_cbc1")) {
            medicalRecordRepository.save(record("rec_demo_cbc1", DEMO_PATIENT_AARAV, "NH-IND-2026-DEMO0001",
                    "LAB_REPORT", "Complete Blood Count (CBC)", "All parameters within normal limits.",
                    LocalDate.now().minusDays(45), labExtra()));
        }
        if (!medicalRecordRepository.existsById("rec_demo_consult1")) {
            medicalRecordRepository.save(record("rec_demo_consult1", DEMO_PATIENT_AARAV, "NH-IND-2026-DEMO0001",
                    "CONSULTATION", "Chest pain evaluation & cardiac workup",
                    "Lifestyle-related gastritis with mild GERD; cardiac causes ruled out by ECG.",
                    LocalDate.now().minusDays(30), consultExtra()));
        }
        if (!medicalRecordRepository.existsById("rec_demo_vitals1")) {
            medicalRecordRepository.save(record("rec_demo_vitals1", DEMO_PATIENT_AARAV, "NH-IND-2026-DEMO0001",
                    "VITALS", "Regular health check - vitals", "BP mildly elevated; advised diet & exercise.",
                    LocalDate.now().minusDays(7), vitalsExtra()));
        }
        if (!medicalRecordRepository.existsById("rec_demo_pres1")) {
            medicalRecordRepository.save(record("rec_demo_pres1", DEMO_PATIENT_AARAV, "NH-IND-2026-DEMO0001",
                    "PRESCRIPTION", "Cardiac health prescription",
                    "Pantoprazole 40 mg OD, Tab Levocetirizine 5 mg HS, lifestyle modifications.",
                    LocalDate.now().minusDays(2), prescriptionExtra()));
        }
        if (!medicalRecordRepository.existsById("rec_demo_consult2")) {
            medicalRecordRepository.save(record("rec_demo_consult2", DEMO_PATIENT_MEERA, "NH-IND-2026-DEMO0002",
                    "CONSULTATION", "Arthritis follow-up",
                    "Early osteoarthritis of right knee; physiotherapy and NSAID prescribed.",
                    LocalDate.now().minusDays(20), consultExtra2()));
        }
    }

    private MedicalRecord record(String id, String patientId, String healthId, String type, String title,
                                 String diagnosis, LocalDate date, Map<String, Object> extra) {
        MedicalRecord r = MedicalRecord.builder()
                .id(id)
                .patientId(patientId)
                .patientHealthId(healthId)
                .doctorId(DEMO_DOCTOR_ANAND)
                .hospitalId(DEMO_HOSPITAL_ID)
                .recordType(type)
                .title(title)
                .diagnosis(diagnosis)
                .recordDate(date)
                .extra(extra)
                .build();
        r.setClinicalNotes(diagnosis + " Detailed notes recorded during the consultation at CityCare Multispeciality Hospital.");
        Doctor d = doctorRepository.findById(DEMO_DOCTOR_ANAND).orElse(null);
        if (d != null) r.setDescription("Recorded by " + d.getName() + " (" + d.getSpecialization() + ")");
        return r;
    }

    private Map<String, Object> baseRecordExtra() {
        Map<String, Object> extra = new LinkedHashMap<>();
        Doctor d = doctorRepository.findById(DEMO_DOCTOR_ANAND).orElse(null);
        extra.put("doctorName", d != null ? d.getName() : "Dr. Anand Rao");
        extra.put("doctorSignature", "DIGITAL_SIG_" + System.currentTimeMillis());
        extra.put("hospitalName", "CityCare Multispeciality Hospital");
        return extra;
    }

    private Map<String, Object> labExtra() {
        Map<String, Object> extra = baseRecordExtra();
        extra.put("category", "LAB_REPORT");
        extra.put("testName", "Complete Blood Count (CBC)");
        extra.put("testCategory", "Pathology / Hematology");
        extra.put("referenceRange", "Standard Adult Reference");
        extra.put("attachmentUrl", "");
        extra.put("fileName", "CBC_Report.pdf");
        extra.put("fileSize", "412 KB");
        List<Map<String, Object>> results = new ArrayList<>();
        results.add(row("Hemoglobin", "14.2", "13.0 - 17.0", "g/dL", "NORMAL"));
        results.add(row("RBC Count", "4.9", "4.5 - 5.5", "million/µL", "NORMAL"));
        results.add(row("WBC Count", "7200", "4000 - 11000", "/µL", "NORMAL"));
        results.add(row("Platelets", "286", "150 - 410", "thousand/µL", "NORMAL"));
        extra.put("labResults", results);
        return extra;
    }

    private Map<String, Object> consultExtra() {
        Map<String, Object> extra = baseRecordExtra();
        extra.put("category", "CONSULTATION");
        extra.put("symptoms", List.of("Chest discomfort", "Mild acidity", "Fatigue"));
        List<Map<String, Object>> medicines = new ArrayList<>();
        medicines.add(medicine("Pantoprazole", "40 mg", "Once daily", "14 days"));
        medicines.add(medicine("Vitamin D3", "60K IU", "Once weekly", "8 weeks"));
        extra.put("medicines", medicines);
        return extra;
    }

    private Map<String, Object> vitalsExtra() {
        Map<String, Object> extra = baseRecordExtra();
        extra.put("category", "VITALS");
        Map<String, Object> vitals = new LinkedHashMap<>();
        vitals.put("bpSystolic", 132);
        vitals.put("bpDiastolic", 84);
        vitals.put("heartRate", 78);
        vitals.put("spo2", 98);
        vitals.put("temperature", "98.6 F");
        vitals.put("fastingSugar", 96);
        vitals.put("heightCm", 172);
        vitals.put("weightKg", 70);
        vitals.put("bmi", 23.7);
        extra.put("vitals", vitals);
        return extra;
    }

    private Map<String, Object> prescriptionExtra() {
        Map<String, Object> extra = baseRecordExtra();
        extra.put("category", "PRESCRIPTION");
        List<Map<String, Object>> medicines = new ArrayList<>();
        medicines.add(medicine("Pantoprazole", "40 mg", "Once daily", "14 days"));
        medicines.add(medicine("Levocetirizine", "5 mg", "Once daily at night", "10 days"));
        medicines.add(medicine("Calcium + Vitamin D3", "1 tablet", "Once daily", "30 days"));
        extra.put("medicines", medicines);
        return extra;
    }

    private Map<String, Object> consultExtra2() {
        Map<String, Object> extra = baseRecordExtra();
        extra.put("category", "CONSULTATION");
        extra.put("symptoms", List.of("Right knee pain", "Stiffness in mornings"));
        List<Map<String, Object>> medicines = new ArrayList<>();
        medicines.add(medicine("Diclofenac gel", "Apply twice daily", "Topical", "10 days"));
        medicines.add(medicine("Acetaminophen", "650 mg", "Twice daily as needed", "7 days"));
        extra.put("medicines", medicines);
        return extra;
    }

    private Map<String, Object> row(String test, String value, String ref, String unit, String flag) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("test", test);
        m.put("value", value);
        m.put("ref", ref);
        m.put("unit", unit);
        m.put("flag", flag);
        return m;
    }

    private Map<String, Object> medicine(String name, String dosage, String frequency, String duration) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("name", name);
        m.put("dosage", dosage);
        m.put("frequency", frequency);
        m.put("duration", duration);
        return m;
    }

    private void seedConsents() {
        seedConsent("c_demo_1", DEMO_PATIENT_AARAV);
        seedConsent("c_demo_2", DEMO_PATIENT_MEERA);
    }

    private void seedConsent(String id, String patientId) {
        if (consentRepository.existsById(id)) return;
        Consent consent = Consent.builder()
                .id(id)
                .patientId(patientId)
                .doctorId(DEMO_DOCTOR_ANAND)
                .hospitalId(DEMO_HOSPITAL_ID)
                .consentType("FULL_ACCESS")
                .status("GRANTED")
                .expiresAt(LocalDate.now().plusDays(180))
                .scope(List.of("ALL_RECORDS", "VITALS", "LAB_REPORTS", "PRESCRIPTIONS"))
                .notes("Demo consent granted for demonstration flows.")
                .build();
        consent.setGrantedAt(LocalDateTime.now().minusDays(40));
        consentRepository.save(consent);
    }

    private void seedAppointments() {
        seedAppointment("apt_demo_1", DEMO_PATIENT_AARAV, "NH-IND-2026-DEMO0001", "Aarav Sharma",
                "Follow-up consultation for chest discomfort", LocalDate.now().minusDays(5),
                LocalTime.of(9, 0), "COMPLETED");
        seedAppointment("apt_demo_2", DEMO_PATIENT_AARAV, "NH-IND-2026-DEMO0001", "Aarav Sharma",
                "Full cardiac check-up", LocalDate.now().plusDays(2),
                LocalTime.of(10, 30), "SCHEDULED");
        seedAppointment("apt_demo_3", DEMO_PATIENT_MEERA, "NH-IND-2026-DEMO0002", "Meera Nair",
                "Knee pain consultation", LocalDate.now().minusDays(12),
                LocalTime.of(11, 0), "COMPLETED");
    }

    private void seedAppointment(String id, String patientId, String healthId, String patientName, String reason,
                                 LocalDate date, LocalTime time, String status) {
        if (appointmentRepository.existsById(id)) return;
        Map<String, Object> extra = new LinkedHashMap<>();
        extra.put("patientName", patientName);
        extra.put("patientHealthId", healthId);
        extra.put("appointmentType", "ROUTINE_CONSULTATION");
        Appointment apt = Appointment.builder()
                .id(id)
                .patientId(patientId)
                .doctorId(DEMO_DOCTOR_ANAND)
                .hospitalId(DEMO_HOSPITAL_ID)
                .appointmentDate(date)
                .appointmentTime(time)
                .reason(reason)
                .appointmentType("ROUTINE_CONSULTATION")
                .status(status)
                .extra(extra)
                .build();
        appointmentRepository.save(apt);
    }

    private void seedFeedback() {
        feedbackStore.add(feedback(DEMO_PATIENT_AARAV, "Aarav Sharma", DEMO_DOCTOR_ANAND,
                "Dr. Anand Rao", 5, "Very patient and explained everything clearly."));
        feedbackStore.add(feedback(DEMO_PATIENT_MEERA, "Meera Nair", DEMO_DOCTOR_ANAND,
                "Dr. Anand Rao", 5, "Thorough follow-up and timely diagnosis."));
        feedbackStore.add(feedback(DEMO_PATIENT_AARAV, "Aarav Sharma", DEMO_DOCTOR_PRIYA,
                "Dr. Priya Nair", 4, "Good consultation, wait time was a bit long."));
        feedbackStore.add(feedback(DEMO_PATIENT_MEERA, "Meera Nair", DEMO_DOCTOR_PRIYA,
                "Dr. Priya Nair", 5, "Friendly doctor, felt comfortable discussing symptoms."));
    }

    private Map<String, Object> feedback(String patientId, String patientName, String doctorId,
                                         String doctorName, int rating, String comment) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("patientId", patientId);
        data.put("patientName", patientName);
        data.put("doctorId", doctorId);
        data.put("doctorName", doctorName);
        data.put("rating", rating);
        data.put("comment", comment);
        return data;
    }
}