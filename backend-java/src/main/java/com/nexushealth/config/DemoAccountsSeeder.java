package com.nexushealth.config;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.nexushealth.entity.User;
import com.nexushealth.repository.UserRepository;

/**
 * DemoAccountsSeeder
 *
 * Sets a KNOWN demo password on the 4 ORIGINAL demo accounts so the login page
 * one-tap buttons can authenticate. It is explicitly DESIGNED to be inert and
 * removable:
 *
 *   - Only runs when nexushealth.demo.seed.enabled=true (default false).
 *   - Matches the 4 accounts by EMAIL ONLY (the 4 real, pre-existing demo
 *     accounts). It NEVER creates users, consents, medical records, access
 *     cards, consent scopes or appointments.
 *   - Uses the application's own PasswordEncoder (bcrypt cost-12) so the
 *     produced hash is byte-for-byte the same format AuthService.login expects.
 *
 * Everything after a demo one-tap login is a REAL system action persisted in
 * the DB through the normal /api/auth/login flow (access sessions, audit logs,
 * consent grants, record reads, break-glass) - no sandbox, no fake data.
 *
 * Removing the demo feature later = remove the buttons on the login page +
 * flip the flag off; the original credentials/no accounts are changed: the
 * demo accounts simply keep whatever password the seeder last set.
 *
 * Demo accounts (emailed back by the plan):
 *   PATIENT        kamalakuramdasu1@gmail.com  Kamala@2006
 *   DOCTOR         divya@gmail.com             Divya@2006
 *   HOSPITAL_ADMIN demo@gmail.com              Ganeswari@2006
 *   SUPER_ADMIN    ganeswarikuramdasu@gmail.com Admin@Nexus2026!
 */
@Component
public class DemoAccountsSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoAccountsSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${nexushealth.demo.seed.enabled:false}")
    private boolean seedEnabled;

    public DemoAccountsSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!seedEnabled) {
            log.info("[demo-seed] disabled (nexushealth.demo.seed.enabled=false) - no demo password changes");
            return;
        }

        String[][] demo = {
            {"PATIENT",        "kamalakuramdasu1@gmail.com",   "Kamala@2006"},
            {"DOCTOR",         "divya@gmail.com",              "Divya@2006"},
            {"HOSPITAL_ADMIN", "demo@gmail.com",               "Ganeswari@2006"},
            {"SUPER_ADMIN",    "ganeswarikuramdasu@gmail.com", "Admin@Nexus2026!"},
        };

        for (String[] a : demo) {
            String role = a[0];
            String email = a[1];
            String plain = a[2];

            userRepository.findByEmailIgnoreCase(email).ifPresentOrElse(user -> {
                if (!role.equals(user.getRole())) {
                    log.warn("[demo-seed] email {} exists but role={} (expected {}) - SKIPPED "
                            + "(never touch an account of a different role)", email, user.getRole(), role);
                    return;
                }
                user.setPasswordHash(passwordEncoder.encode(plain));
                user.setUpdatedAt(LocalDateTime.now());
                userRepository.save(user);
                log.info("[demo-seed] set demo password on {} <{}>", role, email);
            }, () -> log.warn("[demo-seed] email {} not found (role {}) - skipped; no account created", email, role));
        }

        log.info("[demo-seed] done. Demo one-tap now authenticates these original accounts.");
    }
}
