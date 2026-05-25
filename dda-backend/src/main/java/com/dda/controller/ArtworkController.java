package com.dda.controller;

import com.dda.dto.ArtworkCommentMineDTO;
import com.dda.dto.ArtworkDTO;
import com.dda.dto.ArtworkRequest;
import com.dda.entity.ArtworkComment;
import com.dda.service.ArtworkCommentService;
import com.dda.service.ArtworkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/artworks")
@RequiredArgsConstructor
public class ArtworkController {

    private final ArtworkService artworkService;
    private final ArtworkCommentService artworkCommentService;

    @GetMapping
    public ResponseEntity<Page<ArtworkDTO>> findAll(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(artworkService.findAll(pageable));
    }

    @GetMapping("/me/comments")
    public ResponseEntity<List<ArtworkCommentMineDTO>> myComments(
            @AuthenticationPrincipal UserDetails user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(artworkCommentService.listByUsername(user.getUsername()));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ArtworkDTO> findBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(artworkService.findBySlug(slug));
    }

    @GetMapping("/{slug}/comments")
    public List<ArtworkComment> listComments(@PathVariable String slug) {
        return artworkCommentService.listApprovedBySlug(slug);
    }

    @PostMapping("/{slug}/comments")
    public ResponseEntity<ArtworkComment> addComment(
            @PathVariable String slug,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String content = body.get("content");
        if (content == null || content.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(artworkCommentService.addComment(slug, content, user.getUsername()));
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
