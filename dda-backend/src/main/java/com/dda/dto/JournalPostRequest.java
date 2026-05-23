package com.dda.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JournalPostRequest {
    private String slug;
    private Map<String, String> title;
    private Map<String, String> excerpt;
    private Map<String, String> content;
    private String coverImage;
    private List<String> tags;
    private String status;
    private LocalDateTime scheduledAt;
    private Boolean sendNewsletter;
}
