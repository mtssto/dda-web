package com.dda.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "artwork_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArtworkImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "artwork_id", nullable = false)
    private Artwork artwork;

    // For legacy images: relative path like /portfolio/sections/obras/file.jpg
    // For new Cloudinary uploads: full https://res.cloudinary.com/... URL
    @Column(name = "file_path", nullable = false, length = 1024)
    private String filePath;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "is_primary", nullable = false)
    private Boolean isPrimary;

    @Column(name = "sort_order")
    private Integer sortOrder;

    // Cloudinary public_id — required to delete the file from Cloudinary.
    // NULL for legacy images that were not uploaded through Cloudinary.
    @Column(name = "cloudinary_public_id", length = 512)
    private String cloudinaryPublicId;
}
