package com.nexushealth.config;

import com.nexushealth.entity.Doctor;
import com.nexushealth.entity.Hospital;
import com.nexushealth.entity.PatientProfile;
import com.nexushealth.entity.User;
import com.nexushealth.repository.DoctorRepository;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Creates the one-click demo login accounts the login page advertises
 * (Hospital Admin, Doctor, Patient) on a fresh database. The Super Admin
 * demo login is handled directly by AuthService config credentials, so it
 * does not need a row here. Idempotent: runs on every boot and skips any
 * account that already exists.
 */
@Component
public class DemoDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;
    private final DoctorRepository doctorRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoDataSeeder(UserRepository userRepository,
                          HospitalRepository hospitalRepository,
                          DoctorRepository doctorRepository,
                          PatientProfileRepository patientProfileRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.hospitalRepository = hospitalRepository;
        this.doctorRepository = doctorRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedHospitalAdmin();
        seedDoctor();
        seedPatient();
    }

    private void seedHospitalAdmin() {
        String email = "citycare@nexusdemo.in";
        if (userRepository.existsByEmailIgnoreCase(email)) return;

        User admin = User.builder()
                .id("u_demo_hospital_admin")
                .name("CityCare Admin")
                .email(email)
                .passwordHash(passwordEncoder.encode("CityCare@2026"))
                .role("HOSPITAL_ADMIN")
                .phone("+91 90000 40001")
                .status("ACTIVE")
                .build();
        userRepository.save(admin);

        Map<String, Object> extra = new LinkedHashMap<>();
        extra.put("departments", List.of("Cardiology", "Orthopedics", "Pediatrics", "General Medicine"));
        extra.put("emergencyServices", List.of("24x7 Emergency & Trauma Care"));
        extra.put("advancedFacilities", List.of("ICU", "Operation Theatre", "Diagnostic Imaging"));
        extra.put("specialties", List.of("Cardiology", "Orthopedics", "General Medicine"));
        extra.put("departmentStatuses", Map.of("Cardiology", "OPEN", "Orthopedics", "OPEN", "Pediatrics", "OPEN"));

        Hospital hospital = Hospital.builder()
                .id("hosp_citycare")
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
        hospitalRepository.save(hospital);

        log.info("Seeded demo hospital admin account: {}", email);
    }

    private void seedDoctor() {
        String email = "doctor.anand@nexusdemo.in";
        if (userRepository.existsByEmailIgnoreCase(email)) return;

        User doctorUser = User.builder()
                .id("u_demo_doctor")
                .name("Dr. Anand Rao")
                .email(email)
                .passwordHash(passwordEncoder.encode("Doctor@2026"))
                .role("DOCTOR")
                .phone("+91 90000 40002")
                .status("ACTIVE")
                .build();
        userRepository.save(doctorUser);

        Map<String, Object> doctorExtra = new LinkedHashMap<>();
        doctorExtra.put("skills", List.of("Cardiology", "Interventional Cardiology"));
        doctorExtra.put("workingDays", List.of("MON", "TUE", "WED", "THU", "FRI", "SAT"));
        doctorExtra.put("weeklySchedule", new LinkedHashMap<String, Object>());
        doctorExtra.put("notificationPreferences", new LinkedHashMap<String, Object>());

        Doctor doctor = Doctor.builder()
                .id("doc_demo_anand")
                .userId(doctorUser.getId())
                .hospitalId("hosp_citycare")
                .hospitalName("CityCare Multispeciality Hospital")
                .name("Dr. Anand Rao")
                .email(email)
                .specialization("Cardiology")
                .licenseNumber("MCI-2026-14982")
                .fee(BigDecimal.valueOf(1200))
                .status("APPROVED")
                .isActive(true)
                .extra(doctorExtra)
                .build();
        doctorRepository.save(doctor);

        log.info("Seeded demo doctor account: {}", email);
    }

    private void seedPatient() {
        String email = "patient.demo@nexusdemo.in";
        if (userRepository.existsByEmailIgnoreCase(email)) return;

        User patientUser = User.builder()
                .id("u_demo_patient")
                .name("Aarav Sharma")
                .email(email)
                .passwordHash(passwordEncoder.encode("Patient@2026"))
                .role("PATIENT")
                .phone("+91 90000 40003")
                .gender("Male")
                .dateOfBirth(java.time.LocalDate.of(1994, 4, 18))
                .status("ACTIVE")
                .build();
        userRepository.save(patientUser);

        PatientProfile profile = PatientProfile.builder()
                .userId(patientUser.getId())
                .patientHealthId("NH-IND-2026-DEMO0001")
                .bloodGroup("O+")
                .heightCm(BigDecimal.valueOf(172))
                .weightKg(BigDecimal.valueOf(70))
                .emergencyNotes("Alergic to penicillin")
                .build();
        patientProfileRepository.save(profile);

        log.info("Seeded demo patient account: {}", email);
    }
}