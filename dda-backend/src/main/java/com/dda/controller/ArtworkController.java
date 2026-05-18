package com.dda.controller;

import com.dda.dto.ArtworkDTO;
import com.dda.dto.ArtworkRequest;
import com.dda.service.ArtworkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/artworks")
@RequiredArgsConstructor
public class ArtworkController {

    private final ArtworkService artworkService;

    @GetMapping
    public ResponseEntity<Page<ArtworkDTO>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(artworkService.findAll(pageable));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ArtworkDTO> findBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(artworkService.findBySlug(slug));
    }

    @GetMapping("/category/{categoryName}")
    public ResponseEntity<Page<ArtworkDTO>> findByCategory(
            @PathVariable String categoryName,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(artworkService.findByCategory(categoryName, pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ArtworkDTO>> search(
            @RequestParam String q,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(artworkService.search(q, pageable));
    }

    @PostMapping
    public ResponseEntity<ArtworkDTO> create(@Valid @RequestBody ArtworkRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(artworkService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ArtworkDTO> update(@PathVariable Long id, @Valid @RequestBody ArtworkRequest request) {
        return ResponseEntity.ok(artworkService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        artworkService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/sold")
    public ResponseEntity<ArtworkDTO> toggleSold(@PathVariable Long id) {
        return ResponseEntity.ok(artworkService.toggleSold(id));
    }

}
