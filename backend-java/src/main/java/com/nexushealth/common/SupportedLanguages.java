package com.nexushealth.common;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Canonical registry of the 10 supported UI languages.
 *
 * <p>Codes follow the BCP-47 primary subtag so browsers' Web Speech API and
 * ICU collation both resolve them natively (no custom resolution needed).
 * The registry is deliberately a single source of truth: any new language is
 * one entry here + one locale file in the frontend {@code locales/} folder.</p>
 */
public final class SupportedLanguages {

    private SupportedLanguages() {
    }

    /** Ordered map: language code -> ISO-639-1 native endonym (for the selector). */
    private static final Map<String, String> CODE_TO_NATIVE = new LinkedHashMap<>();

    static {
        CODE_TO_NATIVE.put("en", "English");
        CODE_TO_NATIVE.put("hi", "हिन्दी");
        CODE_TO_NATIVE.put("bn", "বাংলা");
        CODE_TO_NATIVE.put("te", "తెలుగు");
        CODE_TO_NATIVE.put("mr", "मराठी");
        CODE_TO_NATIVE.put("ta", "தமிழ்");
        CODE_TO_NATIVE.put("gu", "ગુજરાતી");
        CODE_TO_NATIVE.put("kn", "ಕನ್ನಡ");
        CODE_TO_NATIVE.put("ml", "മലയാളം");
        CODE_TO_NATIVE.put("or", "ଓଡ଼ିଆ");
    }

    public static boolean isSupported(String code) {
        return code != null && CODE_TO_NATIVE.containsKey(code);
    }

    public static Map<String, String> endonyms() {
        return new LinkedHashMap<>(CODE_TO_NATIVE);
    }

    public static List<String> codes() {
        return List.copyOf(CODE_TO_NATIVE.keySet());
    }
}
