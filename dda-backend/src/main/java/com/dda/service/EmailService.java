package com.dda.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Value("${dda.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${dda.mail.resend-api-key:}")
    private String resendApiKey;

    @Value("${dda.mail.from:DDA <onboarding@resend.dev>}")
    private String fromEmail;

    @Value("${dda.mail.comment-notify-to:admin@diegodeaduriz.art}")
    private String commentNotifyTo;

    @Value("${app.static.base-url:https://diegodeaduriz.art}")
    private String staticBaseUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Async
    public void sendWelcomeEmail(String toEmail, String username) {
        if (!mailEnabled) {
            log.info("Email disabled — skipping welcome email to {}", toEmail);
            return;
        }

        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.warn("Resend API key not configured — skipping welcome email to {}", toEmail);
            return;
        }

        String htmlContent = buildWelcomeHtml(username);
        sendViaResend(toEmail, "Bienvenido a DDA — Diego De Aduriz", htmlContent);
    }

    public void sendNewsletter(String toEmail, String subject, String htmlContent) {
        if (!mailEnabled) {
            log.info("Email disabled — skipping newsletter to {}", toEmail);
            return;
        }

        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.warn("Resend API key not configured — skipping newsletter to {}", toEmail);
            return;
        }

        sendViaResend(toEmail, subject, htmlContent);
    }

    public void sendJournalNewsletter(String toEmail, String subject, String excerpt, String imageUrl, String postUrl) {
        String html = buildJournalEmailHtml(subject, excerpt, imageUrl, postUrl);
        if (!mailEnabled || resendApiKey == null || resendApiKey.isBlank()) {
            log.info("[Journal newsletter preview] To: {} | Subject: {} | URL: {}", toEmail, subject, postUrl);
            return;
        }
        sendViaResend(toEmail, subject, html);
    }

    @Async
    public void sendArtworkCommentAlert(String artworkTitle, String artworkSlug, String authorName, String commentContent) {
        if (!mailEnabled) {
            log.info("Email disabled — skipping artwork comment alert for {}", artworkSlug);
            return;
        }
        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.warn("Resend API key not configured — skipping artwork comment alert for {}", artworkSlug);
            return;
        }
        if (commentNotifyTo == null || commentNotifyTo.isBlank()) {
            log.warn("Comment notify email not configured — skipping alert for {}", artworkSlug);
            return;
        }

        String base = staticBaseUrl.endsWith("/") ? staticBaseUrl.substring(0, staticBaseUrl.length() - 1) : staticBaseUrl;
        String obraUrl = base + "/shop/obra.html?id=" + java.net.URLEncoder.encode(artworkSlug, java.nio.charset.StandardCharsets.UTF_8);
        String subject = "Nuevo comentario en obra: " + artworkTitle;
        String html = buildArtworkCommentHtml(artworkTitle, authorName, commentContent, obraUrl);
        sendViaResend(commentNotifyTo, subject, html);
    }

    private void sendViaResend(String toEmail, String subject, String htmlContent) {
        String jsonBody = String.format(
                "{\"from\":\"%s\",\"to\":[\"%s\"],\"subject\":\"%s\",\"html\":%s}",
                escapeJson(fromEmail),
                escapeJson(toEmail),
                escapeJson(subject),
                toJsonString(htmlContent)
        );

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Email sent to {} via Resend", toEmail);
            } else {
                log.error("Resend API error ({}): {}", response.statusCode(), response.body());
            }
        } catch (IOException | InterruptedException e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
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
            "<tr><td style=\"background:#0e0e0e;padding:48px 40px;text-align:center;\">" +
            "<h1 style=\"margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;font-style:italic;color:#fff;letter-spacing:-0.02em;\">Diego De Aduriz</h1>" +
            "<p style=\"margin:8px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:0.2em;color:rgba(255,255,255,0.5);\">Arte &middot; Identidad &middot; Experiencia</p>" +
            "</td></tr>" +
            "<tr><td style=\"padding:48px 40px;\">" +
            "<h2 style=\"margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;color:#111;\">Bienvenido, " + escapeHtml(username) + ".</h2>" +
            "<p style=\"margin:0 0 20px;font-size:15px;line-height:1.7;color:#444;\">Un espacio donde el arte, la identidad y las experiencias digitales se conectan.</p>" +
            "<p style=\"margin:0 0 32px;font-size:15px;line-height:1.7;color:#444;\">Explor&aacute; obras &uacute;nicas y hac&eacute; tuya la galer&iacute;a.</p>" +
            "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:0 auto;\">" +
            "<tr><td style=\"background:#111;border-radius:4px;\">" +
            "<a href=\"https://diegodeaduriz.art/shop/shop.html\" target=\"_blank\" style=\"display:inline-block;padding:14px 32px;font-size:13px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:#fff;text-decoration:none;\">Explorar la tienda</a>" +
            "</td></tr></table>" +
            "</td></tr>" +
            "<tr><td style=\"padding:32px 40px;border-top:1px solid #eee;text-align:center;\">" +
            "<p style=\"margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:14px;color:#111;\">&mdash; DDA</p>" +
            "<p style=\"margin:0;font-size:11px;color:#999;\">diegodeaduriz.art</p>" +
            "</td></tr>" +
            "</table></td></tr></table></body></html>";
    }

    private String buildArtworkCommentHtml(String artworkTitle, String authorName, String commentContent, String obraUrl) {
        String preview = commentContent == null ? "" : commentContent.trim();
        if (preview.length() > 500) {
            preview = preview.substring(0, 497) + "...";
        }
        return "<!DOCTYPE html><html lang=\"es\"><head><meta charset=\"UTF-8\"></head>" +
            "<body style=\"margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;\">" +
            "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f5f5f5;padding:40px 20px;\">" +
            "<tr><td align=\"center\">" +
            "<table role=\"presentation\" width=\"100%\" style=\"max-width:520px;background:#fff;border-radius:4px;\">" +
            "<tr><td style=\"background:#0e0e0e;padding:32px 40px;text-align:center;\">" +
            "<h1 style=\"margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;font-style:italic;color:#fff;\">Nuevo comentario</h1>" +
            "</td></tr>" +
            "<tr><td style=\"padding:32px 40px;\">" +
            "<p style=\"margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:0.12em;color:#888;\">Obra</p>" +
            "<h2 style=\"margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:400;color:#111;\">" + escapeHtml(artworkTitle) + "</h2>" +
            "<p style=\"margin:0 0 6px;font-size:13px;color:#888;\">De <strong style=\"color:#333;\">" + escapeHtml(authorName) + "</strong></p>" +
            "<blockquote style=\"margin:20px 0;padding:16px 20px;border-left:3px solid #c9a962;background:#fafafa;font-size:15px;line-height:1.6;color:#444;\">" +
            escapeHtml(preview) +
            "</blockquote>" +
            "<p style=\"margin:28px 0 0;\"><a href=\"" + escapeHtml(obraUrl) + "\" style=\"display:inline-block;padding:12px 24px;background:#111;color:#fff;text-decoration:none;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;border-radius:4px;\">Ver obra</a></p>" +
            "</td></tr>" +
            "<tr><td style=\"padding:24px 40px;border-top:1px solid #eee;text-align:center;\">" +
            "<p style=\"margin:0;font-size:11px;color:#999;\">diegodeaduriz.art</p>" +
            "</td></tr></table></td></tr></table></body></html>";
    }

    private String buildJournalEmailHtml(String title, String excerpt, String imageUrl, String postUrl) {
        String imgBlock = (imageUrl != null && !imageUrl.isBlank())
                ? "<tr><td style=\"padding:0 40px 24px;\"><img src=\"" + escapeHtml(imageUrl) + "\" alt=\"\" style=\"max-width:100%;border-radius:4px;\"/></td></tr>"
                : "";
        return "<!DOCTYPE html><html lang=\"es\"><head><meta charset=\"UTF-8\"></head>" +
            "<body style=\"margin:0;padding:0;background:#0a0a0b;font-family:Georgia,'Times New Roman',serif;\">" +
            "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#0a0a0b;padding:40px 20px;\">" +
            "<tr><td align=\"center\">" +
            "<table role=\"presentation\" width=\"100%\" style=\"max-width:520px;background:#121214;border-radius:4px;\">" +
            "<tr><td style=\"padding:40px 40px 16px;text-align:center;\">" +
            "<p style=\"margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.2em;color:rgba(242,240,235,0.5);\">Cuaderno del artista</p>" +
            "<h1 style=\"margin:12px 0 0;font-size:26px;font-weight:400;font-style:italic;color:#f2f0eb;\">" + escapeHtml(title) + "</h1>" +
            "</td></tr>" +
            imgBlock +
            "<tr><td style=\"padding:0 40px 32px;\">" +
            "<p style=\"margin:0;font-size:15px;line-height:1.7;color:rgba(242,240,235,0.7);\">" + escapeHtml(excerpt) + "</p>" +
            "<p style=\"margin:28px 0 0;\"><a href=\"" + escapeHtml(postUrl) + "\" style=\"color:#c9a962;text-decoration:none;letter-spacing:0.12em;font-size:12px;text-transform:uppercase;\">Leer en el cuaderno &rarr;</a></p>" +
            "</td></tr></table></td></tr></table></body></html>";
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private String toJsonString(String input) {
        return "\"" + input.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t") + "\"";
    }
}
