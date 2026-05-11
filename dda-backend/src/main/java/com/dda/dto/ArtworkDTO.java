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
    private String category;
    private List<ImageDTO> images;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ArtworkDTO fromEntity(Artwork artwork) {
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
                .category(artwork.getCategory() != null ? artwork.getCategory().getName() : null)
                .images(artwork.getImages().stream().map(ImageDTO::fromEntity).toList())
                .createdAt(artwork.getCreatedAt())
                .updatedAt(artwork.getUpdatedAt())
                .build();
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

        public static ImageDTO fromEntity(ArtworkImage image) {
            return ImageDTO.builder()
                    .id(image.getId())
                    .filePath(image.getFilePath())
                    .fileName(image.getFileName())
                    .contentType(image.getContentType())
                    .fileSize(image.getFileSize())
                    .isPrimary(image.getIsPrimary())
                    .sortOrder(image.getSortOrder())
                    .build();
        }
    }
}
