package com.nexushealth.service;

/**
 * Provider-agnostic machine-translation seam.
 *
 * <p>Mirrors the STT/TTS philosophy: the migration ships NO commercial
 * translation vendor dependency (no API keys, no vendor DTOs leaking into the
 * controller layer). Adapters (Google Translate / Azure Translator / local
 * IndicTrans2 / etc.) implement this interface; the voice layer only ever calls
 * {@link #translate(String, String)} with pre-screened text.</p>
 *
 * <p>Healthcare constraint is contract-level: callers must pass
 * {@code safeText} that already passed the healthcare-safety screen (the voice
 * layer guarantees it never sends diagnoses, prescription amounts, or dosage
 * directions to any downstream provider).</p>
 */
public interface TranslationService {

    /**
     * Translate pre-screened text into the target language.
     *
     * @param safeText       pre-screened, healthcare-safe source text
     * @param targetLanguage BCP-47 primary subtag (e.g. {@code hi}, {@code ta})
     * @return immutable translation result; never null
     */
    Translation translate(String safeText, String targetLanguage);

    /** Immutable translation result. */
    final class Translation {
        private final String text;
        private final String language;

        public Translation(String text, String language) {
            this.text = text == null ? "" : text;
            this.language = language == null ? "en" : language;
        }

        public String text() {
            return text;
        }

        public String language() {
            return language;
        }
    }
}
