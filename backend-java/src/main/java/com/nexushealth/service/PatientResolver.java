package com.nexushealth.service;

import com.nexushealth.entity.PatientProfile;
import com.nexushealth.entity.User;
import com.nexushealth.repository.PatientProfileRepository;
import com.nexushealth.repository.UserRepository;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class PatientResolver {

    private final PatientProfileRepository patientProfileRepository;
    private final UserRepository userRepository;

    public PatientResolver(PatientProfileRepository patientProfileRepository, UserRepository userRepository) {
        this.patientProfileRepository = patientProfileRepository;
        this.userRepository = userRepository;
    }

    public static class Resolved {
        public String userId;
        public String globalHealthId;
        public String name;
        public String email;
        public PatientProfile profile;
        public User user;
    }

    /** identifier can be a user id, a Global Health ID, an email, or a patient name. */
    public Optional<Resolved> resolve(String identifier) {
        if (identifier == null || identifier.isBlank()) return Optional.empty();

        PatientProfile profile = patientProfileRepository.findById(identifier).orElse(null);
        if (profile == null) profile = patientProfileRepository.findByPatientHealthId(identifier).orElse(null);

        User user;
        if (profile != null) {
            user = userRepository.findById(profile.getUserId()).orElse(null);
        } else {
            user = userRepository.findByEmailIgnoreCaseAndRole(identifier, "PATIENT").orElse(null);
            if (user != null) profile = patientProfileRepository.findById(user.getId()).orElse(null);
        }

        // Fallback: name-based lookup (only if no match found yet)
        if (profile == null || user == null) {
            List<User> nameMatches = userRepository.findByNameContainingIgnoreCaseAndRole(identifier.trim(), "PATIENT");
            if (nameMatches.size() == 1) {
                user = nameMatches.get(0);
                profile = patientProfileRepository.findById(user.getId()).orElse(null);
            } else if (nameMatches.size() > 1) {
                user = nameMatches.get(0);
                profile = patientProfileRepository.findById(user.getId()).orElse(null);
            }
        }

        if (profile == null || user == null) return Optional.empty();

        Resolved r = new Resolved();
        r.userId = profile.getUserId();
        r.globalHealthId = profile.getPatientHealthId();
        r.name = user.getName();
        r.email = user.getEmail();
        r.profile = profile;
        r.user = user;
        return Optional.of(r);
    }

    public Map<String, Object> toPublicProfile(Resolved r) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("userId", r.userId);
        out.put("globalHealthId", r.globalHealthId);
        out.put("id", r.userId);
        out.put("name", r.name);
        out.put("email", r.email);
        out.put("phone", r.user.getPhone());
        out.put("dob", r.user.getDateOfBirth());
        out.put("gender", r.user.getGender());
        out.put("bloodGroup", r.profile.getBloodGroup());
        out.put("heightCm", r.profile.getHeightCm());
        out.put("weightKg", r.profile.getWeightKg());
        String[] emg = parseEmergencyContact(r.profile.getEmergencyNotes());
        out.put("emergencyContactName", emg != null ? emg[0] : null);
        out.put("emergencyContactPhone", emg != null ? emg[1] : null);
        out.put("emergencyContactRelation", emg != null ? "Relative" : null);
        out.put("allergies", java.util.List.of());
        out.put("chronicConditions", java.util.List.of());
        return out;
    }

    /** Parses emergency contact info stored as "Emergency contact: NAME PHONE" in emergency_notes. */
    public static String[] parseEmergencyContact(String notes) {
        if (notes == null || notes.isBlank()) return null;
        String s = notes.trim();
        String lower = s.toLowerCase();
        if (lower.startsWith("emergency contact:")) {
            s = s.substring("emergency contact:".length()).trim();
        } else if (lower.startsWith("emergency contact")) {
            s = s.substring("emergency contact".length()).trim();
        }
        if (s.isEmpty()) return null;
        String[] tokens = s.split("\\s+");
        int phoneStart = tokens.length;
        for (int i = tokens.length - 1; i >= 0; i--) {
            String t = tokens[i];
            if (t.contains("+") || t.matches("[0-9]+") || t.matches("[0-9]{2,}-[0-9]+")) {
                phoneStart = i;
            } else {
                break;
            }
        }
        if (phoneStart <= 0 || phoneStart >= tokens.length) return null;
        String name = String.join(" ", java.util.Arrays.copyOfRange(tokens, 0, phoneStart)).trim();
        String phone = String.join(" ", java.util.Arrays.copyOfRange(tokens, phoneStart, tokens.length)).trim();
        if (name.isEmpty() || phone.isEmpty()) return null;
        return new String[] { name, phone };
    }
}
