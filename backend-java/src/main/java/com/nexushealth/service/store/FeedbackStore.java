package com.nexushealth.service.store;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * In-memory feedback store - mirrors Node's `mockFeedbacks` (persisted to a
 * JSON file there). Seed data matches the Node defaults so the frontend
 * renders the same doctors' reviews.
 */
@Component
public class FeedbackStore {

    private final List<Map<String, Object>> feedbacks = new ArrayList<>();

    public FeedbackStore() {
        feedbacks.add(fb("fb_101", "u_pat_1", "Ananya Sharma", "doc_1", "Dr. Rajesh V. Sharma",
                5, "Extremely thorough diagnosis! Dr. Rajesh listened patiently and explained the X-ray and cardiovascular results clearly.",
                "2026-07-29T14:30:00Z"));
        feedbacks.add(fb("fb_102", "u_pat_2", "Rohan Verma", "doc_3", "Dr. Vikramaditya Rao",
                5, "Outstanding orthopedic surgeon! Successful ACL surgery with minimal scarring and clear rehabilitation guidance.",
                "2026-07-20T11:15:00Z"));
        feedbacks.add(fb("fb_103", "u_pat_1", "Ananya Sharma", "doc_2", "Dr. Priya Sundaram",
                5, "Excellent pulmonologist! Provided accurate allergy medication and asthma prevention advice.",
                "2026-08-03T09:40:00Z"));
    }

    private Map<String, Object> fb(String id, String pid, String pName, String docId, String docName,
                                   int rating, String comment, String createdAt) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("patientId", pid);
        m.put("patientName", pName);
        m.put("doctorId", docId);
        m.put("doctorName", docName);
        m.put("rating", rating);
        m.put("comment", comment);
        m.put("createdAt", createdAt);
        return m;
    }

    public synchronized List<Map<String, Object>> forDoctor(String doctorId) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> f : feedbacks) {
            if (doctorId.equals(f.get("doctorId"))) out.add(f);
        }
        return out;
    }

    public synchronized Map<String, Object> add(Map<String, Object> data) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", "fb_" + System.currentTimeMillis());
        out.put("patientId", data.get("patientId"));
        out.put("patientName", data.get("patientName"));
        out.put("doctorId", data.get("doctorId"));
        out.put("doctorName", data.get("doctorName"));
        out.put("rating", data.get("rating") != null ? data.get("rating") : 5);
        out.put("comment", data.get("comment") != null ? data.get("comment") : "");
        out.put("createdAt", java.time.OffsetDateTime.now().toString());
        feedbacks.add(0, out);
        return out;
    }
}
