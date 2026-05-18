package com.dda.controller;

import com.dda.entity.NewsletterSubscriber;
import com.dda.repository.NewsletterRepository;
import com.dda.service.EmailService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/newsletter")
@RequiredArgsConstructor
public class NewsletterController {

    private final NewsletterRepository newsletterRepository;
    private final EmailService emailService;

    @PostMapping("/subscribe")
    public ResponseEntity<Map<String, String>> subscribe(@Valid @RequestBody SubscribeRequest request) {
        String email = request.email().trim().toLowerCase();

        Optional<NewsletterSubscriber> existing = newsletterRepository.findByEmail(email);
        if (existing.isPresent()) {
            NewsletterSubscriber sub = existing.get();
            if (sub.isActive()) {
                return ResponseEntity.ok(Map.of("message", "Ya estás suscripto al newsletter."));
            }
            sub.setActive(true);
            newsletterRepository.save(sub);
            return ResponseEntity.ok(Map.of("message", "Te has re-suscripto al newsletter."));
        }

        NewsletterSubscriber subscriber = NewsletterSubscriber.builder()
                .email(email)
                .build();
        newsletterRepository.save(subscriber);

        return ResponseEntity.ok(Map.of("message", "¡Gracias por suscribirte!"));
    }

    @PostMapping("/unsubscribe")
    public ResponseEntity<Map<String, String>> unsubscribe(@Valid @RequestBody SubscribeRequest request) {
        String email = request.email().trim().toLowerCase();

        Optional<NewsletterSubscriber> existing = newsletterRepository.findByEmail(email);
        if (existing.isPresent()) {
            NewsletterSubscriber sub = existing.get();
            sub.setActive(false);
            newsletterRepository.save(sub);
        }

        return ResponseEntity.ok(Map.of("message", "Te has dado de baja del newsletter."));
    }

    @GetMapping("/subscribers")
    public ResponseEntity<Map<String, Object>> getSubscribers() {
        List<NewsletterSubscriber> active = newsletterRepository.findByActiveTrue();
        List<Map<String, Object>> list = active.stream().map(s -> Map.<String, Object>of(
                "id", s.getId(),
                "email", s.getEmail(),
                "subscribedAt", s.getSubscribedAt().toString()
        )).toList();
        return ResponseEntity.ok(Map.of("subscribers", list, "count", active.size()));
    }

    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendNewsletter(@Valid @RequestBody SendRequest request) {
        List<NewsletterSubscriber> active = newsletterRepository.findByActiveTrue();
        if (active.isEmpty()) {
            return ResponseEntity.ok(Map.of("sent", 0, "message", "No hay suscriptores activos."));
        }

        String htmlContent = buildNewsletterHtml(request.subject(), request.body());
        int sent = 0;
        for (NewsletterSubscriber sub : active) {
            emailService.sendNewsletter(sub.getEmail(), request.subject(), htmlContent);
            sent++;
        }

        return ResponseEntity.ok(Map.of("sent", sent, "message", "Newsletter enviado a " + sent + " suscriptor(es)."));
    }

    private String buildNewsletterHtml(String subject, String body) {
        String bodyHtml = body.replace("\n", "<br>");
        return "<!DOCTYPE html>" +
            "<html lang=\"es\">" +
            "<head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"></head>" +
            "<body style=\"margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;\">" +
            "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f5f5f5;padding:40px 20px;\">" +
            "<tr><td align=\"center\">" +
            "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:520px;background:#fff;border-radius:4px;overflow:hidden;\">" +
            "<tr><td style=\"background:#0e0e0e;padding:48px 40px;text-align:center;\">" +
            "<h1 style=\"margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;font-style:italic;color:#fff;letter-spacing:-0.02em;\">Diego De Aduriz</h1>" +
            "<p style=\"margin:8px 0 0;font-size:11px;text-transform:uppercase;letter-spacing:0.2em;color:rgba(255,255,255,0.5);\">Newsletter</p>" +
            "</td></tr>" +
            "<tr><td style=\"padding:48px 40px;\">" +
            "<h2 style=\"margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;color:#111;\">" + subject + "</h2>" +
            "<div style=\"font-size:15px;line-height:1.7;color:#444;\">" + bodyHtml + "</div>" +
            "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:32px auto 0;\">" +
            "<tr><td style=\"background:#111;border-radius:4px;\">" +
            "<a href=\"https://diegodeaduriz.art/shop/shop.html\" target=\"_blank\" style=\"display:inline-block;padding:14px 32px;font-size:13px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:#fff;text-decoration:none;\">Visitar la tienda</a>" +
            "</td></tr></table>" +
            "</td></tr>" +
            "<tr><td style=\"padding:32px 40px;border-top:1px solid #eee;text-align:center;\">" +
            "<p style=\"margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:14px;color:#111;\">&mdash; DDA</p>" +
            "<p style=\"margin:0;font-size:11px;color:#999;\">diegodeaduriz.art</p>" +
            "</td></tr>" +
            "</table></td></tr></table></body></html>";
    }

    public record SubscribeRequest(
            @NotBlank(message = "El email es obligatorio")
            @Email(message = "Formato de email inválido")
            String email
    ) {}

    public record SendRequest(
            @NotBlank(message = "El asunto es obligatorio")
            String subject,
            @NotBlank(message = "El contenido es obligatorio")
            String body
    ) {}
}
