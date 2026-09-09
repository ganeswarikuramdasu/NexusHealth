package com.nexushealth.config;

import com.nexushealth.entity.AccessCard;
import com.nexushealth.entity.Hospital;
import com.nexushealth.entity.PatientProfile;
import com.nexushealth.entity.User;
import com.nexushealth.repository.AccessCardRepository;
import com.nexushealth.repository.HospitalRepository;
import com.nexushealth.repository.PatientProfileRepository;
import com.nexushealth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Seeds a minimal, self-contained demonstration dataset so the demo
 * patient and hospital-admin logins advertised on the login page are
 * fully functional on a fresh database. Doctors are NOT seeded — the
 * hospital admin creates them through the portal.
 *
 * Every row uses demo-prefixed ids and {@code @nexusdemo.in} accounts so
 * it can never collide with or leak into real registered users.
 * Idempotent: runs on every boot and skips anything that already exists.
 */
@Component
public class DemoDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    private static final String DEMO_HOSPITAL_ID = "hosp_citycare";
    private static final String DEMO_PATIENT_AARAV = "u_demo_patient";
    private static final String DEMO_PATIENT_MEERA = "u_demo_patient2";

    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final AccessCardRepository accessCardRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoDataSeeder(UserRepository userRepository,
                          HospitalRepository hospitalRepository,
                          PatientProfileRepository patientProfileRepository,
                          AccessCardRepository accessCardRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.hospitalRepository = hospitalRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.accessCardRepository = accessCardRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedHospital();
        seedPatientAarav();
        seedPatientMeera();
        seedCards();
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
}
