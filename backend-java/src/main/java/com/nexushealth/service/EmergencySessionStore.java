package com.nexushealth.service;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * In-memory singleton mirror of the Node mockEmergencySessions /
 * mockEmergencyProfiles / mockEmergencyContacts / mockEmergencyNotifications
 * arrays from store.ts. Emergency sessions and patient emergency profile
 * edits are ephemeral (not backed by a persistent entity), matching the
 * Node behavior exactly. Map + concurrent lists are used since these can be
 * mutated from multiple request threads.
 */
@Component
public class EmergencySessionStore {

    /**
     * Sessions are ordered most-recent-first (Node uses unshift). We keep
     * insertion order with a CopyOnWriteArrayList; new sessions are added at
     * index 0 so iteration order matches the Node mock array ordering.
     */
    private final CopyOnWriteArrayList<Map<String, Object>> sessions = new CopyOnWriteArrayList<>();

    private final ConcurrentHashMap<String, Map<String, Object>> profiles = new ConcurrentHashMap<>();

    private final ConcurrentHashMap<String, List<Map<String, Object>>> contacts = new ConcurrentHashMap<>();

    private final CopyOnWriteArrayList<Map<String, Object>> notifications = new CopyOnWriteArrayList<>();

    public EmergencySessionStore() {
        seedProfilesAndContacts();
    }

    private void seedProfilesAndContacts() {
        profiles.put("u_pat_1", emergencyProfile(
                "u_pat_1", "NH-IND-2026-88392014", "B+",
                List.of("Penicillin", "Dust Mites", "NSAIDs (Ibuprofen)"),
                List.of("Mild Allergic Asthma"),
                List.of("Levosalbutamol Inhaler 100mcg"),
                "In case of acute respiratory distress, administer bronchodilator nebulization immediately. Avoid Penicillin.",
                "Dr. Rajesh V. Sharma (Apollo Multi-Specialty Hospital)"));

        contacts.put("u_pat_1", List.of(
                contact("econt_1", "u_pat_1", "Vikram Sharma", "Brother", "+91 98765 43210", 1),
                contact("econt_2", "u_pat_1", "Sunita Sharma", "Mother", "+91 98765 11223", 2)));

        profiles.put("u_pat_2", emergencyProfile(
                "u_pat_2", "NH-IND-2026-99281045", "A+",
                List.of("Shellfish / Crustaceans", "Sulfa Antibiotics"),
                List.of("Post-ACL Reconstruction Rehab"),
                List.of("Paracetamol 650mg as needed", "Vitamin D3 60,000 IU"),
                "Recent left knee ACL hamstring autograft surgery (July 2026). Protect left knee joint.",
                "Dr. Vikramaditya Rao (Apollo Multi-Specialty Hospital)"));

        contacts.put("u_pat_2", List.of(
                contact("econt_3", "u_pat_2", "Pooja Verma", "Spouse", "+91 98112 33445", 1),
                contact("econt_4", "u_pat_2", "Suresh Verma", "Father", "+91 98112 88990", 2)));
    }

    private Map<String, Object> emergencyProfile(String userId, String patientHealthId, String bloodGroup,
                                                 List<String> allergies, List<String> criticalConditions,
                                                 List<String> currentMedications, String emergencyNotes,
                                                 String primaryPhysician) {
        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("userId", userId);
        profile.put("patientHealthId", patientHealthId);
        profile.put("bloodGroup", bloodGroup);
        profile.put("allergies", new ArrayList<>(allergies));
        profile.put("criticalConditions", new ArrayList<>(criticalConditions));
        profile.put("currentMedications", new ArrayList<>(currentMedications));
        profile.put("emergencyNotes", emergencyNotes);
        profile.put("primaryPhysician", primaryPhysician);
        profile.put("updatedAt", Instant.now().toString());
        return profile;
    }

    private Map<String, Object> contact(String id, String patientId, String name,
                                        String relationship, String phone, int priority) {
        Map<String, Object> c = new LinkedHashMap<>();
        c.put("id", id);
        c.put("patientId", patientId);
        c.put("name", name);
        c.put("relationship", relationship);
        c.put("phone", phone);
        c.put("priority", priority);
        return c;
    }

    // ---- Sessions ----

    public List<Map<String, Object>> allSessions() {
        return sessions;
    }

    public void unshiftSession(Map<String, Object> session) {
        sessions.add(0, session);
    }

    public Map<String, Object> findSession(String sessionId) {
        for (Map<String, Object> s : sessions) {
            if (sessionId.equals(s.get("id"))) return s;
        }
        return null;
    }

    public List<Map<String, Object>> sessionsForPatient(String userId, String patientHealthId) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> s : sessions) {
            if (userId.equals(s.get("patientId")) || patientHealthId.equals(s.get("patientHealthId"))) {
                out.add(s);
            }
        }
        return out;
    }

    public List<Map<String, Object>> sessionsForHospital(String hospitalId) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> s : sessions) {
            if (hospitalId.equals(s.get("hospitalId"))) out.add(s);
        }
        return out;
    }

    // ---- Profiles ----

    public Map<String, Object> getProfile(String userId) {
        return profiles.get(userId);
    }

    public void putProfile(String userId, Map<String, Object> profile) {
        profiles.put(userId, profile);
    }

    // ---- Contacts ----

    public List<Map<String, Object>> getContacts(String userId) {
        return contacts.getOrDefault(userId, new ArrayList<>());
    }

    public void putContacts(String userId, List<Map<String, Object>> contactList) {
        contacts.put(userId, contactList != null ? contactList : new ArrayList<>());
    }

    // ---- Notifications ----

    public void unshiftNotification(Map<String, Object> notification) {
        notifications.add(0, notification);
    }

    public List<Map<String, Object>> notificationsForPatient(String patientId) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> n : notifications) {
            if (patientId.equals(n.get("patientId"))) out.add(n);
        }
        return out;
    }

    public Map<String, Object> findNotification(String notificationId) {
        for (Map<String, Object> n : notifications) {
            if (notificationId.equals(n.get("id"))) return n;
        }
        return null;
    }
}
