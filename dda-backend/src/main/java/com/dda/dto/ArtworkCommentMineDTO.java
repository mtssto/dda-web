package com.dda.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ArtworkCommentMineDTO {

    private Long id;
    private String content;
    private String authorName;
    private LocalDateTime createdAt;
    private String status;
    private String artworkSlug;
    private String artworkTitle;
    private String artworkImageUrl;
}
