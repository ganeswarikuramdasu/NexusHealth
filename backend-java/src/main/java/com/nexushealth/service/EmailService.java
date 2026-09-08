package com.nexushealth.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Email delivery for NexusHealth OTP codes.
 *
 * Delivery order:
 *   1. Brevo (formerly Sendinblue) REST API  - used when BREVO_API_KEY is set.
 *      Works over plain HTTPS, so it runs anywhere (Render, EC2, etc.) with no
 *      SMTP ports or Vercel constraints.
 *   2. SMTP (Spring JavaMailSender)           - fallback when SMTP_HOST/USER/PASS are set.
 *   3. Disabled                                - when neither is configured; the OTP is
 *                                                logged to the console and treated as
 *                                                auto-verified (see AuthService).
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Value("${nexushealth.email.provider:SMTP}")
    private String provider;

    @Value("${nexushealth.email.brevo-api-key:}")
    private String brevoApiKey;

    @Value("${spring.mail.host:}")
    private String smtpHost;

    @Value("${spring.mail.username:}")
    private String smtpUser;

    @Value("${spring.mail.password:}")
    private String smtpPass;

    @Value("${nexushealth.email.from:}")
    private String fromAddress;

    public record OtpDispatchResult(boolean sent, String previewUrl, boolean isEthereal) {
    }

    /** True if any email provider (Brevo or SMTP) is configured. */
    public boolean isEmailConfigured() {
        return isBrevoConfigured() || isSmtpConfigured();
    }

    public boolean isBrevoConfigured() {
        return brevoApiKey != null && !brevoApiKey.isBlank();
    }

    public boolean isSmtpConfigured() {
        return smtpHost != null && !smtpHost.isBlank()
                && smtpUser != null && !smtpUser.isBlank()
                && smtpPass != null && !smtpPass.isBlank();
    }

    public OtpDispatchResult sendOtpEmail(String toEmail, String otpCode) {
        if (isBrevoConfigured()) {
            return sendBrevo(toEmail, otpCode);
        }
        if (isSmtpConfigured()) {
            return sendSmtp(toEmail, otpCode);
        }
        log.info("[EmailService] No email provider configured - OTP for {} is {} (shown in console only)", toEmail, otpCode);
        return new OtpDispatchResult(false, null, false);
    }

    // ---------------------------------------------------------------
    // Brevo REST API (preferred - works over HTTPS, no SMTP needed)
    // ---------------------------------------------------------------
    private OtpDispatchResult sendBrevo(String toEmail, String otpCode) {
        try {
            String body = """
                {
                  "sender": { "name": "NexusHealth", "email": "%s" },
                  "to": [ { "email": "%s" } ],
                  "subject": "NexusHealth Verification Code: %s",
                  "htmlContent": %s
                }
                """.formatted(escapeJson(fromAddress == null || fromAddress.isBlank() ? "no-reply@nexushealth.in" : fromAddress),
                toEmail, otpCode, toJsonString(buildHtmlBody(otpCode)));

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
                return new OtpDispatchResult(true, null, false);
            }
            log.warn("[EmailService] Brevo returned {} : {}", response.statusCode(), response.body());
            return new OtpDispatchResult(false, null, false);
        } catch (Exception ex) {
            log.error("[EmailService] Brevo send failed", ex);
            return new OtpDispatchResult(false, null, false);
        }
    }

    // ---------------------------------------------------------------
    // SMTP fallback via Spring JavaMailSender
    // ---------------------------------------------------------------
    private OtpDispatchResult sendSmtp(String toEmail, String otpCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            if (fromAddress != null && !fromAddress.isBlank()) {
                helper.setFrom(fromAddress);
            }
            helper.setTo(toEmail);
            helper.setSubject("NexusHealth Verification Code: " + otpCode);
            helper.setText(buildHtmlBody(otpCode), true);
            mailSender.send(message);
            log.info("[EmailService] OTP email dispatched to {} via SMTP", toEmail);
            return new OtpDispatchResult(true, null, false);
        } catch (Exception ex) {
            log.error("[EmailService] Failed to send OTP email via SMTP", ex);
            return new OtpDispatchResult(false, null, false);
        }
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
