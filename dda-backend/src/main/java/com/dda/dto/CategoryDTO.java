package com.dda.dto;

import com.dda.entity.Category;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CategoryDTO {
    private Long id;
    private String name;
    private String displayName;
    private long artworkCount;

    public static CategoryDTO fromEntity(Category category) {
        return CategoryDTO.builder()
                .id(category.getId())
                .name(category.getName())
                .displayName(category.getDisplayName())
                .artworkCount(category.getArtworks() != null ? category.getArtworks().size() : 0)
                .build();
    }
}
