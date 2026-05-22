package com.dda.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "journal_posts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JournalPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String slug;

    @Column(name = "title_es", nullable = false, length = 300)
    private String titleEs;

    @Column(name = "title_en", length = 300)
    private String titleEn;

    @Column(name = "excerpt_es", columnDefinition = "TEXT")
    private String excerptEs;

    @Column(name = "excerpt_en", columnDefinition = "TEXT")
    private String excerptEn;

    @Column(name = "content_es", columnDefinition = "LONGTEXT")
    private String contentEs;

    @Column(name = "content_en", columnDefinition = "LONGTEXT")
    private String contentEn;

    @Column(name = "cover_image", length = 500)
    private String coverImage;

    @Column(length = 500)
    private String tags;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.DRAFT;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(name = "author_id")
    private Long authorId;

    @Column(name = "likes_count")
    @Builder.Default
    private Integer likesCount = 0;

    @Column(name = "send_newsletter_on_publish")
    @Builder.Default
    private Boolean sendNewsletterOnPublish = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum Status {
        DRAFT, SCHEDULED, PUBLISHED
    }
}
