package com.nexushealth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Email delivery for NexusHealth OTP codes via the Brevo REST API
 * (formerly Sendinblue). Works over plain HTTPS, so it runs anywhere
 * (Render, EC2, etc.) with no SMTP server or open ports required.
 *
 * When BREVO_API_KEY is not set, no email is sent and the OTP flow
 * falls back to auto-verification (see AuthService).
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
    private static final Pattern EMAIL_IN_DISPLAY = Pattern.compile(".*<([^<>]+)>.*");

    @Value("${nexushealth.email.brevo-api-key:}")
    private String brevoApiKey;

    @Value("${nexushealth.email.from:NexusHealth Identity <no-reply@nexushealth.in>}")
    private String fromAddress;

    /** True when an email provider is configured (Brevo API key set). */
    public boolean isEmailConfigured() {
        return brevoApiKey != null && !brevoApiKey.isBlank();
    }

    /** Dispatch an OTP email. Never throws - failures are logged. */
    public void sendOtpEmail(String toEmail, String otpCode) {
        if (!isEmailConfigured()) {
            log.info("[EmailService] No Brevo key configured - OTP for {} is {} (console only)", toEmail, otpCode);
            return;
        }

        String senderEmail = extractEmail(fromAddress);
        String body = """
            {
              "sender": { "name": "NexusHealth", "email": "%s" },
              "to": [ { "email": "%s" } ],
              "subject": "NexusHealth Verification Code: %s",
              "htmlContent": %s
            }
            """.formatted(escapeJson(senderEmail), toEmail, otpCode, toJsonString(buildHtmlBody(otpCode)));

        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BREVO_API_URL))
                    .timeout(Duration.ofSeconds(20))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .header("api-key", brevoApiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("[EmailService] Brevo OTP email dispatched to {}", toEmail);
            } else {
                log.warn("[EmailService] Brevo returned {} : {}", response.statusCode(), response.body());
            }
        } catch (Exception ex) {
            log.error("[EmailService] Brevo send failed", ex);
        }
    }

    private static String extractEmail(String displayOrEmail) {
        if (displayOrEmail == null || displayOrEmail.isBlank()) {
            return "no-reply@nexushealth.in";
        }
        Matcher m = EMAIL_IN_DISPLAY.matcher(displayOrEmail.trim());
        return m.matches() ? m.group(1).trim() : displayOrEmail.trim();
    }

    private String buildHtmlBody(String otpCode) {
        return """
            <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px; max-width: 550px; margin: 0 auto; border: 1px solid #1e293b;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #06b6d4; margin: 0; font-size: 24px; letter-spacing: 1px;">NexusHealth Verification</h2>
                <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">National Digital Health Mission Portal</p>
              </div>
              <div style="background-color: #1e293b; padding: 20px; border-radius: 8px; border: 1px solid #334155;">
                <p style="margin-top: 0; font-size: 14px;">Dear Citizen,</p>
                <p style="font-size: 14px; color: #cbd5e1;">Use the following 6-digit One-Time Password (OTP) to complete your email verification:</p>
                <div style="text-align: center; margin: 25px 0;">
                  <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #38bdf8; background-color: #092e42; padding: 12px 24px; border-radius: 8px; border: 1px solid #0284c7; display: inline-block;">
                    %s
                  </span>
                </div>
                <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">This OTP code is valid for 10 minutes. Please do not share this security code with anyone.</p>
              </div>
            </div>
            """.formatted(otpCode);
    }

    private static String toJsonString(String s) {
        return "\"" + escapeJson(s) + "\"";
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }
}