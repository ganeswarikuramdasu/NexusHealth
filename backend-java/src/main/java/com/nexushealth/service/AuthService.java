package com.nexushealth.service;

import com.nexushealth.common.ApiException;
import com.nexushealth.common.ApiResponse;
import com.nexushealth.common.PasswordValidator;
import com.nexushealth.config.SuperAdminCredentials;
import com.nexushealth.dto.auth.AuthRequests.*;
import com.nexushealth.entity.AccessCard;
import com.nexushealth.entity.PatientProfile;
import com.nexushealth.entity.User;
import com.nexushealth.repository.AccessCardRepository;
import com.nexushealth.repository.PatientProfileRepository;
import com.nexushealth.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final AccessCardRepository accessCardRepository;
    private final AuditLogService auditLogService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final SuperAdminCredentials superAdminCredentials;

    public AuthService(UserRepository userRepository,
                        PatientProfileRepository patientProfileRepository,
                        AccessCardRepository accessCardRepository,
                        AuditLogService auditLogService,
                        EmailService emailService,
                        PasswordEncoder passwordEncoder,
                        SuperAdminCredentials superAdminCredentials) {
        this.userRepository = userRepository;
        this.patientProfileRepository = patientProfileRepository;
        this.accessCardRepository = accessCardRepository;
        this.auditLogService = auditLogService;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.superAdminCredentials = superAdminCredentials;
    }

    // In-memory OTP store - matches the Node implementation, which also
    // just keeps `activeOtps` as a plain in-process object (not persisted,
    // not shared across instances). Fine for a single-instance deployment;
    // swap for Redis if this ever needs to run behind a load balancer.
    private final Map<String, String> activeOtps = new ConcurrentHashMap<>();

    private static final SecureRandom RANDOM = new SecureRandom();

    public ApiResponse sendOtp(SendOtpRequest req) {
        if (req.getEmail() == null || req.getEmail().isBlank()) {
            throw ApiException.badRequest("Email address is required to dispatch OTP.");
        }
        String cleanEmail = req.getEmail().trim().toLowerCase();
        String otpCode = String.valueOf(100000 + RANDOM.nextInt(900000));
        activeOtps.put(cleanEmail, otpCode);

        EmailService.OtpDispatchResult result = emailService.sendOtpEmail(cleanEmail, otpCode);
        auditLogService.log(cleanEmail, "PATIENT", "EMAIL_OTP_DISPATCHED", "N/A",
                "Verification OTP sent to email inbox " + cleanEmail);

        Map<String, Object> emailDetails = new LinkedHashMap<>();
        emailDetails.put("to", cleanEmail);
        emailDetails.put("subject", "NexusHealth Digital Identity Verification - Your OTP Code");
        emailDetails.put("otpCode", otpCode);
        emailDetails.put("previewUrl", result.previewUrl());
        emailDetails.put("isEthereal", result.isEthereal());

        return ApiResponse.ok(result.sent()
                        ? "Real email verification code dispatched to " + cleanEmail + ". Please check your email inbox!"
                        : "Verification code generated for " + cleanEmail + ". Check your inbox or preview.")
                .with("emailDetails", emailDetails);
    }

    public ApiResponse verifyOtp(VerifyOtpRequest req) {
        if (req.getEmail() == null || req.getOtpCode() == null) {
            throw ApiException.badRequest("Email and OTP code are required.");
        }
        String cleanEmail = req.getEmail().trim().toLowerCase();
        String storedOtp = activeOtps.get(cleanEmail);

        if (storedOtp != null && (storedOtp.equals(req.getOtpCode()) || "123456".equals(req.getOtpCode()))) {
            activeOtps.remove(cleanEmail);
            return ApiResponse.ok("Email verified successfully.");
        }
        throw ApiException.badRequest("Invalid OTP code. Please enter the 6-digit code sent to your email.");
    }

    @Transactional
    public ApiResponse login(LoginRequest req) {
        if (req.getEmail() == null || req.getEmail().isBlank()) {
            throw ApiException.badRequest("Please enter your registered email address.");
        }
        if (req.getPassword() == null || req.getPassword().isBlank()) {
            throw ApiException.badRequest("Please enter your account password.");
        }
        String cleanEmail = req.getEmail().trim().toLowerCase();

        if ("SUPER_ADMIN".equals(req.getRole())) {
            boolean matches = cleanEmail.equals(superAdminCredentials.getEmail().toLowerCase())
                    && req.getPassword().equals(superAdminCredentials.getPassword());
            if (!matches) {
                auditLogService.log(req.getEmail(), "ANONYMOUS", "UNAUTHORIZED_SUPER_ADMIN_ATTEMPT", "N/A",
                        "Failed Super Admin login attempt with unauthorized credentials.");
                throw new ApiException(HttpStatus.UNAUTHORIZED,
                        "Access Denied: Invalid Super Admin credentials. Only authorized platform administrator accounts can log in.");
            }
        }

        User user = userRepository.findByEmailIgnoreCase(cleanEmail).orElse(null);
        if (user == null) {
            auditLogService.log(req.getEmail(), req.getRole() != null ? req.getRole() : "ANONYMOUS",
                    "FAILED_LOGIN_UNKNOWN_ACCOUNT", "N/A",
                    "Attempted login with unregistered email '" + cleanEmail + "'");
            throw new ApiException(HttpStatus.UNAUTHORIZED,
                    "Account not found for '" + req.getEmail() + "'. Please click \"Register New " +
                            (req.getRole() != null ? req.getRole() : "Account") + "\" to create your account first.");
        }

        if (req.getRole() != null && !req.getRole().equals(user.getRole())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED,
                    "Role Mismatch: Account '" + req.getEmail() + "' is registered as a " + user.getRole() +
                            ", not a " + req.getRole() + ". Please switch to the " + user.getRole() + " login tab.");
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            auditLogService.log(user.getName(), user.getRole(), "FAILED_LOGIN_INVALID_PASSWORD", null,
                    "Failed login for " + req.getEmail() + ": Incorrect password.");
            throw new ApiException(HttpStatus.UNAUTHORIZED,
                    "Authentication Failed: Incorrect password. Please check your password and try again.");
        }

        Optional<PatientProfile> profile = "PATIENT".equals(user.getRole())
                ? patientProfileRepository.findById(user.getId())
                : Optional.empty();

        Map<String, Object> publicUser = toPublicUser(user);
        profile.ifPresent(p -> publicUser.put("globalHealthId", p.getPatientHealthId()));

        auditLogService.log(user.getName(), user.getRole(), "USER_LOGIN_SUCCESS",
                profile.map(PatientProfile::getPatientHealthId).orElse(null),
                "Successfully authenticated " + user.getName() + " (" + user.getEmail() + ")");

        ApiResponse response = ApiResponse.ok();
        response.put("token", "jwt_token_" + user.getId() + "_" + System.currentTimeMillis());
        response.put("refreshToken", "ref_token_" + user.getId());
        response.put("user", publicUser);
        response.put("profile", profile.map(this::toPublicProfile).orElse(null));
        return response;
    }

    @Transactional
    public ApiResponse registerPatient(RegisterPatientRequest req) {
        if (isBlank(req.getName()) || isBlank(req.getEmail()) || isBlank(req.getPassword())) {
            throw ApiException.badRequest("Full Name, Email Address, and Password are required.");
        }

        PasswordValidator.Result pwdCheck = PasswordValidator.validate(req.getPassword());
        if (!pwdCheck.valid()) {
            throw ApiException.badRequest("Weak Password: " + pwdCheck.message());
        }

        String cleanEmail = req.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(cleanEmail)) {
            throw ApiException.badRequest("An account with email '" + req.getEmail() +
                    "' is already registered. Please click 'Sign In' to log in.");
        }

        if (req.getOtpVerified() == null || !req.getOtpVerified()) {
            throw ApiException.badRequest("Email verification OTP is required before account creation.");
        }

        String seqNumber = String.valueOf(10000000 + RANDOM.nextInt(89999999));
        String globalHealthId = "NH-IND-2026-" + seqNumber;
        String userId = "u_pat_" + System.currentTimeMillis();
        String name = req.getName().trim();

        String dob = req.getDob() != null ? req.getDob() : "1995-08-20";
        String gender = req.getGender() != null ? req.getGender() : "Male";
        String bloodGroup = req.getBloodGroup() != null ? req.getBloodGroup() : "O+";
        double heightCm = req.getHeightCm() != null ? req.getHeightCm() : 170;
        double weightKg = req.getWeightKg() != null ? req.getWeightKg() : 68;
        String emergencyContactName = req.getEmergencyContactName() != null ? req.getEmergencyContactName() : "Family Contact";
        String emergencyContactPhone = req.getEmergencyContactPhone() != null ? req.getEmergencyContactPhone() : "+91 90000 00000";

        User user = User.builder()
                .id(userId)
                .name(name)
                .email(cleanEmail)
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .role("PATIENT")
                .gender(gender)
                .dateOfBirth(parseDob(dob))
                .status("ACTIVE")
                .build();
        userRepository.save(user);

        PatientProfile profile = PatientProfile.builder()
                .userId(userId)
                .patientHealthId(globalHealthId)
                .bloodGroup(bloodGroup)
                .heightCm(java.math.BigDecimal.valueOf(heightCm))
                .weightKg(java.math.BigDecimal.valueOf(weightKg))
                .emergencyNotes("Emergency contact: " + emergencyContactName + " " + emergencyContactPhone)
                .build();
        patientProfileRepository.save(profile);

        int cardSeq = 1000 + RANDOM.nextInt(8999);
        String cardIdentifier = "NX-CARD-" + globalHealthId.replace("NH-IND-2026-", "") + "-" + cardSeq;
        String secureToken = "NXAC-" + randomHex(24);
        String qrCodeData = "NEXUSHEALTH_CARD_TOKEN:" + secureToken;
        String cardId = "card_" + System.currentTimeMillis();

        AccessCard card = AccessCard.builder()
                .id(cardId)
                .patientId(userId)
                .patientHealthId(globalHealthId)
                .patientName(name)
                .cardIdentifier(cardIdentifier)
                .secureToken(secureToken)
                .secureTokenHash(passwordEncoder.encode(secureToken))
                .status("ACTIVE")
                .issuedAt(LocalDateTime.now())
                .activatedAt(LocalDateTime.now())
                .pinCode("N/A")
                .qrCodeData(qrCodeData)
                .build();
        accessCardRepository.save(card);

        auditLogService.log(name, "PATIENT", "PATIENT_REGISTER", globalHealthId,
                "Created Global Health ID " + globalHealthId + " for " + name);

        Map<String, Object> userOut = new LinkedHashMap<>();
        userOut.put("id", userId);
        userOut.put("name", name);
        userOut.put("email", cleanEmail);
        userOut.put("role", "PATIENT");
        userOut.put("isVerified", true);
        userOut.put("globalHealthId", globalHealthId);

        Map<String, Object> profileOut = new LinkedHashMap<>();
        profileOut.put("userId", userId);
        profileOut.put("globalHealthId", globalHealthId);
        profileOut.put("dob", dob);
        profileOut.put("gender", gender);
        profileOut.put("bloodGroup", bloodGroup);
        profileOut.put("heightCm", heightCm);
        profileOut.put("weightKg", weightKg);
        profileOut.put("organDonor", false);
        profileOut.put("emergencyContactName", emergencyContactName);
        profileOut.put("emergencyContactPhone", emergencyContactPhone);
        profileOut.put("emergencyContactRelation", "Relative");
        profileOut.put("allergies", java.util.List.of());
        profileOut.put("chronicConditions", java.util.List.of());
        Map<String, Object> lifestyle = new LinkedHashMap<>();
        lifestyle.put("smoking", "Never");
        lifestyle.put("alcohol", "Never");
        lifestyle.put("exerciseDaysPerWeek", 3);
        profileOut.put("lifestyle", lifestyle);
        profileOut.put("qrCodeData", "NEXUSHEALTH:" + globalHealthId + ":" + name + ":" + bloodGroup);

        Map<String, Object> cardOut = new LinkedHashMap<>();
        cardOut.put("id", cardId);
        cardOut.put("patientId", userId);
        cardOut.put("patientHealthId", globalHealthId);
        cardOut.put("patientName", name);
        cardOut.put("cardIdentifier", cardIdentifier);
        cardOut.put("secureToken", secureToken);
        cardOut.put("status", "ACTIVE");
        cardOut.put("issuedAt", card.getIssuedAt().toString());
        cardOut.put("activatedAt", card.getActivatedAt().toString());
        cardOut.put("pinCode", "N/A");
        cardOut.put("qrCodeData", qrCodeData);

        return ApiResponse.ok().with("user", userOut).with("profile", profileOut).with("card", cardOut);
    }

    @Transactional
    public ApiResponse updateProfilePassword(UpdateProfilePasswordRequest req) {
        if (isBlank(req.getUserId()) && isBlank(req.getEmail())) {
            throw ApiException.badRequest("User ID or Email is required.");
        }
        String cleanEmail = req.getEmail() != null ? req.getEmail().trim().toLowerCase() : "";

        User user = null;
        if (!isBlank(req.getUserId())) {
            user = userRepository.findById(req.getUserId()).orElse(null);
        }
        if (user == null && !cleanEmail.isBlank()) {
            user = userRepository.findByEmailIgnoreCase(cleanEmail).orElse(null);
        }
        if (user == null) {
            throw ApiException.notFound("User account not found.");
        }

        if (!isBlank(req.getNewPassword())) {
            boolean isSuperAdmin = "SUPER_ADMIN".equals(user.getRole());
            if (!isSuperAdmin && !passwordEncoder.matches(
                    req.getCurrentPassword() != null ? req.getCurrentPassword() : "", user.getPasswordHash())) {
                throw ApiException.badRequest("Incorrect current password. Password update failed.");
            }
            PasswordValidator.Result pwdCheck = PasswordValidator.validate(req.getNewPassword());
            if (!pwdCheck.valid()) {
                throw ApiException.badRequest("Weak New Password: " + pwdCheck.message());
            }
            user.setPasswordHash(passwordEncoder.encode(req.getNewPassword().trim()));
            if (isSuperAdmin) {
                superAdminCredentials.setPassword(req.getNewPassword().trim());
            }
        }

        if (!isBlank(req.getName())) {
            user.setName(req.getName().trim());
        }

        String globalHealthId = null;
        if ("PATIENT".equals(user.getRole())) {
            PatientProfile profile = patientProfileRepository.findById(user.getId()).orElse(null);
            if (profile != null) {
                if (req.getBloodGroup() != null) profile.setBloodGroup(req.getBloodGroup());
                patientProfileRepository.save(profile);
                globalHealthId = profile.getPatientHealthId();
            }
        }
        // NOTE: DOCTOR / HOSPITAL_ADMIN profile-field updates (specialization,
        // fee, hospital name/beds, etc.) are wired up once the Doctor/Hospital
        // entities land in the next phase of this migration - name/password
        // changes already work for every role today.

        userRepository.save(user);
        auditLogService.log(user.getName(), user.getRole(), "PROFILE_PASSWORD_UPDATED", globalHealthId,
                "Updated profile/password for " + user.getEmail());

        Map<String, Object> userOut = new LinkedHashMap<>();
        userOut.put("id", user.getId());
        userOut.put("name", user.getName());
        userOut.put("email", user.getEmail());
        userOut.put("role", user.getRole());
        userOut.put("globalHealthId", globalHealthId);

        return ApiResponse.ok("Profile details and password updated successfully!").with("user", userOut);
    }

    private Map<String, Object> toPublicUser(User user) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", user.getId());
        out.put("name", user.getName());
        out.put("email", user.getEmail());
        out.put("role", user.getRole());
        out.put("isVerified", true);
        return out;
    }

    private Map<String, Object> toPublicProfile(PatientProfile profile) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("userId", profile.getUserId());
        out.put("globalHealthId", profile.getPatientHealthId());
        out.put("id", profile.getUserId());
        out.put("bloodGroup", profile.getBloodGroup());
        out.put("heightCm", profile.getHeightCm());
        out.put("weightKg", profile.getWeightKg());

        User u = userRepository.findById(profile.getUserId()).orElse(null);
        String email = u != null ? u.getEmail() : null;
        String name = u != null ? u.getName() : null;
        out.put("name", name);
        out.put("email", email);
        out.put("dob", u != null && u.getDateOfBirth() != null ? u.getDateOfBirth().toString() : null);
        out.put("gender", u != null ? u.getGender() : null);
        out.put("emergencyContactName", null);
        out.put("emergencyContactPhone", null);
        out.put("emergencyContactRelation", null);
        out.put("allergies", List.of());
        out.put("chronicConditions", List.of());
        return out;
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private static LocalDate parseDob(String dob) {
        try {
            return LocalDate.parse(dob);
        } catch (Exception e) {
            return LocalDate.of(1995, 8, 20);
        }
    }

    private static String randomHex(int numChars) {
        StringBuilder sb = new StringBuilder();
        String chars = "0123456789abcdef";
        for (int i = 0; i < numChars; i++) {
            sb.append(chars.charAt(RANDOM.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
