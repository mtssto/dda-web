package com.dda.controller;

import com.dda.dto.JournalPostDTO;
import com.dda.dto.JournalPostRequest;
import com.dda.entity.JournalComment;
import com.dda.service.JournalService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/journal")
@RequiredArgsConstructor
public class JournalController {

    private final JournalService journalService;

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
    public JournalComment addComment(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails user) {
        String content = body.get("content");
        String username = user != null ? user.getUsername() : "Guest";
        return journalService.addComment(id, content, username);
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
