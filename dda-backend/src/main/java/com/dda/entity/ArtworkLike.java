package com.dda.entity;

import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "artwork_likes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@IdClass(ArtworkLike.Key.class)
public class ArtworkLike {

    @Id
    @Column(name = "artwork_id")
    private Long artworkId;

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode
    public static class Key implements Serializable {
        private Long artworkId;
        private Long userId;
    }
}
