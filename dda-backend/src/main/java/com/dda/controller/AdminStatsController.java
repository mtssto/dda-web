package com.dda.controller;

import com.dda.repository.ArtworkCommentRepository;
import com.dda.repository.NewsletterRepository;
import com.dda.repository.UserRepository;
import com.dda.service.ArtworkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/stats")
@RequiredArgsConstructor
public class AdminStatsController {

    private final ArtworkService artworkService;
    private final ArtworkCommentRepository commentRepository;
    private final NewsletterRepository newsletterRepository;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>(artworkService.getAdminStats());
        stats.put("totalUsers", userRepository.count());
        stats.put("newsletterSubscribers", newsletterRepository.countByActiveTrue());
        stats.put("pendingComments", commentRepository.countByStatus(
                com.dda.entity.ArtworkComment.Status.PENDING));
        return ResponseEntity.ok(stats);
    }
}
