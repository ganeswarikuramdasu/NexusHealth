package com.nexushealth.service.store;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory hospital equipment inventory - mirrors Node's
 * `mockEquipmentInventory` (persisted to a JSON file). Keyed by hospitalId.
 */
@Component
public class EquipmentStore {

    private final Map<String, List<Map<String, Object>>> inventory = new ConcurrentHashMap<>();

    public EquipmentStore() {
        inventory.put("hosp_1", new ArrayList<>(List.of(
                eq("eq_1", "High-End ICU Mechanical Ventilator", "Critical Care", "OPERATIONAL", 18, "ICU Wing - 3rd Floor", "2026-07-15", "VENT-APO-9021"),
                eq("eq_2", "1.5 Tesla Superconducting MRI Scanner", "Radiology & Imaging", "OPERATIONAL", 2, "Radiology Basement B1", "2026-06-20", "MRI-GE-8830"),
                eq("eq_3", "128-Slice Cardiac CT Scanner", "Radiology & Imaging", "OPERATIONAL", 3, "Radiology Basement B1", "2026-07-01", "CT-SIEM-4410"),
                eq("eq_4", "Patient Multipara Vital Monitors", "Cardiology Wards", "OPERATIONAL", 45, "Cardiology Wards A & B", "2026-07-28", "MON-PHIL-2201"),
                eq("eq_5", "Medical Oxygen Cylinders (D-Type 47L)", "Emergency Reserves", "OPERATIONAL", 85, "Central Oxygen Bank", "2026-08-02", "O2-RES-100")
        )));
        inventory.put("hosp_2", new ArrayList<>(List.of(
                eq("eq_10", "Non-Invasive BiPAP & CPAP Systems", "Pulmonology Care", "OPERATIONAL", 12, "Respiratory Care Unit", "2026-07-10", "BIPAP-MAX-301"),
                eq("eq_11", "Hemodialysis Machines (Online HDF)", "Nephrology Suite", "OPERATIONAL", 8, "Dialysis Suite - 2nd Floor", "2026-07-22", "DIAL-FRES-881"),
                eq("eq_12", "Advanced Cardiac Defibrillators", "Emergency ER", "OPERATIONAL", 10, "Emergency Trauma Care", "2026-08-01", "DEFIB-ZOLL-55")
        )));
    }

    private Map<String, Object> eq(String id, String name, String category, String status, int qty,
                                   String location, String lastMaintenance, String serialNumber) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("name", name);
        m.put("category", category);
        m.put("status", status);
        m.put("quantity", qty);
        m.put("location", location);
        m.put("lastMaintenance", lastMaintenance);
        m.put("serialNumber", serialNumber);
        return m;
    }

    public synchronized List<Map<String, Object>> forHospital(String hospitalId) {
        String key = hospitalId != null ? hospitalId : "hosp_1";
        List<Map<String, Object>> list = inventory.get(key);
        if (list == null) list = inventory.get("hosp_1");
        return list != null ? list : List.of();
    }

    public synchronized Map<String, Object> add(Map<String, Object> data) {
        String key = data.get("hospitalId") != null ? String.valueOf(data.get("hospitalId")) : "hosp_1";
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", "eq_" + System.currentTimeMillis());
        item.put("name", data.get("name") != null ? data.get("name") : "Medical Device");
        item.put("category", data.get("category") != null ? data.get("category") : "General ICU");
        item.put("status", data.get("status") != null ? data.get("status") : "OPERATIONAL");
        item.put("quantity", data.get("quantity") != null ? Integer.parseInt(String.valueOf(data.get("quantity"))) : 1);
        item.put("location", data.get("location") != null ? data.get("location") : "Central Ward");
        item.put("lastMaintenance", data.get("lastMaintenance") != null ? data.get("lastMaintenance") : java.time.LocalDate.now().toString());
        item.put("serialNumber", data.get("serialNumber") != null ? data.get("serialNumber")
                : "DEV-" + (1000 + (int) (Math.random() * 9000)));
        inventory.computeIfAbsent(key, k -> new ArrayList<>()).add(0, item);
        return item;
    }
}
