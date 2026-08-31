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
