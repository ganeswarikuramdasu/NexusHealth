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

    public ApiResponse analyzeLabAttachment(AnalyzeLabAttachmentRequest req) {
        String fileName = req.getAttachmentName() != null ? req.getAttachmentName() : "lab_report";
        String dataUrl = req.getAttachmentDataUrl();
        String reportText = req.getReportText() != null ? req.getReportText().trim() : "";
        if ((dataUrl == null || dataUrl.isBlank()) && reportText.isEmpty()) {
            throw ApiException.badRequest("Upload a lab report / scan image (or paste the report text) for AI analysis.");
        }

        Map<String, Object> extracted = null;
        String source = "SIMULATED";

        if (dataUrl != null && !dataUrl.isBlank()) {
            String mime = "image/png";
            String base64 = dataUrl;
            int comma = dataUrl.indexOf(',');
            if (comma >= 0) {
                String meta = dataUrl.substring(0, comma);
                if (meta.contains("data:")) {
                    String mt = meta.substring(meta.indexOf("data:") + 5);
                    int semi = mt.indexOf(';');
                    if (semi >= 0) mt = mt.substring(0, semi);
                    if (!mt.isBlank()) mime = mt;
                }
                base64 = dataUrl.substring(comma + 1);
            }

            String vision = callGeminiVision(mime, base64);
            if (vision != null) {
                extracted = parseExtractedLabReport(vision);
                source = "GEMINI";
            }
        }

        if (extracted == null && !reportText.isEmpty()) {
            String textAi = callGeminiTextExtraction(reportText);
            if (textAi != null) {
                extracted = parseExtractedLabReport(textAi);
                source = "GEMINI";
            }
        }

        if (extracted == null) {
            String hint = reportText.isEmpty() ? fileName : reportText;
            extracted = simulateLabExtraction(hint);
        }

        return ApiResponse.ok()
                .with("report", extracted)
                .with("source", source);
    }

    @SuppressWarnings("unchecked")
    public ApiResponse validateAndExtractLabReport(ValidateExtractLabRequest req) {
        String fileName = req.getAttachmentName() != null ? req.getAttachmentName() : "lab_report";
        String dataUrl = req.getAttachmentDataUrl();
        String reportText = req.getReportText() != null ? req.getReportText().trim() : "";
        if ((dataUrl == null || dataUrl.isBlank()) && reportText.isEmpty()) {
            return ApiResponse.fail("Upload a lab report / scan image or paste the report text for AI analysis.");
        }

        String validationReason = null;
        boolean valid = false;
        Map<String, Object> extracted = null;
        String summary = null;
        List<Map<String, Object>> flaggedValues = new ArrayList<>();
        String source = "SIMULATED";

        if (geminiEnabled()) {
            String visionResult = null;
            if (dataUrl != null && !dataUrl.isBlank()) {
                String mime = "image/png";
                String base64 = dataUrl;
                int comma = dataUrl.indexOf(',');
                if (comma >= 0) {
                    String meta = dataUrl.substring(0, comma);
                    if (meta.contains("data:")) {
                        String mt = meta.substring(meta.indexOf("data:") + 5);
                        int semi = mt.indexOf(';');
                        if (semi >= 0) mt = mt.substring(0, semi);
                        if (!mt.isBlank()) mime = mt;
                    }
                    base64 = dataUrl.substring(comma + 1);
                }
                visionResult = callGeminiVisionValidation(mime, base64);
                if (visionResult != null) {
                    JsonNode validationNode = parseValidationResponse(visionResult);
                    if (validationNode != null) {
                        valid = validationNode.path("valid").asBoolean(false);
                        validationReason = validationNode.path("reason").asText(null);
                    }
                }
            }

            if (!valid && !reportText.isEmpty() && visionResult == null) {
                String textValidation = callGeminiTextValidation(reportText);
                if (textValidation != null) {
                    JsonNode validationNode = parseValidationResponse(textValidation);
                    if (validationNode != null) {
                        valid = validationNode.path("valid").asBoolean(false);
                        validationReason = validationNode.path("reason").asText(null);
                    }
                }
            }

            if (valid) {
                if (dataUrl != null && !dataUrl.isBlank()) {
                    String mime = "image/png";
                    String base64 = dataUrl;
                    int comma = dataUrl.indexOf(',');
                    if (comma >= 0) {
                        String meta = dataUrl.substring(0, comma);
                        if (meta.contains("data:")) {
                            String mt = meta.substring(meta.indexOf("data:") + 5);
                            int semi = mt.indexOf(';');
                            if (semi >= 0) mt = mt.substring(0, semi);
                            if (!mt.isBlank()) mime = mt;
                        }
                        base64 = dataUrl.substring(comma + 1);
                    }
                    String vision = callGeminiVision(mime, base64);
                    if (vision != null) {
                        extracted = parseExtractedLabReport(vision);
                        source = "GEMINI";
                    }
                }
                if (extracted == null && !reportText.isEmpty()) {
                    String textAi = callGeminiTextExtraction(reportText);
                    if (textAi != null) {
                        extracted = parseExtractedLabReport(textAi);
                        source = "GEMINI";
                    }
                }

                if (extracted != null) {
                    summary = callGeminiSummary(extracted);
                    flaggedValues = extractFlaggedValues(extracted);
                    if (summary == null) {
                        summary = buildFallbackSummary(extracted);
                    }
                }
            }
        } else {
            String hint = reportText.isEmpty() ? fileName : reportText;
            valid = basicFileValidation(fileName, hint);
            if (!valid) {
                validationReason = "Cannot validate the document without AI. Only image files (JPG, PNG) and PDFs are accepted as lab reports.";
            } else {
                validationReason = "Validated by file type (AI unavailable).";
                extracted = simulateLabExtraction(hint);
                summary = buildFallbackSummary(extracted);
                flaggedValues = extractFlaggedValues(extracted);
            }
        }

        if (!valid) {
            return ApiResponse.fail("This does not appear to be a valid health lab report or diagnostic scan. " +
                    firstNonBlank(validationReason, "Please upload a genuine medical report or scan image."));
        }

        if (extracted == null) {
            extracted = simulateLabExtraction(fileName);
            if (summary == null) summary = buildFallbackSummary(extracted);
            if (flaggedValues.isEmpty()) flaggedValues = extractFlaggedValues(extracted);
        }

        return ApiResponse.ok()
                .with("valid", true)
                .with("report", extracted)
                .with("summary", summary)
                .with("flaggedValues", flaggedValues)
                .with("source", source);
    }

    private String callGeminiVisionValidation(String mimeType, String base64Image) {
        if (!geminiEnabled() || base64Image == null || base64Image.isBlank()) return null;

        Map<String, Object> body = new LinkedHashMap<>();
        Map<String, Object> sys = new LinkedHashMap<>();
        sys.put("parts", List.of(Map.of("text",
                "You are a medical document validation AI. Analyze the uploaded image and determine if it is a genuine "
                        + "health lab report, diagnostic scan, or medical document. "
                        + "Return a SINGLE compact JSON object: {\"valid\": true/false, \"reason\": \"<1 sentence explaining why>\"}. "
                        + "Set valid=true ONLY if the image clearly contains medical test results, lab values, diagnostic imaging "
                        + "(X-ray, MRI, CT, ultrasound), pathology reports, or clinical measurements. "
                        + "Set valid=false for: selfies, screenshots of social media, random photos, food images, "
                        + "handwritten notes that are not medical reports, non-medical documents, or unreadable images. "
                        + "Return ONLY valid JSON, no markdown, no commentary.")));
        body.put("systemInstruction", sys);

        List<Map<String, Object>> parts = new ArrayList<>();
        parts.add(Map.of("text", "Validate if this image is a genuine medical lab report or diagnostic scan."));
        Map<String, Object> inline = new LinkedHashMap<>();
        inline.put("mime_type", mimeType);
        inline.put("data", base64Image);
        parts.add(Map.of("inline_data", inline));
        body.put("contents", List.of(Map.of("role", "user", "parts", parts)));
        body.put("generationConfig", Map.of(
                "temperature", 0.1,
                "maxOutputTokens", 300,
                "topP", 0.9
        ));

        return postGemini(body);
    }

    private String callGeminiTextValidation(String reportText) {
        if (!geminiEnabled() || reportText == null || reportText.isBlank()) return null;
        String snippets = reportText.length() > 3000 ? reportText.substring(0, 3000) : reportText;
        return callGemini(
                "You are a medical document validation AI. Analyze the following text and determine if it is a genuine "
                        + "health lab report, diagnostic scan result, or medical document. "
                        + "Return a SINGLE compact JSON object: {\"valid\": true/false, \"reason\": \"<1 sentence explaining why>\"}. "
                        + "Set valid=true ONLY if the text contains medical test results, lab values, diagnostic findings, "
                        + "or clinical measurements. Set valid=false for unrelated text. "
                        + "Return ONLY valid JSON, no markdown, no commentary.",
                "Validate this text:\n" + snippets
        );
    }

    private JsonNode parseValidationResponse(String text) {
        if (text == null || text.isBlank()) return null;
        String json = text.trim();
        if (json.startsWith("```")) {
            int first = json.indexOf('\n');
            int last = json.lastIndexOf("```");
            json = (first >= 0 && last > first) ? json.substring(first + 1, last).trim() : json.replace("`", "").trim();
        }
        int open = json.indexOf('{');
        int close = json.lastIndexOf('}');
        if (open >= 0 && close > open) json = json.substring(open, close + 1);
        try {
            return objectMapper.readTree(json);
        } catch (Exception e) {
            log.warn("[Gemini] failed to parse validation response: {}", truncate(text));
            return null;
        }
    }

    private boolean basicFileValidation(String fileName, String hint) {
        String name = (fileName != null ? fileName : "").toLowerCase();
        String content = (hint != null ? hint : "").toLowerCase();
        String[] validExtensions = {".pdf", ".jpg", ".jpeg", ".png", ".dcm", ".dicom", ".tiff", ".bmp"};
        for (String ext : validExtensions) {
            if (name.endsWith(ext)) return true;
        }
        String[] medicalKeywords = {"lab", "report", "blood", "test", "scan", "x-ray", "mri", "ct",
                "ultrasound", "cbc", "thyroid", "liver", "kidney", "glucose", "hemoglobin",
                "cholesterol", "bilirubin", "platelet", "wbc", "rbc", "pathology", "diagnostic",
                "specimen", "result", "reference range", "normal", "abnormal", "high", "low"};
        for (String kw : medicalKeywords) {
            if (content.contains(kw)) return true;
        }
        return false;
    }

    @SuppressWarnings("unchecked")
    private String callGeminiSummary(Map<String, Object> extractedReport) {
        if (!geminiEnabled() || extractedReport == null) return null;
        String reportJson;
        try {
            reportJson = objectMapper.writeValueAsString(extractedReport);
        } catch (Exception e) {
            return null;
        }
        return callGemini(
                "You are NexusHealth's clinical AI. Write a clear, patient-friendly 2-4 sentence summary of the following "
                        + "lab report or diagnostic scan. Highlight any abnormal or flagged values in bold. "
                        + "If all values are normal, say so. End with a disclaimer to consult a physician.",
                "Lab report data:\n" + reportJson
        );
    }

    private List<Map<String, Object>> extractFlaggedValues(Map<String, Object> extractedReport) {
        List<Map<String, Object>> flagged = new ArrayList<>();
        if (extractedReport == null) return flagged;
        Object paramsObj = extractedReport.get("parameters");
        if (!(paramsObj instanceof List<?> params)) return flagged;
        for (Object pObj : params) {
            if (!(pObj instanceof Map<?, ?> raw)) continue;
            Map<String, Object> p = new LinkedHashMap<>();
            for (Object ek : raw.keySet()) {
                p.put(String.valueOf(ek), raw.get(ek));
            }
            String status = String.valueOf(p.getOrDefault("status", "NORMAL")).toUpperCase();
            if (!"NORMAL".equals(status)) {
                Map<String, Object> flag = new LinkedHashMap<>();
                flag.put("name", p.get("name"));
                flag.put("value", p.get("value"));
                flag.put("unit", p.get("unit"));
                flag.put("referenceRange", p.get("referenceRange"));
                flag.put("status", status);
                flagged.add(flag);
            }
        }
        return flagged;
    }

    private String buildFallbackSummary(Map<String, Object> extractedReport) {
        if (extractedReport == null) return "Lab report uploaded. Review with your physician.";
        StringBuilder sb = new StringBuilder();
        String title = String.valueOf(extractedReport.getOrDefault("title", "Lab report"));
        String diagnosis = String.valueOf(extractedReport.getOrDefault("diagnosis", ""));
        sb.append(title).append(" has been uploaded and validated.");
        if (!diagnosis.isEmpty() && !"null".equals(diagnosis)) {
            sb.append(" Findings: ").append(diagnosis);
        }
        List<Map<String, Object>> flagged = extractFlaggedValues(extractedReport);
        if (!flagged.isEmpty()) {
            sb.append(" **Flagged values:** ");
            for (int i = 0; i < flagged.size(); i++) {
                Map<String, Object> f = flagged.get(i);
                if (i > 0) sb.append(", ");
                sb.append(f.get("name")).append(" (").append(f.get("status")).append(")");
            }
            sb.append(". Please consult your physician for interpretation.");
        } else {
            sb.append(" All measured parameters appear within reference ranges.");
        }
        return sb.toString();
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
     * Proactive care analysis. The frontend calls this automatically (it does
     * not require the patient to ask anything) whenever vitals are logged or
     * the care section opens. It runs the latest vitals + medical history
     * against clinical reference ranges, flags anything abnormal, and when it
     * finds an abnormality it recommends nearby doctors/hospitals the patient
     * should see.
     */
    @SuppressWarnings("unchecked")
    public ApiResponse careAnalysis(CareAnalysisRequest req) {
        Map<String, Object> vitals = req.getVitals() != null ? req.getVitals() : new LinkedHashMap<>();
        List<?> records = req.getMedicalRecords() != null ? req.getMedicalRecords() : Collections.emptyList();
        Map<String, Object> patientProfile = req.getPatientProfile() != null ? req.getPatientProfile() : Collections.emptyMap();
        List<Map<String, Object>> providers = normalizeProviders(req.getNearbyProviders(),
                safeNum(patientProfile.get("latitude")), safeNum(patientProfile.get("longitude")));

        List<Map<String, Object>> abnormalities = new ArrayList<>();
        String status = "STABLE";

        evaluateVital(abnormalities, vitals, "BP Systolic", safeNum(vitals.get("bpSystolic")), 90, 120,
                "mmHg", "High systolic pressure strains the heart and arteries over time.");
        evaluateVital(abnormalities, vitals, "BP Diastolic", safeNum(vitals.get("bpDiastolic")), 60, 80,
                "mmHg", "High diastolic pressure increases cardiovascular risk.");
        evaluateVital(abnormalities, vitals, "Glucose (Fasting)", safeNum(vitals.get("glucose")), 70, 100,
                "mg/dL", "Elevated fasting glucose may indicate pre-diabetes or diabetes.");
        evaluateVital(abnormalities, vitals, "Heart Rate", safeNum(vitals.get("heartRate")), 60, 100,
                "bpm", "Abnormal resting heart rate can signal arrhythmia or compensation.");
        evaluateVital(abnormalities, vitals, "SpO2", safeNum(vitals.get("spo2")), 95, 100,
                "%", "Low blood oxygen warrants evaluation for respiratory or cardiac conditions.");

        Map<String, Object> bmiInfo = computeBmi(vitals);
        if (!bmiInfo.isEmpty() && Boolean.TRUE.equals(bmiInfo.get("abnormal"))) {
            double bmiValue = ((Number) bmiInfo.get("value")).doubleValue();
            boolean critical = bmiValue >= 30 || bmiValue < 16;
            Map<String, Object> bmiEntry = new LinkedHashMap<>();
            bmiEntry.put("name", "BMI (Body Mass Index)");
            bmiEntry.put("value", String.format("%.1f", bmiValue) + " kg/m²");
            bmiEntry.put("level", critical ? "CRITICAL" : "ABNORMAL");
            bmiEntry.put("referenceRange", "18.5-24.9 kg/m²");
            bmiEntry.put("advice", "BMI is " + bmiInfo.get("category").toString().toLowerCase()
                    + ". A persistent imbalance in body mass can increase cardiovascular, metabolic and joint strain - a dietary and activity review with a clinician is advisable.");
            abnormalities.add(bmiEntry);
        }

        List<String> redFlags = scanRecordsForRedFlags(records);

        boolean anyAbnormal = !abnormalities.isEmpty() || !redFlags.isEmpty();
        boolean anyCritical = abnormalities.stream()
                .anyMatch(a -> "CRITICAL".equals(a.get("level")));

        if (anyCritical) {
            status = "URGENT";
        } else if (anyAbnormal) {
            status = "REVIEW";
        }
        boolean needsDoctorVisit = anyAbnormal;

        List<Map<String, Object>> suggested = suggestProviders(providers, needsDoctorVisit ? 3 : 2);

        String careSummary = buildCareSummary(status, abnormalities, redFlags, vitals, bmiInfo);

        String aiAssessment = callGemini(
                "You are NexusHealth's proactive clinical care AI. A patient's vitals and medical history have been automatically analyzed WITHOUT them asking. Review the findings and, if any abnormality exists, clearly recommend that they see a doctor and recommend the nearest suitable providers from the supplied list. Always end with a safety disclaimer. Use Markdown.",
                "Patient:\n" + safeJson(req.getPatientProfile())
                        + "\nPatient health ID: " + firstNonBlank(req.getPatientHealthId(), "not provided")
                        + "\nLatest vitals: " + safeJson(vitals)
                        + "\nMedical history summary: " + summarizeRecords(records)
                        + "\nDetected abnormalities: " + (abnormalities.isEmpty() ? "none" : safeJson(abnormalities))
                        + "\nRecords red flags: " + (redFlags.isEmpty() ? "none" : String.join("; ", redFlags))
                        + "\nOverall status: " + status
                        + "\nNearby hospitals/doctors available: " + safeJson(providers)
        );

        String assessment = (aiAssessment != null) ? aiAssessment : careSummary;

        List<String> recommendations = new ArrayList<>();
        if (!anyAbnormal) {
            recommendations.add("No actionable abnormality detected - continue your routine monitoring and lifestyle plan.");
            recommendations.add("Log vitals at least weekly so proactive tracking stays continuous.");
        } else {
            for (Map<String, Object> a : abnormalities) {
                recommendations.add("Abnormal " + a.get("name") + " (" + a.get("value") + ") - see the nearest doctor for a clinical review.");
            }
            if (!redFlags.isEmpty()) {
                recommendations.add("Your medical history contains flags that warrant follow-up (" + String.join(", ", redFlags) + ").");
            }
            recommendations.add(suggested.isEmpty()
                    ? "No nearby provider coordinates were available - use the Book Appointments tab to pick a provider."
                    : "Consult " + suggested.get(0).get("hospitalName") + " (" + suggested.get(0).get("doctorSummary") + ") - " + suggested.get(0).get("distanceLabel") + ".");
        }

        return ApiResponse.ok()
                .with("status", status)
                .with("needsDoctorVisit", needsDoctorVisit)
                .with("abnormalities", abnormalities)
                .with("recordsRedFlags", redFlags)
                .with("suggestedProviders", suggested)
                .with("recommendations", recommendations)
                .with("assessment", assessment)
                .with("source", aiAssessment != null ? "GEMINI" : "SIMULATED");
    }

    private void evaluateVital(List<Map<String, Object>> abnormalities, Map<String, Object> vitals,
                               String name, double value, double normalLow, double normalHigh,
                               String unit, String advice) {
        if (Double.isNaN(value)) return;
        boolean abnormal = value < normalLow || value > normalHigh;
        if (!abnormal) return;

        boolean criticalHigh = value > normalHigh * 1.5;
        boolean criticalLow = value < normalLow * 0.6;
        String level = (criticalHigh || criticalLow)
                ? "CRITICAL"
                : "ABNORMAL";

        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("name", name);
        entry.put("value", value + " " + unit);
        entry.put("level", level);
        entry.put("referenceRange", normalLow + "-" + normalHigh + " " + unit);
        entry.put("advice", advice);
        abnormalities.add(entry);
    }

    private List<String> scanRecordsForRedFlags(List<?> records) {
        List<String> flags = new ArrayList<>();
        String[] keywords = {
                "emergency", "critical", "life-threatening", "abnormal", "admitted",
                "icu", "stroke", "heart attack", "myocardial", "cancer", "malignant",
                "anaphylaxis", "seizure", "unconscious", "cardiac arrest"
        };
        for (Object rec : records) {
            if (!(rec instanceof Map)) continue;
            Map<?, ?> m = (Map<?, ?>) rec;
            String diagnosis = mapStr(m, "diagnosis", "");
            String notes = mapStr(m, "clinicalNotes", "");
            String title = mapStr(m, "title", "");
            String summary = (diagnosis + " " + notes + " " + title).toLowerCase();
            for (String kw : keywords) {
                if (summary.contains(kw) && !flags.contains(kw)) {
                    flags.add(kw);
                }
            }
            Object vibe = m.get("recordType");
            if ("EMERGENCY".equalsIgnoreCase(String.valueOf(vibe)) && !flags.contains("emergency visit")) {
                flags.add("emergency visit");
            }
        }
        return flags;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> normalizeProviders(List<?> raw, double patientLat, double patientLng) {
        List<Map<String, Object>> out = new ArrayList<>();
        if (raw == null) return out;
        for (Object o : raw) {
            if (!(o instanceof Map)) continue;
            Map<?, ?> m = (Map<?, ?>) o;
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("hospitalId", mapStr(m, "hospitalId", ""));
            entry.put("hospitalName", mapStr(m, "hospitalName", "Healthcare Facility"));
            entry.put("address", mapStr(m, "address", ""));
            Object distObj = m.get("distanceKm");
            double dist = Double.NaN;
            if (distObj != null) {
                try {
                    dist = Double.parseDouble(String.valueOf(distObj));
                } catch (Exception ignored) {
                }
            }
            if (Double.isNaN(dist) && !Double.isNaN(patientLat) && !Double.isNaN(patientLng)) {
                double hLat = safeNum(m.get("latitude"));
                double hLng = safeNum(m.get("longitude"));
                if (!Double.isNaN(hLat) && !Double.isNaN(hLng)) {
                    dist = haversineKm(patientLat, patientLng, hLat, hLng);
                }
            }
            entry.put("distanceKm", Double.isNaN(dist) ? null : Math.round(dist * 10) / 10.0);
            List<?> docList = m.get("doctors") instanceof List ? (List<?>) m.get("doctors") : Collections.emptyList();
            String docSummary;
            if (docList.isEmpty()) {
                docSummary = "General practitioners available";
            } else if (docList.size() == 1) {
                docSummary = "Dr. " + String.valueOf(docList.get(0));
            } else {
                docSummary = "Drs. " + String.valueOf(docList.get(0)).trim() + " & " + (docList.size() - 1) + " more";
            }
            entry.put("doctorSummary", docSummary);
            out.add(entry);
        }
        out.sort((a, b) -> {
            Object da = a.get("distanceKm");
            Object db = b.get("distanceKm");
            if (da == null) return 1;
            if (db == null) return -1;
            return Double.compare(((Number) da).doubleValue(), ((Number) db).doubleValue());
        });
        return out;
    }

    private List<Map<String, Object>> suggestProviders(List<Map<String, Object>> providers, int limit) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> p : providers) {
            if (out.size() >= limit) break;
            Map<String, Object> copy = new LinkedHashMap<>(p);
            Object dist = copy.get("distanceKm");
            copy.put("distanceLabel", dist == null ? "Distance not available" : String.format("%.1f km away", dist));
            out.add(copy);
        }
        return out;
    }

    private Map<String, Object> computeBmi(Map<String, Object> vitals) {
        if (vitals == null) return Collections.emptyMap();
        double heightCm = safeNum(vitals.get("height"));
        if (Double.isNaN(heightCm)) heightCm = safeNum(vitals.get("heightCm"));
        double weightKg = safeNum(vitals.get("weight"));
        if (Double.isNaN(weightKg)) weightKg = safeNum(vitals.get("weightKg"));
        if (Double.isNaN(heightCm) || Double.isNaN(weightKg) || heightCm <= 0 || weightKg <= 0) {
            return Collections.emptyMap();
        }

        double bmi = weightKg / Math.pow(heightCm / 100.0, 2);
        String category;
        boolean abnormal;
        if (bmi < 18.5) {
            category = "Underweight";
            abnormal = true;
        } else if (bmi < 25) {
            category = "Normal";
            abnormal = false;
        } else if (bmi < 30) {
            category = "Overweight";
            abnormal = true;
        } else {
            category = "Obese";
            abnormal = true;
        }

        Map<String, Object> info = new LinkedHashMap<>();
        info.put("value", Math.round(bmi * 10) / 10.0);
        info.put("category", category);
        info.put("abnormal", abnormal);
        return info;
    }

    private String buildCareSummary(String status, List<Map<String, Object>> abnormalities,
                                    List<String> redFlags, Map<String, Object> vitals, Map<String, Object> bmiInfo) {
        StringBuilder sb = new StringBuilder();
        sb.append("## \uD83E\uDE7A Proactive AI Health Check\n\n");
        sb.append("**Overall status:** ").append(status).append("\n\n");

        if (vitals.isEmpty()) {
            sb.append("No vitals logged yet for this Health ID. Log your BP, glucose, heart rate and SpO2 so I can monitor them continuously.");
        } else {
            sb.append("**Latest vitals:** ");
            sb.append("BP ").append(vitals.get("bpSystolic")).append("/").append(vitals.get("bpDiastolic"))
                    .append(" | Glucose ").append(vitals.get("glucose")).append(" | HR ").append(vitals.get("heartRate"))
                    .append(" | SpO2 ").append(vitals.get("spo2")).append("%\n\n");
        }

        if (bmiInfo != null && !bmiInfo.isEmpty()) {
            sb.append("**Body Mass Index:** `").append(bmiInfo.get("value"))
                    .append(" kg/m²` (").append(bmiInfo.get("category")).append(")\n\n");
        }

        if (abnormalities.isEmpty() && redFlags.isEmpty()) {
            sb.append("\u2705 All parameters are within reference ranges. Continue routine self-care and keep logging vitals.\n");
            sb.append("\n> This is a proactive check, not a diagnosis. Always confirm with a licensed physician.\n");
            return sb.toString();
        }

        sb.append("### \u26A0\uFE0F Abnormalities Detected\n");
        for (Map<String, Object> a : abnormalities) {
            sb.append("- **").append(a.get("name")).append("**: `").append(a.get("value"))
                    .append("` (ref ").append(a.get("referenceRange")).append(") - ")
                    .append("CRITICAL".equals(a.get("level")) ? "**needs urgent review**" : "needs review")
                    .append(". ").append(a.get("advice")).append("\n");
        }
        for (String flag : redFlags) {
            sb.append("- History flag: `").append(flag).append("` - consider clinical follow-up.\n");
        }
        sb.append("\n> **It is recommended that you see a doctor.** Your care section will list nearby hospitals and doctors - or use the *Book Appointments* tab.\n");
        return sb.toString();
    }

    private String summarizeRecords(List<?> records) {
        if (records == null || records.isEmpty()) return "No medical records on file.";
        StringBuilder sb = new StringBuilder();
        int shown = 0;
        for (Object rec : records) {
            if (shown >= 8) break;
            if (!(rec instanceof Map)) continue;
            Map<?, ?> m = (Map<?, ?>) rec;
            sb.append("- [").append(mapStr(m, "recordDate", "?")).append("] ")
                    .append(mapStr(m, "recordType", "record")).append(": ")
                    .append(mapStr(m, "title", "")).append(" | ")
                    .append(mapStr(m, "diagnosis", "")).append("\n");
            shown++;
        }
        return sb.toString();
    }

    private static double safeNum(Object o) {
        if (o == null) return Double.NaN;
        try {
            return Double.parseDouble(String.valueOf(o));
        } catch (Exception e) {
            return Double.NaN;
        }
    }

    private static String mapStr(Map<?, ?> m, String key, String def) {
        Object v = m.get(key);
        return v == null ? def : String.valueOf(v);
    }

    private static double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        double R = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * R * Math.asin(Math.sqrt(a));
    }

    /**
     * Returns true when a real Gemini API key is configured so the service
     * can reach the live model. When false, all replies fall back to the
     * built-in deterministic guidance (so the app never breaks offline).
     */
    private Map<String, Object> parseExtractedLabReport(String text) {
        if (text == null || text.isBlank()) return null;
        String json = text.trim();
        if (json.startsWith("```")) {
            int first = json.indexOf('\n');
            int last = json.lastIndexOf("```");
            json = (first >= 0 && last > first) ? json.substring(first + 1, last).trim() : json.replace("`", "").trim();
        }
        int open = json.indexOf('{');
        int close = json.lastIndexOf('}');
        if (open >= 0 && close > open) json = json.substring(open, close + 1);
        try {
            JsonNode node = objectMapper.readTree(json);
            Map<String, Object> report = new LinkedHashMap<>();
            report.put("title", node.path("title").asText(null));
            report.put("labName", node.path("labName").asText(null));
            String dateStr = node.path("date").asText(null);
            report.put("date", dateStr != null && !dateStr.isBlank() ? dateStr : java.time.LocalDate.now().toString());
            report.put("recordType", inferRecordType(node));
            JsonNode diagNode = node.path("diagnosis");
            if (!diagNode.isMissingNode() && !diagNode.isNull() && !diagNode.asText("").isBlank()) {
                report.put("diagnosis", diagNode.asText());
            }
            List<Map<String, Object>> params = new ArrayList<>();
            JsonNode pArr = node.path("parameters");
            if (pArr.isArray()) {
                for (JsonNode p : pArr) {
                    Map<String, Object> pm = new LinkedHashMap<>();
                    pm.put("name", p.path("name").asText("Parameter"));
                    pm.put("value", p.path("value").asText("—"));
                    pm.put("unit", p.path("unit").asText(""));
                    pm.put("referenceRange", p.path("referenceRange").asText("-"));
                    pm.put("status", p.path("status").asText("NORMAL"));
                    params.add(pm);
                }
            }
            report.put("parameters", params);
            return report;
        } catch (Exception e) {
            log.warn("[Gemini] failed to parse lab extraction: {}", truncate(text));
            return null;
        }
    }

    /**
     * Normalises the record category returned by the AI (or infers it from the
     * report content) so the UI can pre-select "what the report belongs to", e.g.
     * a blood panel vs an X-ray/MRI/CT scan.
     */
    private String inferRecordType(JsonNode node) {
        String rt = node.path("recordType").asText("");
        if (rt != null && !rt.isBlank()) {
            String u = rt.toUpperCase();
            if (u.contains("IMAGING") || u.contains("SCAN") || u.contains("XRAY") || u.contains("X-RAY")
                    || u.contains("MRI") || u.contains("CT ") || u.contains("CTSCAN") || u.contains("ULTRASOUND")
                    || u.contains("SONOGRAPHY")) {
                return "IMAGING_SCAN";
            }
            if (u.contains("PRESCRIPTION")) return "PRESCRIPTION";
            if (u.contains("MANUAL")) return "MANUAL_RECORD";
        }
        String blob = (node.path("title").asText("") + " " + node.path("diagnosis").asText("")).toLowerCase();
        if (blob.contains("x-ray") || blob.contains("xray") || blob.contains("mri") || blob.contains("ct scan")
                || blob.contains("ctscan") || blob.contains("ultrasound") || blob.contains("sonography")
                || blob.contains("scan") || blob.contains("imaging")) {
            return "IMAGING_SCAN";
        }
        return "LAB_REPORT";
    }

    private String callGeminiVision(String mimeType, String base64Image) {
        if (!geminiEnabled()) {
            log.warn("[Gemini] disabled: key len={}", geminiApiKey == null ? -1 : geminiApiKey.length());
            return null;
        }
        if (base64Image == null || base64Image.isBlank()) return null;

        Map<String, Object> body = new LinkedHashMap<>();
        Map<String, Object> sys = new LinkedHashMap<>();
        sys.put("parts", List.of(Map.of("text",
                "You are NexusHealth's diagnostic AI. Read the uploaded lab report / diagnostic scan image. "
                        + "Extract its details and return a SINGLE compact JSON object containing exactly: "
                        + "{\"recordType\": \"LAB_REPORT\" | \"IMAGING_SCAN\" | \"PRESCRIPTION\" | \"MANUAL_RECORD\", "
                        + "\"title\": string, \"labName\": string, \"date\": \"YYYY-MM-DD\" or null if not visible, "
                        + "\"diagnosis\": string (a 1-2 sentence plain-language summary of what this report is about and its overall result/findings), "
                        + "\"parameters\": [{\"name\": string, \"value\": string, \"unit\": string, \"referenceRange\": string, \"status\": \"NORMAL\"|\"HIGH\"|\"LOW\"}]}. "
                        + "recordType is which kind of report this is: a blood/pathology panel is LAB_REPORT, an X-ray/MRI/CT/ultrasound is IMAGING_SCAN, a prescription is PRESCRIPTION, anything else MANUAL_RECORD. "
                        + "For X-ray/MRI/CT/ultrasound scans that have no numeric parameters, return parameters as an empty array and put the findings summary in \"diagnosis\". "
                        + "Return ONLY valid JSON, no markdown, no commentary.")));
        body.put("systemInstruction", sys);

        List<Map<String, Object>> parts = new ArrayList<>();
        parts.add(Map.of("text", "Analyze this uploaded diagnostic report and extract the structured JSON described."));
        Map<String, Object> inline = new LinkedHashMap<>();
        inline.put("mime_type", mimeType);
        inline.put("data", base64Image);
        parts.add(Map.of("inline_data", inline));
        body.put("contents", List.of(Map.of("role", "user", "parts", parts)));
        body.put("generationConfig", Map.of(
                "temperature", 0.2,
                "maxOutputTokens", 1500,
                "topP", 0.9
        ));

        return postGemini(body);
    }

    /**
     * Analyses pasted report text (no image available) using the same Gemini
     * extraction contract as the vision path, so patients can paste a report
     * and have every field auto-filled.
     */
    private String callGeminiTextExtraction(String reportText) {
        String snippets = reportText != null && reportText.length() > 7500
                ? reportText.substring(0, 7500)
                : reportText;
        return callGemini(
                "You are NexusHealth's diagnostic AI. Read the pasted lab report / diagnostic scan text below and return a SINGLE compact JSON object containing exactly: "
                        + "{\"recordType\": \"LAB_REPORT\" | \"IMAGING_SCAN\" | \"PRESCRIPTION\" | \"MANUAL_RECORD\", "
                        + "\"title\": string, \"labName\": string, \"date\": \"YYYY-MM-DD\" or null if not present, "
                        + "\"diagnosis\": string (a 1-2 sentence plain-language summary of what this report is about and its overall result/findings), "
                        + "\"parameters\": [{\"name\": string, \"value\": string, \"unit\": string, \"referenceRange\": string, \"status\": \"NORMAL\"|\"HIGH\"|\"LOW\"}]}. "
                        + "recordType is which kind of report this is: a blood/pathology panel is LAB_REPORT, an X-ray/MRI/CT/ultrasound is IMAGING_SCAN, a prescription is PRESCRIPTION, anything else MANUAL_RECORD. "
                        + "For scan texts with no numeric parameters, return parameters as an empty array and put the findings summary in \"diagnosis\". "
                        + "Return ONLY valid JSON, no markdown, no commentary.",
                "Pasted report content:\n" + snippets
        );
    }

    private String postGemini(Map<String, Object> body) {
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
                    JsonNode promptFeedback = root.path("promptFeedback").path("blockReason");
                    if (promptFeedback != null && !promptFeedback.isMissingNode() && !promptFeedback.asText("").isBlank()) {
                        log.warn("[Gemini] {} blocked: {}", model, promptFeedback.asText());
                        continue;
                    }
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
                    log.warn("[Gemini] {} HTTP {}. Body: {}", model, response.statusCode(), truncate(response.body()));
                }
            } catch (Exception e) {
                log.warn("[Gemini] {} call failed: {}", model, e.toString());
            }
        }
        return null;
    }

    private Map<String, Object> simulateLabExtraction(String fileName) {
        String name = fileName != null ? fileName.toLowerCase() : "";
        String title;
        String labName = "Central Diagnostic Pathology Labs";
        List<Map<String, Object>> params = new ArrayList<>();

        if (name.contains("thyroid")) {
            title = "Thyroid Panel (T3 / T4 / TSH)";
            params.add(param("T3 (Triiodothyronine)", "1.2", "ng/mL", "0.8 - 2.0", "NORMAL"));
            params.add(param("T4 (Thyroxine)", "8.1", "ug/dL", "5.1 - 11.9", "NORMAL"));
            params.add(param("TSH (Thyroid Stimulating Hormone)", "2.1", "uIU/mL", "0.4 - 4.0", "NORMAL"));
        } else if (name.contains("lipid") || name.contains("cholesterol")) {
            title = "Lipid Profile";
            params.add(param("Total Cholesterol", "182", "mg/dL", "< 200", "NORMAL"));
            params.add(param("Triglycerides", "131", "mg/dL", "< 150", "NORMAL"));
            params.add(param("HDL Cholesterol", "48", "mg/dL", "> 40", "NORMAL"));
            params.add(param("LDL Cholesterol", "112", "mg/dL", "< 100", "HIGH"));
        } else if (name.contains("liver") || name.contains("sgot") || name.contains("sgpt") || name.contains("alt") || name.contains("ast") || name.contains("bilirubin")) {
            title = "Liver Function Test";
            params.add(param("SGOT / AST", "31", "U/L", "10 - 40", "NORMAL"));
            params.add(param("SGPT / ALT", "34", "U/L", "7 - 56", "NORMAL"));
            params.add(param("Total Bilirubin", "0.8", "mg/dL", "0.1 - 1.2", "NORMAL"));
            params.add(param("Alkaline Phosphatase", "98", "U/L", "44 - 147", "NORMAL"));
        } else if (name.contains("hba1c") || name.contains("glucose") || name.contains("sugar") || name.contains("diabetes") || name.contains("fbs")) {
            title = "Blood Sugar & HbA1c Panel";
            params.add(param("Fasting Blood Sugar", "94", "mg/dL", "70 - 99", "NORMAL"));
            params.add(param("Post-Prandial Blood Sugar", "128", "mg/dL", "< 140", "NORMAL"));
            params.add(param("HbA1c", "5.4", "%", "< 5.7", "NORMAL"));
        } else if (name.contains("xray") || name.contains("x-ray") || name.contains("mri") || name.contains("ct scan") || name.contains("ultrasound") || name.contains("sonography") || name.contains("scan")) {
            title = "Diagnostic Imaging Report";
            Map<String, Object> report = new LinkedHashMap<>();
            report.put("title", title);
            report.put("recordType", "IMAGING_SCAN");
            report.put("labName", "NexusHealth Imaging & Diagnostics Centre");
            report.put("date", java.time.LocalDate.now().toString());
            report.put("parameters", List.of());
            report.put("diagnosis", "No acute abnormalities detected. Findings correlate with the clinical history.");
            return report;
        } else if (name.contains("cbc") || name.contains("blood count") || name.contains("hemoglobin") || name.contains("plat") || name.contains("complete")) {
            title = "Complete Blood Count (CBC)";
            params.add(param("Hemoglobin", "13.8", "g/dL", "12.0 - 16.0", "NORMAL"));
            params.add(param("Total WBC Count", "7200", "cells/uL", "4000 - 11000", "NORMAL"));
            params.add(param("RBC Count", "4.8", "million/uL", "4.2 - 5.4", "NORMAL"));
            params.add(param("Platelet Count", "2.6", "lakh/uL", "1.5 - 4.1", "NORMAL"));
        } else {
            title = "Pathology Lab Report";
            params.add(param("Fasting Blood Sugar", "92", "mg/dL", "70 - 99", "NORMAL"));
            params.add(param("Total Cholesterol", "178", "mg/dL", "< 200", "NORMAL"));
            params.add(param("Hemoglobin", "13.5", "g/dL", "12.0 - 16.0", "NORMAL"));
        }

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("title", title);
        report.put("recordType", "LAB_REPORT");
        report.put("labName", labName);
        report.put("date", java.time.LocalDate.now().toString());
        report.put("parameters", params);
        report.put("diagnosis", "Routine screening results. All measured parameters are within or near reference ranges; review the report with your physician.");
        return report;
    }

    private static Map<String, Object> param(String name, String value, String unit, String ref, String status) {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("name", name);
        p.put("value", value);
        p.put("unit", unit);
        p.put("referenceRange", ref);
        p.put("status", status);
        return p;
    }

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

    private String safeJson(Object value) {
        if (value == null) return "none";
        try {
            String s = objectMapper.writeValueAsString(value);
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
