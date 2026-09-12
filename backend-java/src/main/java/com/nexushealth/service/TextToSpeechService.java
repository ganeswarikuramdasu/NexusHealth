package com.nexushealth.service;

/**
 * Provider-agnostic text-to-speech abstraction.
 *
 * <p>Same seam philosophy as {@link SpeechToTextService}: the backend never
 * depends on a specific TTS vendor. Adapters (Google / Azure / Amazon Polly /
 * local eSpeak-NG, etc.) implement this interface; the frontend uses the
 * browser's native Web Speech {@code speechSynthesis} layer, so users with no
 * network provider at all still get spoken output.
 *
 * <p>Healthcare constraint baked into the contract: callers must pass a
 * {@code safeText} value that has already passed the healthcare-safety screen
 * (the voice layer guarantees replies never contain diagnoses, prescription
 * amounts, or dosage directions - see the defense-in-depth impl).</p>
 */
public interface TextToSpeechService {

    /**
     * Synthesize speech for the given pre-screened text.
     *
     * @param safeText pre-screened, healthcare-safe text to speak
     * @param language BCP-47 language hint
     * @param voiceProfile gender-neutral, calm voice profile name (may be null for provider default)
     * @return an audio handle/URL the caller can play; never null
     */
    AudioSynthesis synthesize(String safeText, String language, String voiceProfile);

    /** Immutable audio synthesis result. */
    final class AudioSynthesis {
        private final String uri;
        private final String mimeType;

        public AudioSynthesis(String uri, String mimeType) {
            this.uri = uri == null ? "" : uri;
            this.mimeType = mimeType == null ? "audio/webm" : mimeType;
        }

        public String uri() {
            return uri;
        }

        public String mimeType() {
            return mimeType;
        }
    }
}
