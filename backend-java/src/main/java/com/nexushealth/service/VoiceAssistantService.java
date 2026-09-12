package com.nexushealth.service;

/**
 * Healthcare-safe voice assistant engine.
 *
 * <p>This is the ONLY place the assistant decides what to say back. Design
 * contract (enforced by the default implementation):</p>
 *
 * <ul>
 *   <li><b>Own-data only.</b> The assistant never resolves another patient's
 *       records. Every data-touching reply is scoped to the caller's own
 *       identity (the acting user is resolved via {@code x-user-id} and their
 *       own PatientProfile / own records), exactly like the record-access and
 *       emergency flows in this migration.</li>
 *   <li><b>Healthcare-safe.</b> The engine is informational and
 *       navigation-oriented. It NEVER produces a diagnosis, a prescription, or
 *       a medication dosage amount. When the user's words look like a
 *       symptom/condition question, the reply politely redirects them to their
 *       doctor or the emergency line instead of guessing.</li>
 *   <li><b>Never a generic 500.</b> Unknown caller / missing identity / invalid
 *       language is a clean 400/404/417 (ApiException), never a runtime
 *       exception. Replies are locale-synced to the caller's preferred
 *       language.</li>
 * </ul>
 */
public interface VoiceAssistantService {

    /**
     * Produce a healthcare-safe spoken/text reply for the caller.
     *
     * @param req caller + their spoken input (text is already the STT transcript)
     * @return immutable, locale-synced reply
     */
    Reply reply(Request req);

    /** Caller + transcript request. */
    final class Request {
        private final String userId;
        private final String text;
        private final String language;

        public Request(String userId, String text, String language) {
            this.userId = userId;
            this.text = text == null ? "" : text.trim();
            this.language = language == null ? "en" : language.toLowerCase();
        }

        public String userId() {
            return userId;
        }

        public String text() {
            return text;
        }

        public String language() {
            return language;
        }
    }

    /** Immutable reply. */
    final class Reply {
        private final String text;
        private final String language;
        private final String action;

        public Reply(String text, String language, String action) {
            this.text = text == null ? "" : text;
            this.language = language == null ? "en" : language.toLowerCase();
            this.action = action == null ? "reply" : action;
        }

        public String text() {
            return text;
        }

        public String language() {
            return language;
        }

        public String action() {
            return action;
        }
    }
}
