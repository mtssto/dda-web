package com.dda.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ArtworkRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200)
    private String title;

    private String description;

    @Size(max = 50)
    private String price;

    @Size(max = 50)
    private String dimensions;

    @Size(max = 100)
    private String technique;

    @Size(max = 20)
    private String year;

    private Boolean sold;

    private String category;
}
