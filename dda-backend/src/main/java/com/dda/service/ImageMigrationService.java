package com.dda.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.dda.entity.ArtworkImage;
import com.dda.repository.ArtworkImageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageMigrationService {

    private final Cloudinary             cloudinary;
    private final ArtworkImageRepository artworkImageRepository;

    @Value("${app.static.base-url:https://diegodeaduriz.art}")
    private String staticBaseUrl;

    // -------------------------------------------------------------------------
    // Result summary returned to the caller
    // -------------------------------------------------------------------------

    public record MigrationResult(
            int total,
            int migrated,
            int skipped,
            int failed,
            List<String> errors
    ) {}

    // -------------------------------------------------------------------------
    // Main migration method
    // -------------------------------------------------------------------------

    @Transactional
    public MigrationResult migrateAll() {
        // Only process images that haven't been migrated yet
        List<ArtworkImage> pending = artworkImageRepository.findByCloudinaryPublicIdIsNull();

        int migrated = 0;
        int skipped  = 0;
        int failed   = 0;
        List<String> errors = new ArrayList<>();

        log.info("Starting Cloudinary migration — {} images pending", pending.size());

        for (ArtworkImage image : pending) {
            String fullUrl = resolveUrl(image.getFilePath());

            if (fullUrl == null) {
                log.warn("Skipping image id={} — filePath is blank", image.getId());
                skipped++;
                continue;
            }

            try {
                // Download from current location
                byte[] bytes = downloadImage(fullUrl);

                // Upload to Cloudinary under dda/artworks/<artworkId>/
                Map<?, ?> result = cloudinary.uploader().upload(
                        bytes,
                        ObjectUtils.asMap(
                                "folder",        "dda/artworks/" + image.getArtwork().getId(),
                                "resource_type", "image",
                                "overwrite",     false
                        )
                );

                String publicId  = (String) result.get("public_id");
                String secureUrl = (String) result.get("secure_url");

                // Update the record in place — no data loss, just updating pointers
                image.setCloudinaryPublicId(publicId);
                image.setFilePath(secureUrl);
                artworkImageRepository.save(image);

                log.info("Migrated image id={} → {}", image.getId(), publicId);
                migrated++;

            } catch (Exception e) {
                String msg = "Failed image id=" + image.getId() + " url=" + fullUrl + ": " + e.getMessage();
                log.error(msg, e);
                errors.add(msg);
                failed++;
            }
        }

        log.info("Migration complete — migrated={} skipped={} failed={}", migrated, skipped, failed);
        return new MigrationResult(pending.size(), migrated, skipped, failed, errors);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Turns the stored filePath into a downloadable URL.
     * - Already absolute (https://...) → used as-is
     * - Root-relative (/portfolio/...) → prepend staticBaseUrl
     */
    private String resolveUrl(String filePath) {
        if (filePath == null || filePath.isBlank()) return null;
        if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
        String base = staticBaseUrl.replaceAll("/+$", "");
        return base + (filePath.startsWith("/") ? filePath : "/" + filePath);
    }

    private byte[] downloadImage(String url) throws Exception {
        try (InputStream in = URI.create(url).toURL().openStream()) {
            return in.readAllBytes();
        }
    }
}
