package com.nexushealth.service;

/**
 * Provider-agnostic speech-to-text abstraction.
 *
 * <p>The migration deliberately has NO hard dependency on any commercial STT
 * vendor (there are no API keys in this repo). This interface is the seam a
 * provider adapter (Google / Azure / local Whisper, etc.) plugs into so the
 * controller layer never bakes in a single vendor.
 *
 * <p>Design contract (kept deliberately small so an adapter takes minutes):
 * <ul>
 *   <li>accepts an ISO-639-1 / BCP-47 {@code language} hint and an audio blob;</li>
 *   <li>returns the best-guess transcript plus a confidence in [0,1];</li>
 *   <li>throws nothing on "no speech" - returns an empty transcript instead, so
 *       callers can present a clean "I did not hear anything" state (never a 500).</li>
 * </ul>
 */
public interface SpeechToTextService {

    /**
     * Transcribe a single audio fragment.
     *
     * @param audioBytes raw audio bytes (PCM/WAV/WebM-Opus as captured by Web Speech API)
     * @param language   BCP-47 language hint (e.g. {@code hi}, {@code ta}); may be null
     * @return transcript metadata; {@link Transcript#text()} is empty when nothing was heard
     */
    Transcript transcribe(byte[] audioBytes, String language);

    /** Immutable transcript result. */
    final class Transcript {
        private final String text;
        private final double confidence;

        public Transcript(String text, double confidence) {
            this.text = text == null ? "" : text;
            this.confidence = confidence;
        }

        public static Transcript empty() {
            return new Transcript("", 0.0);
        }

        public String text() {
            return text;
        }

        public double confidence() {
            return confidence;
        }
    }
}
