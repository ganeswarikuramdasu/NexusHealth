package com.nexushealth.config;

import com.nexushealth.entity.AccessCard;
import com.nexushealth.entity.Consent;
import com.nexushealth.entity.Doctor;
import com.nexushealth.entity.Hospital;
import com.nexushealth.entity.MedicalRecord;
import com.nexushealth.entity.PatientProfile;
import com.nexushealth.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.nexushealth.repository.AccessCardRepository;
import com.nexushealth.repository.ConsentRepository;
import com.nexushealth.repository.DoctorRepository;
import com.nexushealth.repository.HospitalRepository;
import com.nexushealth.repository.MedicalRecordRepository;
import com.nexushealth.repository.PatientProfileRepository;
import com.nexushealth.repository.UserRepository;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Seeds demo accounts + data on a fresh database so the final-year demo has
 * working patients, doctors, hospitals, medical records and access cards.
 * Idempotent: if the super-admin user already exists, nothing is written.
 * The demo credentials match what the frontend hardcodes in several views
 * (u_pat_1/u_pat_2, NH-IND-2026-88392014, doc_1, hosp_1, etc).
 */
@Component
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String HEX = "0123456789abcdef";

    private final UserRepository userRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final HospitalRepository hospitalRepository;
    private final DoctorRepository doctorRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final AccessCardRepository accessCardRepository;
    private final ConsentRepository consentRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository,
                      PatientProfileRepository patientProfileRepository,
                      HospitalRepository hospitalRepository,
                      DoctorRepository doctorRepository,
                      MedicalRecordRepository medicalRecordRepository,
                      AccessCardRepository accessCardRepository,
                      ConsentRepository consentRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.hospitalRepository = hospitalRepository;
        this.doctorRepository = doctorRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.accessCardRepository = accessCardRepository;
        this.consentRepository = consentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.findById("u_super_1").isPresent()) {
            log.info("DataSeeder: demo data already present, skipping.");
            return;
        }
        log.info("DataSeeder: seeding demo data...");

        seedUser("u_super_1", "System Super Admin", "ganeswarikuramdasu@gmail.com", "Admin@Nexus2026!", "SUPER_ADMIN", null, null);
        seedUser("u_pat_1", "Ananya Sharma", "ananya.sharma@nexus.org", "PatientPass123!", "PATIENT", "FEMALE", "1995-04-12");
        seedUser("u_pat_2", "Rohan Verma", "rohan.verma@nexus.org", "PatientPass123!", "PATIENT", "MALE", "1992-09-24");
        seedUser("u_doc_1", "Dr. Rajesh V. Sharma", "dr.rajesh@apollo.org", "DoctorPass123!", "DOCTOR", null, null);
        seedUser("u_doc_2", "Dr. Priya Sundaram", "dr.priya@maxhealth.org", "DoctorPass123!", "DOCTOR", null, null);
        seedUser("u_doc_3", "Dr. Vikramaditya Rao", "dr.vikram@apollo.org", "DoctorPass123!", "DOCTOR", null, null);
        seedUser("u_hosp_1", "Apollo Multi-Specialty Hospital", "admin@apollo.org", "HospitalPass123!", "HOSPITAL_ADMIN", null, null);
        seedUser("u_hosp_2", "Max Super Specialty Hospital", "admin@maxhealth.org", "HospitalPass123!", "HOSPITAL_ADMIN", null, null);

        seedPatientProfile("u_pat_1", "NH-IND-2026-88392014", "B+", "165", "58");
        seedPatientProfile("u_pat_2", "NH-IND-2026-99281045", "A+", "178", "74");

        seedHospital("hosp_1", "u_hosp_1", "Apollo Multi-Specialty Hospital", "admin@apollo.org",
                "No. 21, Green Meadows Road, Delhi", "12 Banquet Drive, Sector 22, Delhi");
        seedHospital("hosp_2", "u_hosp_2", "Max Super Specialty Hospital", "admin@maxhealth.org",
                "4th Cross, Tech Park Avenue, Mumbai", "88 Marina Boulevard, Mumbai");

        seedDoctor("doc_1", "u_doc_1", "hosp_1", "Apollo Multi-Specialty Hospital",
                "Dr. Rajesh V. Sharma", "dr.rajesh@apollo.org", "Cardiology", "MCI-10021");
        seedDoctor("doc_2", "u_doc_2", "hosp_2", "Max Super Specialty Hospital",
                "Dr. Priya Sundaram", "dr.priya@maxhealth.org", "Neurology", "MCI-10087");
        seedDoctor("doc_3", "u_doc_3", "hosp_1", "Apollo Multi-Specialty Hospital",
                "Dr. Vikramaditya Rao", "dr.vikram@apollo.org", "Orthopedics", "MCI-10053");

        seedMedicalRecord("rec_1", "u_pat_1", "NH-IND-2026-88392014", "doc_1", "hosp_1",
                "CONSULTATION", "Annual Cardiac Consultation", "Mild hypertension - stable",
                "BP recorded at 132/86. Regular exercise advised. Review in 6 months.",
                LocalDate.now().minusMonths(2),
                Map.of("doctorName", "Dr. Rajesh V. Sharma", "hospitalName", "Apollo Multi-Specialty Hospital",
                        "symptoms", List.of("occasional headache", "fatigue")));
        seedMedicalRecord("rec_2", "u_pat_1", "NH-IND-2026-88392014", "doc_1", "hosp_1",
                "LAB_REPORT", "Complete Blood Count", "Within normal limits",
                "All CBC parameters within normal range.",
                LocalDate.now().minusMonths(1),
                Map.of("doctorName", "Dr. Rajesh V. Sharma", "hospitalName", "Apollo Multi-Specialty Hospital",
                        "labResults", List.of(Map.of("test", "Hemoglobin", "result", "13.2 g/dL"),
                                Map.of("test", "WBC", "result", "7400 /uL"))));
        seedMedicalRecord("rec_3", "u_pat_2", "NH-IND-2026-99281045", "doc_2", "hosp_2",
                "CONSULTATION", "Neurology Follow-up", "Migraine - improving",
                "Reduced attack frequency with current medication.",
                LocalDate.now().minusWeeks(3),
                Map.of("doctorName", "Dr. Priya Sundaram", "hospitalName", "Max Super Specialty Hospital",
                        "symptoms", List.of("throbbing headache", "photophobia")));

        seedAccessCard("card_1", "u_pat_1", "NH-IND-2026-88392014", "Ananya Sharma", "ACTIVE", "4412");
        seedAccessCard("card_2", "u_pat_2", "NH-IND-2026-99281045", "Rohan Verma", "ACTIVE", "8819");

        seedConsent("cons_1", "u_pat_1", "doc_1", "hosp_1");
        seedConsent("cons_2", "u_pat_2", "doc_2", "hosp_2");

        log.info("DataSeeder: demo data seeded successfully.");
    }

    private void seedUser(String id, String name, String email, String password, String role, String gender, String dob) {
        if (userRepository.findById(id).isPresent()) return;
        User user = User.builder()
                .id(id)
                .name(name)
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .role(role)
                .gender(gender)
                .dateOfBirth(dob != null ? LocalDate.parse(dob) : null)
                .status("ACTIVE")
                .build();
        userRepository.save(user);
    }

    private void seedPatientProfile(String userId, String healthId, String bloodGroup, String height, String weight) {
        if (patientProfileRepository.findById(userId).isPresent()) return;
        patientProfileRepository.save(PatientProfile.builder()
                .userId(userId)
                .patientHealthId(healthId)
                .bloodGroup(bloodGroup)
                .heightCm(new BigDecimal(height))
                .weightKg(new BigDecimal(weight))
                .emergencyNotes("Demo patient for NexusHealth final-year project.")
                .build());
    }

    private void seedHospital(String id, String adminUserId, String name, String email, String phone, String address) {
        if (hospitalRepository.findById(id).isPresent()) return;
        Hospital hospital = Hospital.builder()
                .id(id)
                .adminUserId(adminUserId)
                .name(name)
                .email(email)
                .phone(phone)
                .address(address)
                .licenseNumber("HOS-" + id.replace("hosp_", "").toUpperCase() + "-2026")
                .totalBeds(120)
                .availableBeds(48)
                .status("APPROVED")
                .extra(new LinkedHashMap<>())
                .build();
        hospitalRepository.save(hospital);
    }

    private void seedDoctor(String id, String userId, String hospitalId, String hospitalName,
                            String name, String email, String specialization, String license) {
        if (doctorRepository.findByUserId(userId).isPresent()) return;
        Doctor doctor = Doctor.builder()
                .id(id)
                .userId(userId)
                .hospitalId(hospitalId)
                .hospitalName(hospitalName)
                .name(name)
                .email(email)
                .specialization(specialization)
                .licenseNumber(license)
                .fee(BigDecimal.valueOf(1000))
                .status("APPROVED")
                .isActive(true)
                .extra(new LinkedHashMap<>())
                .build();
        doctorRepository.save(doctor);
    }

    private void seedMedicalRecord(String id, String patientId, String patientHealthId, String doctorId, String hospitalId,
                                   String recordType, String title, String diagnosis, String clinicalNotes,
                                   LocalDate recordDate, Map<String, Object> extra) {
        if (medicalRecordRepository.findById(id).isPresent()) return;
        medicalRecordRepository.save(MedicalRecord.builder()
                .id(id)
                .patientId(patientId)
                .patientHealthId(patientHealthId)
                .doctorId(doctorId)
                .hospitalId(hospitalId)
                .recordType(recordType)
                .title(title)
                .diagnosis(diagnosis)
                .clinicalNotes(clinicalNotes)
                .recordDate(recordDate)
                .extra(new LinkedHashMap<>(extra))
                .build());
    }

    private void seedAccessCard(String id, String patientId, String patientHealthId, String patientName,
                                String status, String pin) {
        if (accessCardRepository.findById(id).isPresent()) return;
        String token = "NXAC-" + randomHex(24);
        accessCardRepository.save(AccessCard.builder()
                .id(id)
                .patientId(patientId)
                .patientHealthId(patientHealthId)
                .cardIdentifier("CARD-PAT-" + patientHealthId.replace("NH-IND-2026-", ""))
                .secureTokenHash("seed-hash-" + token)
                .secureToken(token)
                .patientName(patientName)
                .status(status)
                .pinCode(pin)
                .issuedAt(LocalDateTime.now().minusMonths(3))
                .activatedAt(LocalDateTime.now().minusMonths(3))
                .qrCodeData("NEXUSHEALTH_CARD_TOKEN:" + token)
                .build());
    }

    private void seedConsent(String id, String patientId, String doctorId, String hospitalId) {
        if (consentRepository.findById(id).isPresent()) return;
        consentRepository.save(Consent.builder()
                .id(id)
                .patientId(patientId)
                .doctorId(doctorId)
                .hospitalId(hospitalId)
                .consentType("LONG_TERM")
                .status("GRANTED")
                .expiresAt(LocalDate.now().plusYears(1))
                .scope(List.of("VIEW_RECORDS", "VIEW_VITALS", "EMERGENCY_ACCESS"))
                .notes("Demo consent granted for final-year project demonstration.")
                .build());
    }

    private static String randomHex(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(HEX.charAt(RANDOM.nextInt(HEX.length())));
        }
        return sb.toString();
    }
}
