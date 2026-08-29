package com.nexushealth.service;

import com.nexushealth.entity.PatientProfile;
import com.nexushealth.entity.User;
import com.nexushealth.repository.PatientProfileRepository;
import com.nexushealth.repository.UserRepository;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
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

    /** identifier can be a user id, a Global Health ID, or an email. */
    public Optional<Resolved> resolve(String identifier) {
        if (identifier == null || identifier.isBlank()) return Optional.empty();

        PatientProfile profile = patientProfileRepository.findById(identifier).orElse(null);
        if (profile == null) profile = patientProfileRepository.findByPatientHealthId(identifier).orElse(null);

        User user;
        if (profile != null) {
            user = userRepository.findById(profile.getUserId()).orElse(null);
        } else {
            user = userRepository.findByEmailIgnoreCase(identifier).orElse(null);
            if (user != null) profile = patientProfileRepository.findById(user.getId()).orElse(null);
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
        out.put("dob", r.user.getDateOfBirth());
        out.put("gender", r.user.getGender());
        out.put("bloodGroup", r.profile.getBloodGroup());
        out.put("heightCm", r.profile.getHeightCm());
        out.put("weightKg", r.profile.getWeightKg());
        out.put("emergencyContactName", null);
        out.put("emergencyContactPhone", null);
        out.put("emergencyContactRelation", null);
        out.put("allergies", java.util.List.of());
        out.put("chronicConditions", java.util.List.of());
        return out;
    }
}
