package com.dda.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@diegodeaduriz.art}")
    private String fromEmail;

    @Value("${dda.mail.enabled:false}")
    private boolean mailEnabled;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async
    public void sendWelcomeEmail(String toEmail, String username) {
        if (!mailEnabled) {
            log.info("Email disabled — skipping welcome email to {}", toEmail);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Bienvenido a DDA — Diego De Aduriz");
            helper.setText(buildWelcomeHtml(username), true);

            mailSender.send(message);
            log.info("Welcome email sent to {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send welcome email to {}: {}", toEmail, e.getMessage());
        }
    }

    private String buildWelcomeHtml(String username) {
        return "<!DOCTYPE html>" +
            "<html lang=\"es\">" +
            "<head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"></head>" +
            "<body style=\"margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;\">" +
            "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f5f5f5;padding:40px 20px;\">" +
            "<tr><td align=\"center\">" +
            "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:520px;background:#fff;border-radius:4px;overflow:hidden;\">" +

            // Header
            "<tr><td style=\"background:#0e0e0e;padding:48px 40px;text-align:center;\">" +
            "<h1 style=\"margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;font-style:italic;color:#fff;letter-spacing:-0.02em;\">Diego De Aduriz</h1>" +
            "<p style=\"margin:8px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:0.2em;color:rgba(255,255,255,0.5);\">Arte &middot; Identidad &middot; Experiencia</p>" +
            "</td></tr>" +

            // Body
            "<tr><td style=\"padding:48px 40px;\">" +
            "<h2 style=\"margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;color:#111;\">Bienvenido, " + escapeHtml(username) + ".</h2>" +
            "<p style=\"margin:0 0 20px;font-size:15px;line-height:1.7;color:#444;\">Un espacio donde el arte, la identidad y las experiencias digitales se conectan.</p>" +
            "<p style=\"margin:0 0 20px;font-size:15px;line-height:1.7;color:#444;\">Nos alegra tenerte ac&aacute;. Explor&aacute; obras &uacute;nicas, descubr&iacute; nuevos artistas y hac&eacute; tuya la galer&iacute;a.</p>" +
            "<p style=\"margin:0 0 32px;font-size:15px;line-height:1.7;color:#444;\">Esto es solo el comienzo.</p>" +

            // CTA Button
            "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:0 auto;\">" +
            "<tr><td style=\"background:#111;border-radius:4px;\">" +
            "<a href=\"https://diegodeaduriz.art/shop/shop.html\" target=\"_blank\" style=\"display:inline-block;padding:14px 32px;font-size:13px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:#fff;text-decoration:none;\">Explorar la tienda</a>" +
            "</td></tr></table>" +
            "</td></tr>" +

            // Footer
            "<tr><td style=\"padding:32px 40px;border-top:1px solid #eee;text-align:center;\">" +
            "<p style=\"margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:14px;color:#111;\">&mdash; DDA</p>" +
            "<p style=\"margin:0;font-size:11px;color:#999;\">diegodeaduriz.art</p>" +
            "</td></tr>" +

            "</table>" +
            "</td></tr></table>" +
            "</body></html>";
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                     .replace("<", "&lt;")
                     .replace(">", "&gt;")
                     .replace("\"", "&quot;");
    }
}
