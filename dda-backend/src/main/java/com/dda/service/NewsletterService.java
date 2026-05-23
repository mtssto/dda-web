package com.dda.service;

import com.dda.entity.JournalPost;
import com.dda.entity.NewsletterSubscriber;
import com.dda.repository.NewsletterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NewsletterService {

    private final NewsletterRepository newsletterRepository;
    private final EmailService emailService;

    @Value("${app.static.base-url:https://diegodeaduriz.art}")
    private String baseUrl;

    public void subscribe(String email, String source) {
        String normalized = email.trim().toLowerCase();
        Optional<NewsletterSubscriber> existing = newsletterRepository.findByEmail(normalized);
        if (existing.isPresent()) {
            NewsletterSubscriber sub = existing.get();
            if (!sub.isActive()) {
                sub.setActive(true);
                sub.setSource(source != null ? source : "web");
                newsletterRepository.save(sub);
            }
            return;
        }
        newsletterRepository.save(NewsletterSubscriber.builder()
                .email(normalized)
                .source(source != null ? source : "web")
                .active(true)
                .build());
    }

    public void subscribeFromRegistration(String email) {
        subscribe(email, "registration");
    }

    public long countSubscribers() {
        return newsletterRepository.countByActiveTrue();
    }

    public void sendJournalCampaign(JournalPost post) {
        List<NewsletterSubscriber> subscribers = newsletterRepository.findByActiveTrue();
        if (subscribers.isEmpty()) {
            log.info("No active subscribers for journal campaign");
            return;
        }

        String subject = post.getTitleEs();
        String postUrl = baseUrl + "/journal/post.html?slug=" + post.getSlug();
        String excerpt = post.getExcerptEs() != null ? post.getExcerptEs() : "";
        String image = post.getCoverImage() != null ? post.getCoverImage() : "";

        for (NewsletterSubscriber sub : subscribers) {
            try {
                emailService.sendJournalNewsletter(sub.getEmail(), subject, excerpt, image, postUrl);
            } catch (Exception e) {
                log.warn("Failed to send newsletter to {}: {}", sub.getEmail(), e.getMessage());
            }
        }
        log.info("Journal newsletter sent to {} subscribers for post {}", subscribers.size(), post.getSlug());
    }
}
