package com.dda.controller;

import com.dda.dto.JournalPostDTO;
import com.dda.dto.JournalPostRequest;
import com.dda.dto.MediaUploadResponse;
import com.dda.entity.JournalComment;
import com.dda.service.ImageStorageService;
import com.dda.service.JournalService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/journal")
@RequiredArgsConstructor
public class JournalController {

    private final JournalService journalService;
    private final ImageStorageService imageStorageService;

    @GetMapping("/posts")
    public Page<JournalPostDTO> listPublished(
            @RequestParam(defaultValue = "PUBLISHED") String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return journalService.listPublished(PageRequest.of(page, size));
    }

    @GetMapping("/posts/slug/{slug}")
    public JournalPostDTO getBySlug(@PathVariable String slug) {
        return journalService.getBySlug(slug);
    }

    @GetMapping("/posts/{id}/comments")
    public List<JournalComment> listComments(@PathVariable Long id) {
        return journalService.listApprovedComments(id);
    }

    @PostMapping("/posts/{id}/comments")
    public ResponseEntity<JournalComment> addComment(
            @PathVariable Long id,
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
                .body(journalService.addComment(id, content, user.getUsername()));
    }

    @PostMapping("/admin/upload")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MediaUploadResponse> uploadImage(@RequestParam("file") MultipartFile file)
            throws IOException {
        String url = imageStorageService.uploadJournalImage(file);
        return ResponseEntity.status(HttpStatus.CREATED).body(new MediaUploadResponse(url));
    }

    @GetMapping("/admin/posts")
    @PreAuthorize("hasRole('ADMIN')")
    public Page<JournalPostDTO> adminList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return journalService.listAdmin(PageRequest.of(page, size));
    }

    @PostMapping("/admin/posts")
    @PreAuthorize("hasRole('ADMIN')")
    public JournalPostDTO create(
            @RequestBody JournalPostRequest request,
            @AuthenticationPrincipal UserDetails user) {
        Long authorId = null; // resolved in service if needed
        return journalService.create(request, authorId);
    }

    @PutMapping("/admin/posts/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public JournalPostDTO update(
            @PathVariable Long id,
            @RequestBody JournalPostRequest request) {
        return journalService.update(id, request);
    }

    @DeleteMapping("/admin/posts/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        journalService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admin/comments")
    @PreAuthorize("hasRole('ADMIN')")
    public List<JournalComment> pendingComments(@RequestParam(defaultValue = "PENDING") String status) {
        return journalService.listPendingComments();
    }

    @PatchMapping("/admin/comments/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public JournalComment approve(@PathVariable Long id) {
        return journalService.approveComment(id);
    }
}
