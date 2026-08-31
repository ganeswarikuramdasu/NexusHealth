package com.nexushealth.service;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
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
