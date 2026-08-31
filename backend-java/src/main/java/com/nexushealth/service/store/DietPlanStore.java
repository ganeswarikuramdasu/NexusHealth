package com.nexushealth.service.store;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * In-memory diet-plan store - mirrors Node's `mockDietPlans` (persisted to a
 * JSON file there). Plans are added at runtime by approved doctors; the store
 * starts empty.
 */
@Component
public class DietPlanStore {

    private final List<Map<String, Object>> dietPlans = new ArrayList<>();

    public synchronized List<Map<String, Object>> forPatient(String patientId) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> p : dietPlans) {
            if (patientId.equals(p.get("patientId"))) out.add(p);
        }
        return out;
    }

    public synchronized Map<String, Object> add(Map<String, Object> data) {
        Map<String, Object> out = new LinkedHashMap<>(data);
        out.put("id", "diet_" + System.currentTimeMillis());
        out.put("createdDate", java.time.LocalDate.now().toString());
        dietPlans.add(0, out);
        return out;
    }
}
