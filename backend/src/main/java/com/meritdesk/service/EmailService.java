package com.meritdesk.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Async
    public void sendInvitationEmail(String toEmail, String name, String token) {
        try {
            String setPasswordLink = frontendUrl + "/set-password?token=" + token;
            String subject = "Welcome to MeritDesk - Set Your Password";
            String body = """
                <html>
                <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f7fa; padding: 40px;">
                    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 12px rgba(0,0,0,0.1);">
                        <h1 style="color: #6366f1; margin-bottom: 8px;">Welcome to MeritDesk!</h1>
                        <p style="color: #64748b; font-size: 16px;">Hello <strong>%s</strong>,</p>
                        <p style="color: #475569; font-size: 15px;">You've been invited to join your team on MeritDesk. Please click the button below to set your password and get started.</p>
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="%s" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">Set Your Password</a>
                        </div>
                        <p style="color: #94a3b8; font-size: 13px;">This link will expire in 48 hours. If you didn't expect this invitation, please ignore this email.</p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                        <p style="color: #94a3b8; font-size: 12px; text-align: center;">MeritDesk - Intelligent SLA-Based Ticket Management</p>
                    </div>
                </body>
                </html>
                """.formatted(name, setPasswordLink);

            sendHtmlEmail(toEmail, subject, body);
        } catch (Exception e) {
            log.error("Failed to send invitation email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendNotificationEmail(String toEmail, String subject, String message) {
        try {
            String body = """
                <html>
                <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f7fa; padding: 40px;">
                    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 12px rgba(0,0,0,0.1);">
                        <h2 style="color: #6366f1;">MeritDesk Notification</h2>
                        <p style="color: #475569; font-size: 15px;">%s</p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                        <p style="color: #94a3b8; font-size: 12px; text-align: center;">MeritDesk - Intelligent SLA-Based Ticket Management</p>
                    </div>
                </body>
                </html>
                """.formatted(message);

            sendHtmlEmail(toEmail, subject, body);
        } catch (Exception e) {
            log.error("Failed to send notification email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String name, String token) {
        try {
            String subject = "MeritDesk - Password Reset OTP";
            String body = """
                <html>
                <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f7fa; padding: 40px;">
                    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 12px rgba(0,0,0,0.1);">
                        <h2 style="color: #6366f1;">Password Reset OTP</h2>
                        <p style="color: #475569; font-size: 15px;">Hello <strong>%s</strong>,</p>
                        <p style="color: #475569; font-size: 15px;">We received a request to reset your password. Please use the 6-digit code below to complete the reset process.</p>
                        <div style="text-align: center; margin: 32px 0;">
                            <div style="background: #f1f5f9; border: 1px dashed #cbd5e1; display: inline-block; padding: 16px 32px; border-radius: 12px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f172a;">
                                %s
                            </div>
                        </div>
                        <p style="color: #94a3b8; font-size: 13px;">If you didn't request a password reset, you can safely ignore this email. This code will expire in 2 hours.</p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                        <p style="color: #94a3b8; font-size: 12px; text-align: center;">MeritDesk - Intelligent SLA-Based Ticket Management</p>
                    </div>
                </body>
                </html>
                """.formatted(name, token);

            sendHtmlEmail(toEmail, subject, body);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}", toEmail, e.getMessage());
        }
    }

    private void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent to {}", to);
        } catch (Exception e) {
            log.error("Email sending failed for {}: {}", to, e.getMessage());
        }
    }
}
