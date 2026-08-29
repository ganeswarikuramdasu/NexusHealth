package com.nexushealth.service.store;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * In-memory diet-plan store - mirrors Node's `mockDietPlans` (persisted to a
 * JSON file there). Seed data matches the Node defaults.
 */
@Component
public class DietPlanStore {

    private final List<Map<String, Object>> dietPlans = new ArrayList<>();

    public DietPlanStore() {
        dietPlans.add(plan("diet_101", "u_pat_1", "NH-IND-2026-88392014", "doc_1", "Dr. Rajesh V. Sharma",
                "Apollo Multi-Specialty Hospital", "Cardiovascular & Airway Protection Nutrition Regimen",
                "Low Sodium / Anti-Inflammatory", "2026-08-01", "1800 kcal", 3.2,
                Map.of("breakfast", "Oatmeal cooked with chia seeds, walnuts & low-fat almond milk (8:00 AM)",
                        "lunch", "Steamed brown rice, lentil dal, spinach sabzi & cucumber mint salad (1:00 PM)",
                        "eveningSnack", "Green tea with roasted chana or soaked almonds (5:00 PM)",
                        "dinner", "Multigrain roti, boiled green vegetables & bottle gourd soup (8:00 PM)"),
                List.of("High-sodium processed pickles", "Deep fried foods", "Refined table salt (>3g/day)", "Trans-fats"),
                List.of("Leafy greens (Spinach, Kale)", "Beetroot juice", "Raw garlic", "Omega-3 rich chia seeds"),
                "Strictly limit salt intake to maintain optimal blood pressure. Drink 3+ liters of water daily."));
        dietPlans.add(plan("diet_102", "u_pat_2", "NH-IND-2026-99281045", "doc_3", "Dr. Vikramaditya Rao",
                "Apollo Multi-Specialty Hospital", "Post-Surgical Joint & Muscle Rehabilitation Regimen",
                "High Protein / Joint Repair", "2026-07-16", "2400 kcal", 3.8,
                Map.of("breakfast", "Boiled egg whites, avocado toast on whole wheat bread & whey protein shake (8:00 AM)",
                        "lunch", "Grilled chicken breast or paneer tikka, quinoa, steamed broccoli & beetroot salad (1:30 PM)",
                        "eveningSnack", "Handful of walnuts, pumpkin seeds & pomegranate juice (5:30 PM)",
                        "dinner", "Lentil soup, grilled fish or tofu, baked sweet potato (8:30 PM)"),
                List.of("High-purine organ meats & red meat", "Refined sugary beverages", "Alcohol", "Excess sodium"),
                List.of("Collagen-rich broth", "Turmeric milk with black pepper", "Fatty fish (Salmon/Sardines)", "Citrus fruits for Vitamin C"),
                "Ensure 120g+ high quality protein daily to accelerate knee ligament graft healing and quad re-strengthening."));
    }

    private Map<String, Object> plan(String id, String pid, String healthId, String docId, String docName,
                                     String hospName, String title, String category, String createdDate,
                                     String calories, double water, Map<String, Object> meals,
                                     List<String> restricted, List<String> recommended, String advice) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("patientId", pid);
        m.put("patientHealthId", healthId);
        m.put("doctorId", docId);
        m.put("doctorName", docName);
        m.put("hospitalName", hospName);
        m.put("title", title);
        m.put("category", category);
        m.put("createdDate", createdDate);
        m.put("dailyCaloriesTarget", calories);
        m.put("waterIntakeLiters", water);
        m.put("meals", meals);
        m.put("restrictedFoods", restricted);
        m.put("recommendedFoods", recommended);
        m.put("doctorAdvice", advice);
        return m;
    }

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
