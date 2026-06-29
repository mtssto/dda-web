package com.dda.controller;

import com.dda.dto.ArtworkDTO;
import com.dda.dto.ArtworkImageLayoutRequest;
import com.dda.service.ImageStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ImageController {

    private final ImageStorageService imageStorageService;

    @PostMapping("/artworks/{artworkId}/images")
    public ResponseEntity<ArtworkDTO.ImageDTO> uploadImage(
            @PathVariable Long artworkId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "primary", defaultValue = "false") boolean primary,
            @RequestParam(value = "sortOrder", required = false) Integer sortOrder) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(imageStorageService.uploadImage(artworkId, file, primary, sortOrder));
    }

    @PutMapping("/artworks/{artworkId}/images/layout")
    public ResponseEntity<Void> updateImageLayout(
            @PathVariable Long artworkId,
            @Valid @RequestBody ArtworkImageLayoutRequest request) {
        imageStorageService.updateImageLayout(artworkId, request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<Void> deleteImage(@PathVariable Long imageId) {
        imageStorageService.deleteImage(imageId);
        return ResponseEntity.noContent().build();
    }
}
