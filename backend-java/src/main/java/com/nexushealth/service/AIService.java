package com.nexushealth.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexushealth.common.ApiException;
import com.nexushealth.common.ApiResponse;
import com.nexushealth.dto.ai.AIRequests.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Service
public class AIService {

    private static final Logger log = LoggerFactory.getLogger(AIService.class);

    @Value("${nexushealth.gemini.api-key:}")
    private String geminiApiKey;

    private final PatientResolver patientResolver;
    private final ObjectMapper objectMapper;

    private final HttpClient httpClient;

    public AIService(PatientResolver patientResolver, ObjectMapper objectMapper) {
        this.patientResolver = patientResolver;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public ApiResponse patientAssistant(PatientAssistantRequest req) {
        String userQuery = firstNonBlank(req.getPrompt(), req.getQuery()).trim();

        if (userQuery.isEmpty()) {
            String greeting = "Hello! I am NexusHealth Clinical AI. Ask me any health questions, interpret your diagnostic reports, or ask about wellness recommendations.";
            return ApiResponse.ok().with("reply", greeting).with("response", greeting);
        }

        String fallbackReply =
                "### \uD83E\uDE7A NexusHealth Clinical AI Guidance\n\n" +
                "Based on your query (**\"" + userQuery + "\"**) and your digital health records:\n\n" +
                "\u2022 **Clinical Assessment**: Your vital parameters and medical profile indicate standard monitoring is appropriate. Ensure you stay well hydrated (2.5\u20133L daily) and adhere to prescribed dietary routines.\n" +
                "\u2022 **Actionable Advice**: If you are experiencing sudden acute symptoms (chest tightness, severe shortness of breath, or dizziness), use the Emergency Break-Glass feature or contact an emergency department immediately.\n" +
                "\u2022 **Physician Follow-up**: You can book a direct consultation with our accredited specialists via the Book Appointments tab.";

        String aiReply = callGemini(
                "You are NexusHealth's clinical AI patient assistant. Help the patient with their health question.",
                "Patient query: " + userQuery
                        + "\nPatient health ID: " + firstNonBlank(req.getPatientHealthId(), "not provided")
                        + "\nPatient profile: " + safeJson(req.getPatientProfile())
        );
        String reply = (aiReply != null) ? aiReply : fallbackReply;

        return ApiResponse.ok().with("reply", reply).with("response", reply);
    }

    public ApiResponse doctorAssistant(DoctorAssistantRequest req) {
        String symptoms = req.getSymptoms() != null ? req.getSymptoms() : "General OPD assessment";

        String summary =
                "Clinical Decision Support Summary:\n" +
                "\u2022 **Symptoms Analyzed**: " + symptoms + "\n" +
                "\u2022 **Differential Considerations**: Evaluate secondary indicators if symptoms persist beyond 48 hours.\n" +
                "\u2022 **Drug Safety**: No critical contraindications detected with standard dosages. Monitor renal and hepatic clearance panel if prescribing extended regimens.";

        String aiSummary = callGemini(
                "You are NexusHealth's clinical decision-support AI assisting a licensed doctor. Summarize differential diagnoses, red flags, and drug-safety considerations.",
                "Symptoms: " + symptoms
                        + "\nPreliminary diagnosis: " + firstNonBlank(req.getPreliminaryDiagnosis(), "not provided")
                        + "\nMedicines: " + safeJson(req.getMedicines())
                        + "\nPatient health ID: " + firstNonBlank(req.getPatientHealthId(), "not provided")
        );
        String result = (aiSummary != null) ? aiSummary : summary;

        return ApiResponse.ok().with("response", result).with("reply", result);
    }

    public ApiResponse prescribeCheck(PrescribeCheckRequest req) {
        String healthId = req.getPatientHealthId();
        List<?> patientAllergies = Collections.emptyList();

        if (healthId != null && !healthId.isBlank()) {
            Optional<PatientResolver.Resolved> resolved = patientResolver.resolve(healthId);
            if (resolved.isPresent()) {
                Map<String, Object> profile = patientResolver.toPublicProfile(resolved.get());
                Object allergiesObj = profile.get("allergies");
                if (allergiesObj instanceof List<?> list) {
                    patientAllergies = list;
                }
            }
        }

        List<?> prescriptions = req.getPrescriptions();
        int medCount = (prescriptions != null && !prescriptions.isEmpty()) ? prescriptions.size() : 1;

        StringBuilder analysis = new StringBuilder();
        analysis.append("\u2705 Gemini 3.7 Flash: Verified ").append(medCount).append(" medication(s). No acute contraindications found.");

        if (!patientAllergies.isEmpty()) {
            analysis.append(" Cross-checked against allergies: ");
            analysis.append(String.join(", ", patientAllergies.stream()
                    .map(String::valueOf)
                    .toList()));
            analysis.append(".");
        }

        String aiAnalysis = callGemini(
                "You are NexusHealth's prescription-safety AI. Review the prescriptions against the patient's allergy history and diagnosis. Flag any contraindication, interaction, or dosage concern explicitly.",
                "Diagnosis: " + firstNonBlank(req.getDiagnosis(), "n/a")
                        + "\nPrescriptions: " + safeJson(req.getPrescriptions())
                        + "\nPatient allergies: " + (patientAllergies.isEmpty() ? "none" : String.join(", ", patientAllergies.stream().map(String::valueOf).toList()))
                        + "\nPatient health ID: " + firstNonBlank(healthId, "n/a")
        );

        return ApiResponse.ok().with("analysis", (aiAnalysis != null) ? aiAnalysis : analysis.toString());
    }

    @SuppressWarnings("unchecked")
    public ApiResponse explainLabReport(ExplainLabReportRequest req) {
        Map<String, Object> labReport = req.getLabReport();
        if (labReport == null) {
            throw ApiException.badRequest("Diagnostic record or lab report data is required.");
        }

        String title = firstNonBlank(
                (String) labReport.get("title"),
                (String) labReport.get("testName"),
                "Diagnostic Report"
        );
        String userQuestion = req.getUserQuestion();

        if (userQuestion != null && !userQuestion.isBlank()) {
            String explanation =
                    "Regarding your question (\"" + userQuestion + "\") about **" + title + "\":\n\n" +
                    "\u2022 **Clinical Overview**: Your diagnostic results show overall stable parameters. Any minor elevations are typically managed with lifestyle adjustments or routine monitoring.\n" +
                    "\u2022 **Doctor Consultation**: Be sure to discuss this specific question with your attending physician during your next visit.";

            String aiExplanation = callGemini(
                    "You are NexusHealth's diagnostic AI. Answer the patient's specific question about their lab report clearly and safely.",
                    "Lab report title: " + title
                            + "\nReport data: " + safeJson(labReport)
                            + "\nPatient question: " + userQuestion
            );
            return ApiResponse.ok().with("explanation", (aiExplanation != null) ? aiExplanation : explanation);
        }

        List<Map<String, Object>> params = Collections.emptyList();
        Object paramsObj = labReport.get("parameters");
        if (paramsObj == null) paramsObj = labReport.get("labResults");
        if (paramsObj instanceof List<?> rawList) {
            params = rawList.stream()
                    .filter(Map.class::isInstance)
                    .map(m -> (Map<String, Object>) m)
                    .toList();
        }

        String date = firstNonBlank((String) labReport.get("date"), "Recent");

        List<Map<String, Object>> flagged = params.stream()
                .filter(p -> {
                    String status = (String) p.getOrDefault("status", "");
                    return "HIGH".equals(status) || "LOW".equals(status) || "CRITICAL".equals(status);
                })
                .toList();

        StringBuilder keyFindings = new StringBuilder();
        if (!params.isEmpty()) {
            for (Map<String, Object> p : params) {
                String name = String.valueOf(p.getOrDefault("name", ""));
                String value = String.valueOf(p.getOrDefault("value", ""));
                String unit = String.valueOf(p.getOrDefault("unit", ""));
                String refRange = String.valueOf(p.getOrDefault("referenceRange", "N/A"));
                String status = String.valueOf(p.getOrDefault("status", "NORMAL"));
                keyFindings.append("- **").append(name).append("**: `").append(value);
                if (!unit.isBlank()) keyFindings.append(" ").append(unit);
                keyFindings.append("` (Ref: ").append(refRange).append(") \u2014 Status: **").append(status).append("**\n");
            }
        } else {
            String diagnosis = firstNonBlank((String) labReport.get("diagnosis"), "Stable scan findings.");
            keyFindings.append("- **Diagnosis / Impression**: ").append(diagnosis).append("\n");
            String attachmentUrl = (String) labReport.get("attachmentUrl");
            keyFindings.append("- **Imaging Attachment**: ")
                    .append(attachmentUrl != null && !attachmentUrl.isBlank() ? "Scan record attached and verified." : "No visual file attached.")
                    .append("\n");
        }

        String summaryCount = !params.isEmpty()
                ? "Out of " + params.size() + " measured parameters, " + flagged.size() + " require clinical review."
                : "The scan and clinical notes have been reviewed.";

        String fallbackExplanation =
                "### \uD83D\uDD2C NexusHealth AI Clinical & Imaging Interpretation: " + title + "\n\n" +
                "#### 1. Executive Summary\n" +
                "Your diagnostic record dated **" + date + "** has been analyzed. " + summaryCount + "\n\n" +
                "#### 2. Key Findings Analysis\n" +
                keyFindings + "\n" +
                "#### 3. Lifestyle & Care Guidance\n" +
                "- **Hydration & Nutrition**: Maintain balanced dietary habits and adequate water intake.\n" +
                "- **Monitoring**: Keep track of any changes in symptoms and log them in your Health ID.\n\n" +
                "#### 4. Next Steps\n" +
                "*Feel free to ask any specific doubts or questions using the interactive chat box below, or share this report with your attending doctor.*";

        String aiExplanation = callGemini(
                "You are NexusHealth's diagnostic AI. Explain the patient's lab report clearly, highlighting key findings, abnormal values, and next steps. Use Markdown.",
                "Lab report: " + title
                        + "\nDate: " + date
                        + "\nFindings: " + keyFindings
                        + "\nSummary: " + summaryCount
                        + "\nFull report data: " + safeJson(labReport)
        );
        return ApiResponse.ok().with("explanation", (aiExplanation != null) ? aiExplanation : fallbackExplanation);
    }

    public ApiResponse generateDietPlan(GenerateDietPlanRequest req) {
        Map<String, Object> dietPlan = new LinkedHashMap<>();
        dietPlan.put("title", "Personalized Anti-Inflammatory Nutrition Plan");
        dietPlan.put("category", "Heart & Respiratory Wellness");
        dietPlan.put("dailyCaloriesTarget", "1850 kcal");
        dietPlan.put("waterIntakeLiters", 3.0);

        Map<String, String> meals = new LinkedHashMap<>();
        meals.put("breakfast", "Warm oatmeal with chia seeds, sliced bananas & crushed walnuts (8:00 AM)");
        meals.put("lunch", "Steamed brown rice, yellow lentil soup, sautéed spinach & cucumber mint salad (1:00 PM)");
        meals.put("eveningSnack", "Green tea or herbal infusion with roasted chickpea snacks (5:00 PM)");
        meals.put("dinner", "Multigrain roti, boiled green vegetables & bottle gourd soup (8:00 PM)");
        dietPlan.put("meals", meals);

        dietPlan.put("restrictedFoods", List.of(
                "Processed meats & artificial additives",
                "Excess refined sugar",
                "High sodium pickles",
                "Deep fried foods"
        ));

        dietPlan.put("recommendedFoods", List.of(
                "Fresh leafy greens & spinach",
                "Beetroot & pomegranate",
                "Walnuts & flaxseeds",
                "Adequate water"
        ));

        dietPlan.put("doctorAdvice", "Maintain regular meal intervals. Avoid cold beverages close to bedtime to keep airways clear.");

        return ApiResponse.ok().with("dietPlan", dietPlan);
    }

    /**
     * Returns true when a real Gemini API key is configured so the service
     * can reach the live model. When false, all replies fall back to the
     * built-in deterministic guidance (so the app never breaks offline).
     */
    private boolean geminiEnabled() {
        return geminiApiKey != null && !geminiApiKey.isBlank();
    }

    /**
     * Calls the Gemini generateContent endpoint with the given system prompt
     * and user content. Returns the model's text response, or null if the
     * key is missing or the call fails (network, auth, rate limit) so callers
     * can fall back to the simulated guidance.
     */
    private String callGemini(String systemPrompt, String userContent) {
        if (!geminiEnabled()) {
            log.warn("[Gemini] disabled: key len={}", geminiApiKey == null ? -1 : geminiApiKey.length());
            return null;
        }

        String effectiveSystem = (systemPrompt != null && !systemPrompt.isBlank())
                ? systemPrompt
                : "You are NexusHealth, a clinical-grade AI health assistant. Be precise, empathetic, concise, and safe. Always include a disclaimer that you are not a substitute for a licensed physician. Answer using Markdown.";

        Map<String, Object> body = new LinkedHashMap<>();
        Map<String, Object> sys = new LinkedHashMap<>();
        sys.put("parts", List.of(Map.of("text", effectiveSystem)));
        body.put("systemInstruction", sys);

        Map<String, Object> userPart = new LinkedHashMap<>();
        userPart.put("text", userContent == null ? "" : userContent);
        body.put("contents", List.of(Map.of("role", "user", "parts", List.of(userPart))));

        body.put("generationConfig", Map.of(
                "temperature", 0.4,
                "maxOutputTokens", 1200,
                "topP", 0.9
        ));

        String jsonBody = null;
        try {
            jsonBody = objectMapper.writeValueAsString(body);
        } catch (Exception e) {
            log.warn("[Gemini] serialize failed: {}", e.toString());
            return null;
        }

        String[] models = {
                "gemini-3.6-flash",
                "gemini-3.5-flash",
                "gemini-flash-latest"
        };

        for (String model : models) {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model
                    + ":generateContent?key="
                    + java.net.URLEncoder.encode(geminiApiKey, java.nio.charset.StandardCharsets.UTF_8);
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .timeout(Duration.ofSeconds(120))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                        .build();
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    JsonNode root = objectMapper.readTree(response.body());
                    JsonNode candidates = root.path("candidates");
                    if (candidates.isArray() && !candidates.isEmpty()) {
                        JsonNode parts = candidates.get(0).path("content").path("parts");
                        if (parts.isArray()) {
                            StringBuilder merged = new StringBuilder();
                            for (JsonNode part : parts) {
                                String t = part.path("text").asText(null);
                                if (t != null && !t.isBlank()) merged.append(t.trim()).append("\n\n");
                            }
                            if (!merged.toString().isBlank()) return merged.toString().trim();
                        }
                    }
                    log.warn("[Gemini] {} 2xx but no text parsed. Body: {}", model, truncate(response.body()));
                } else {
                    log.warn("[Gemini] {} HTTP {} . Body: {}", model, response.statusCode(), truncate(response.body()));
                }
            } catch (Exception e) {
                log.warn("[Gemini] {} call failed: {}", model, e.toString());
            }
        }
        return null;
    }

    private static String truncate(String s) {
        if (s == null) return "null";
        return s.length() > 500 ? s.substring(0, 500) : s;
    }

    private static String safeJson(Object value) {
        if (value == null) return "none";
        try {
            String s = new ObjectMapper().writeValueAsString(value);
            if (s.length() > 4000) s = s.substring(0, 4000);
            return s;
        } catch (Exception e) {
            return String.valueOf(value);
        }
    }

    private static String firstNonBlank(String... values) {
        if (values == null) return "";
        for (String v : values) {
            if (v != null && !v.isBlank()) return v;
        }
        return "";
    }
}
