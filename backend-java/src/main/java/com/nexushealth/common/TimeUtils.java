package com.nexushealth.common;

public final class TimeUtils {

    private TimeUtils() {
    }

    /** "10:30 AM" -> 630 */
    public static int timeToMins(String timeStr) {
        if (timeStr == null || timeStr.isBlank()) return 0;
        boolean isPm = false;
        String body = timeStr.trim();
        if (body.toLowerCase().endsWith("pm")) {
            isPm = true;
            body = body.substring(0, body.length() - 2).trim();
        } else if (body.toLowerCase().endsWith("am")) {
            body = body.substring(0, body.length() - 2).trim();
        }
        String[] parts = body.split(":");
        int h = parts.length > 0 ? parseIntSafe(parts[0]) : 0;
        int m = parts.length > 1 ? parseIntSafe(parts[1]) : 0;
        if (isPm && h < 12) h += 12;
        if (!isPm && h == 12) h = 0;
        return h * 60 + m;
    }

    /** 630 -> "10:30 AM" */
    public static String minsToTimeStr(int totalMins) {
        int h = Math.floorDiv(totalMins, 60);
        int m = Math.floorMod(totalMins, 60);
        String period = h >= 12 ? "PM" : "AM";
        int displayH = h > 12 ? h - 12 : (h == 0 ? 12 : h);
        return displayH + ":" + String.format("%02d", m) + " " + period;
    }

    public static String buildAppointmentWindow(String slotTime, int durationMin) {
        int start = timeToMins(slotTime);
        return minsToTimeStr(start) + " - " + minsToTimeStr(start + durationMin);
    }

    private static int parseIntSafe(String s) {
        try {
            return Integer.parseInt(s.trim());
        } catch (Exception e) {
            return 0;
        }
    }
}
