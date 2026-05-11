package com.dda.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "artwork_images")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ArtworkImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "artwork_id", nullable = false)
    private Artwork artwork;

    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "file_name", length = 200)
    private String fileName;

    @Column(name = "content_type", length = 50)
    private String contentType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "is_primary")
    @Builder.Default
    private Boolean isPrimary = false;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;
}
