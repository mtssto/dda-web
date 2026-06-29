package com.dda.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.dda.dto.ArtworkDTO;
import com.dda.dto.ArtworkImageLayoutRequest;
import com.dda.entity.Artwork;
import com.dda.entity.ArtworkImage;
import com.dda.exception.ResourceNotFoundException;
import com.dda.repository.ArtworkImageRepository;
import com.dda.repository.ArtworkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageStorageService {

    private final Cloudinary              cloudinary;
    private final ArtworkRepository       artworkRepository;
    private final ArtworkImageRepository  artworkImageRepository;

    @Value("${app.upload.allowed-types}")
    private String allowedTypes;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    // -------------------------------------------------------------------------
    // Upload
    // -------------------------------------------------------------------------

    public String uploadJournalImage(MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null || !List.of(allowedTypes.split(",")).contains(contentType)) {
            throw new IllegalArgumentException("File type not allowed: " + contentType);
        }

        String extension = switch (contentType) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> "";
        };

        if (cloudName == null || cloudName.isBlank()) {
            Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            String filename = "journal_" + UUID.randomUUID() + extension;
            Path target = dir.resolve(filename);
            Files.write(target, file.getBytes());
            log.info("Saved journal image locally — {}", target);
            return "/uploads/" + filename;
        }

        Map<?, ?> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", "dda/journal",
                        "resource_type", "image",
                        "overwrite", false
                )
        );
        String secureUrl = (String) result.get("secure_url");
        log.info("Uploaded journal image to Cloudinary — {}", secureUrl);
        return secureUrl;
    }

    @Caching(evict = {
            @CacheEvict(value = "artworks", allEntries = true),
            @CacheEvict(value = "artworkBySlug", allEntries = true)
    })
    @Transactional
    public ArtworkDTO.ImageDTO uploadImage(Long artworkId,
                                           MultipartFile file,
                                           boolean isPrimary,
                                           Integer sortOrder) throws IOException {

        Artwork artwork = artworkRepository.findById(artworkId)
                .orElseThrow(() -> new ResourceNotFoundException("Artwork", "id", artworkId));

        // Validate content type
        String contentType = file.getContentType();
        if (contentType == null || !List.of(allowedTypes.split(",")).contains(contentType)) {
            throw new IllegalArgumentException("File type not allowed: " + contentType);
        }

        // Upload to Cloudinary — files are grouped under dda/artworks/<artworkId>/
        Map<?, ?> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder",        "dda/artworks/" + artworkId,
                        "resource_type", "image",
                        "overwrite",     false
                )
        );

        String publicId  = (String) result.get("public_id");   // e.g. dda/artworks/5/abc123
        String secureUrl = (String) result.get("secure_url");  // e.g. https://res.cloudinary.com/...

        log.info("Uploaded to Cloudinary — artworkId={} publicId={}", artworkId, publicId);

        if (isPrimary) {
            artworkImageRepository.clearPrimaryForArtwork(artworkId);
        }

        int order = sortOrder != null ? sortOrder : artwork.getImages().size();

        ArtworkImage image = ArtworkImage.builder()
                .artwork(artwork)
                .filePath(secureUrl)
                .fileName(file.getOriginalFilename())
                .contentType(contentType)
                .fileSize(file.getSize())
                .isPrimary(isPrimary)
                .sortOrder(order)
                .cloudinaryPublicId(publicId)
                .build();

        return ArtworkDTO.ImageDTO.fromEntity(artworkImageRepository.save(image));
    }

    @Caching(evict = {
            @CacheEvict(value = "artworks", allEntries = true),
            @CacheEvict(value = "artworkBySlug", allEntries = true)
    })
    @Transactional
    public void updateImageLayout(Long artworkId, ArtworkImageLayoutRequest request) {
        artworkRepository.findById(artworkId)
                .orElseThrow(() -> new ResourceNotFoundException("Artwork", "id", artworkId));

        long primaryCount = request.getImages().stream()
                .filter(item -> Boolean.TRUE.equals(item.getIsPrimary()))
                .count();
        if (primaryCount > 1) {
            throw new IllegalArgumentException("Only one image can be primary");
        }

        if (primaryCount == 1) {
            artworkImageRepository.clearPrimaryForArtwork(artworkId);
        }

        for (ArtworkImageLayoutRequest.Item item : request.getImages()) {
            ArtworkImage image = artworkImageRepository.findById(item.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Image", "id", item.getId()));
            if (!image.getArtwork().getId().equals(artworkId)) {
                throw new IllegalArgumentException("Image does not belong to artwork");
            }
            image.setSortOrder(item.getSortOrder());
            image.setIsPrimary(item.getIsPrimary());
        }
    }

    // -------------------------------------------------------------------------
    // Delete
    // -------------------------------------------------------------------------

    @Caching(evict = {
            @CacheEvict(value = "artworks", allEntries = true),
            @CacheEvict(value = "artworkBySlug", allEntries = true)
    })
    @Transactional
    public void deleteImage(Long imageId) {
        ArtworkImage image = artworkImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Image", "id", imageId));

        // Remove from Cloudinary if we have a public_id
        if (image.getCloudinaryPublicId() != null) {
            try {
                cloudinary.uploader().destroy(
                        image.getCloudinaryPublicId(),
                        ObjectUtils.asMap("resource_type", "image")
                );
                log.info("Deleted from Cloudinary — publicId={}", image.getCloudinaryPublicId());
            } catch (IOException e) {
                // Log but don't fail — still remove the DB record
                log.warn("Could not delete from Cloudinary publicId={}: {}",
                        image.getCloudinaryPublicId(), e.getMessage());
            }
        }

        artworkImageRepository.delete(image);
    }
}
