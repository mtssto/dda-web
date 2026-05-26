package com.dda.dto;

import com.dda.entity.Artwork;
import com.dda.entity.ArtworkImage;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ArtworkDTO {

    private Long id;
    private String slug;
    private String title;
    private String description;
    private String price;
    private String dimensions;
    private String technique;
    private String year;
    private Boolean sold;
    private Long viewCount;
    private Long likesCount;
    private Boolean likedByCurrentUser;
    private String category;
    private List<ImageDTO> images;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ArtworkDTO fromEntity(Artwork artwork, String staticBaseUrl) {
        return fromEntity(artwork, staticBaseUrl, false);
    }

    public static ArtworkDTO fromEntity(Artwork artwork, String staticBaseUrl, boolean likedByCurrentUser) {
        return ArtworkDTO.builder()
                .id(artwork.getId())
                .slug(artwork.getSlug())
                .title(artwork.getTitle())
                .description(artwork.getDescription())
                .price(artwork.getPrice())
                .dimensions(artwork.getDimensions())
                .technique(artwork.getTechnique())
                .year(artwork.getYear())
                .sold(artwork.getSold())
                .viewCount(artwork.getViewCount())
                .likesCount(artwork.getLikesCount())
                .likedByCurrentUser(likedByCurrentUser)
                .category(artwork.getCategory() != null ? artwork.getCategory().getName() : null)
                .images(artwork.getImages().stream()
                        .map(img -> ImageDTO.fromEntity(img, staticBaseUrl))
                        .toList())
                .createdAt(artwork.getCreatedAt())
                .updatedAt(artwork.getUpdatedAt())
                .build();
    }

    /** Convenience overload — keeps any existing call sites working without URL resolution. */
    public static ArtworkDTO fromEntity(Artwork artwork) {
        return fromEntity(artwork, "");
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ImageDTO {
        private Long id;
        private String filePath;
        private String fileName;
        private String contentType;
        private Long fileSize;
        private Boolean isPrimary;
        private Integer sortOrder;

        public static ImageDTO fromEntity(ArtworkImage image, String staticBaseUrl) {
            return ImageDTO.builder()
                    .id(image.getId())
                    .filePath(resolveUrl(image.getFilePath(), staticBaseUrl))
                    .fileName(image.getFileName())
                    .contentType(image.getContentType())
                    .fileSize(image.getFileSize())
                    .isPrimary(image.getIsPrimary())
                    .sortOrder(image.getSortOrder())
                    .build();
        }

        /** Convenience overload for call sites that don't need URL resolution. */
        public static ImageDTO fromEntity(ArtworkImage image) {
            return fromEntity(image, "");
        }

        /**
         * Turns a stored path into a fully-qualified URL.
         *
         * - Already absolute (https://...)  → returned as-is
         * - Starts with /uploads/           → returned as-is (frontend routes it to the backend)
         * - Anything else (/portfolio/...)  → prepend staticBaseUrl (GitHub Pages)
         */
        private static String resolveUrl(String filePath, String staticBaseUrl) {
            if (filePath == null || filePath.isBlank()) return filePath;
            if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
            if (filePath.startsWith("/uploads/")) return filePath;
            String base = staticBaseUrl != null ? staticBaseUrl.replaceAll("/+$", "") : "";
            return base + (filePath.startsWith("/") ? filePath : "/" + filePath);
        }
    }
}