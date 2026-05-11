package com.dda.service;

import com.dda.dto.ArtworkDTO;
import com.dda.entity.Artwork;
import com.dda.entity.ArtworkImage;
import com.dda.exception.ResourceNotFoundException;
import com.dda.repository.ArtworkImageRepository;
import com.dda.repository.ArtworkRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ImageStorageService {

    private final ArtworkRepository artworkRepository;
    private final ArtworkImageRepository artworkImageRepository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Value("${app.upload.allowed-types}")
    private String allowedTypes;

    private Path uploadPath;

    @PostConstruct
    public void init() {
        uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
    }

    @Transactional
    public ArtworkDTO.ImageDTO uploadImage(Long artworkId, MultipartFile file, boolean isPrimary) throws IOException {
        Artwork artwork = artworkRepository.findById(artworkId)
                .orElseThrow(() -> new ResourceNotFoundException("Artwork", "id", artworkId));

        String contentType = file.getContentType();
        if (contentType == null || !List.of(allowedTypes.split(",")).contains(contentType)) {
            throw new IllegalArgumentException("File type not allowed: " + contentType);
        }

        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".")
                ? originalFilename.substring(originalFilename.lastIndexOf("."))
                : "";
        String storedFilename = UUID.randomUUID() + extension;

        Path targetPath = uploadPath.resolve(storedFilename);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        if (isPrimary) {
            artwork.getImages().forEach(img -> img.setIsPrimary(false));
        }

        int nextOrder = artwork.getImages().size();
        ArtworkImage image = ArtworkImage.builder()
                .artwork(artwork)
                .filePath("/uploads/" + storedFilename)
                .fileName(originalFilename)
                .contentType(contentType)
                .fileSize(file.getSize())
                .isPrimary(isPrimary)
                .sortOrder(nextOrder)
                .build();

        return ArtworkDTO.ImageDTO.fromEntity(artworkImageRepository.save(image));
    }

    @Transactional
    public void deleteImage(Long imageId) {
        ArtworkImage image = artworkImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Image", "id", imageId));

        String filename = image.getFilePath().replace("/uploads/", "");
        Path filePath = uploadPath.resolve(filename);
        try {
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // log but don't fail
        }

        artworkImageRepository.delete(image);
    }
}
