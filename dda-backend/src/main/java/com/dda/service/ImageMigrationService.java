package com.dda.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.dda.entity.ArtworkImage;
import com.dda.repository.ArtworkImageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URL;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageMigrationService {

    private final Cloudinary cloudinary;
    private final ArtworkImageRepository artworkImageRepository;

    @Value("${app.static.base-url:https://diegodeaduriz.art}")
    private String staticBaseUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .connectTimeout(Duration.ofSeconds(20))
            .build();

    public record MigrationResult(
            int total,
            int migrated,
            int skipped,
            int failed,
            List<String> errors
    ) {}

    public MigrationResult migrateAll() {
        List<ArtworkImage> pending = artworkImageRepository.findByCloudinaryPublicIdIsNull();

        int migrated = 0;
        int skipped = 0;
        int failed = 0;
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
                byte[] bytes = downloadImage(fullUrl);

                Map<?, ?> result = cloudinary.uploader().upload(
                        bytes,
                        ObjectUtils.asMap(
                                "folder", "dda/artworks/" + image.getArtwork().getId(),
                                "resource_type", "image",
                                "public_id", "artwork-" + image.getArtwork().getId() + "-image-" + image.getId(),
                                "overwrite", true
                        )
                );

                String publicId = (String) result.get("public_id");
                String secureUrl = (String) result.get("secure_url");

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

        return new MigrationResult(
                pending.size(),
                migrated,
                skipped,
                failed,
                errors
        );
    }

    private String resolveUrl(String filePath) {
        if (filePath == null || filePath.isBlank()) {
            return null;
        }

        String cleanPath = filePath.trim();

        if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
            return cleanPath;
        }

        String base = staticBaseUrl.replaceAll("/+$", "");

        return base + (cleanPath.startsWith("/") ? cleanPath : "/" + cleanPath);
    }

    private byte[] downloadImage(String rawUrl) throws Exception {
        URI uri = toSafeImageUri(rawUrl);

        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(45))
                .header("User-Agent", "Mozilla/5.0")
                .header("Accept", "image/avif,image/webp,image/apng,image/png,image/jpeg,image/*,*/*;q=0.8")
                .GET()
                .build();

        HttpResponse<byte[]> response = httpClient.send(
                request,
                HttpResponse.BodyHandlers.ofByteArray()
        );

        int status = response.statusCode();
        byte[] body = response.body();

        String contentType = response.headers()
                .firstValue("content-type")
                .orElse("");

        if (status < 200 || status >= 300) {
            throw new RuntimeException(
                    "Image download failed with HTTP " + status +
                            ", contentType=" + contentType +
                            ", url=" + uri
            );
        }

        if (body == null || body.length == 0) {
            throw new RuntimeException("Image download returned empty body: " + uri);
        }

        if (!looksLikeImage(body)) {
            throw new RuntimeException(
                    "Downloaded file is not a valid image. " +
                            "contentType=" + contentType +
                            ", bytes=" + body.length +
                            ", url=" + uri
            );
        }

        return body;
    }

    private URI toSafeImageUri(String rawUrl) {
        try {
            String cleaned = rawUrl == null ? "" : rawUrl.trim();

            URL url = new URL(cleaned);

            return new URI(
                    url.getProtocol(),
                    url.getUserInfo(),
                    url.getHost(),
                    url.getPort(),
                    url.getPath(),
                    url.getQuery(),
                    url.getRef()
            );
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid image URL: " + rawUrl, e);
        }
    }

    private boolean looksLikeImage(byte[] bytes) {
        if (bytes == null || bytes.length < 12) {
            return false;
        }

        // JPEG
        if ((bytes[0] & 0xFF) == 0xFF &&
                (bytes[1] & 0xFF) == 0xD8 &&
                (bytes[2] & 0xFF) == 0xFF) {
            return true;
        }

        // PNG
        if ((bytes[0] & 0xFF) == 0x89 &&
                bytes[1] == 0x50 &&
                bytes[2] == 0x4E &&
                bytes[3] == 0x47) {
            return true;
        }

        // GIF
        if (bytes[0] == 'G' &&
                bytes[1] == 'I' &&
                bytes[2] == 'F') {
            return true;
        }

        // WEBP
        return bytes[0] == 'R' &&
                bytes[1] == 'I' &&
                bytes[2] == 'F' &&
                bytes[3] == 'F' &&
                bytes[8] == 'W' &&
                bytes[9] == 'E' &&
                bytes[10] == 'B' &&
                bytes[11] == 'P';
    }
}