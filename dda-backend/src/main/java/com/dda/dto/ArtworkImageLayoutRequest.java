package com.dda.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ArtworkImageLayoutRequest {

    @NotEmpty
    @Valid
    private List<Item> images;

    @Getter
    @Setter
    public static class Item {
        @NotNull
        private Long id;

        @NotNull
        private Integer sortOrder;

        @NotNull
        private Boolean isPrimary;
    }
}
