package com.nexushealth.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Value("${spring.mail.host:}")
    private String smtpHost;

    @Value("${spring.mail.username:}")
    private String smtpUser;

    @Value("${nexushealth.email.from:}")
    private String fromAddress;

    public record OtpDispatchResult(boolean sent, String previewUrl, boolean isEthereal) {
    }

    /**
     * Sends the OTP email over SMTP when SMTP_HOST/SMTP_USER/SMTP_PASSWORD
     * are configured. Unlike the Node version (which auto-provisions a
     * throwaway Ethereal test inbox via nodemailer.createTestAccount() when
     * no SMTP is configured), Spring's JavaMailSender has no equivalent -
     * so with no SMTP configured this just logs the OTP to the console and
     * lets the (already-generated) OTP flow continue, matching the Node
     * catch-branch behaviour of "still allow verification, just without a
     * real email".
     */
    public OtpDispatchResult sendOtpEmail(String toEmail, String otpCode) {
        if (smtpHost == null || smtpHost.isBlank() || smtpUser == null || smtpUser.isBlank()) {
            log.info("[EmailService] SMTP not configured - OTP for {} is {} (check console instead of inbox)", toEmail, otpCode);
            return new OtpDispatchResult(false, null, false);
        }

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
            log.info("[EmailService] OTP email dispatched to {}", toEmail);
            return new OtpDispatchResult(true, null, false);
        } catch (Exception ex) {
            log.error("[EmailService] Failed to send OTP email", ex);
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
}
