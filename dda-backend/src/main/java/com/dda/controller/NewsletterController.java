package com.dda.controller;

import com.dda.entity.NewsletterSubscriber;
import com.dda.repository.NewsletterRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/newsletter")
@RequiredArgsConstructor
public class NewsletterController {

    private final NewsletterRepository newsletterRepository;

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

    public record SubscribeRequest(
            @NotBlank(message = "El email es obligatorio")
            @Email(message = "Formato de email inválido")
            String email
    ) {}
}
