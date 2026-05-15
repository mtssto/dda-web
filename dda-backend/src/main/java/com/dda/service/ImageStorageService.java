package com.dda.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.dda.dto.ArtworkDTO;
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
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageStorageService {

    private final Cloudinary              cloudinary;
    private final ArtworkRepository       artworkRepository;
    private final ArtworkImageRepository  artworkImageRepository;

    @Value("${app.upload.allowed-types}")
    private String allowedTypes;

    // -------------------------------------------------------------------------
    // Upload
    // -------------------------------------------------------------------------

    @Caching(evict = {
            @CacheEvict(value = "artworks", allEntries = true),
            @CacheEvict(value = "artworkBySlug", allEntries = true)
    })
    @Transactional
    public ArtworkDTO.ImageDTO uploadImage(Long artworkId,
                                           MultipartFile file,
                                           boolean isPrimary) throws IOException {

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

        // Demote any existing primary image for this artwork
        if (isPrimary) {
            artwork.getImages().forEach(img -> img.setIsPrimary(false));
        }

        int nextOrder = artwork.getImages().size();

        ArtworkImage image = ArtworkImage.builder()
                .artwork(artwork)
                .filePath(secureUrl)           // store the full https://res.cloudinary.com/... URL
                .fileName(file.getOriginalFilename())
                .contentType(contentType)
                .fileSize(file.getSize())
                .isPrimary(isPrimary)
                .sortOrder(nextOrder)
                .cloudinaryPublicId(publicId)  // needed for deletion later
                .build();

        return ArtworkDTO.ImageDTO.fromEntity(artworkImageRepository.save(image));
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
