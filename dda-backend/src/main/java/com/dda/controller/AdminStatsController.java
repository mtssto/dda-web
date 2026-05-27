package com.dda.controller;

import com.dda.entity.User;
import com.dda.repository.ArtworkCommentRepository;
import com.dda.repository.NewsletterRepository;
import com.dda.repository.UserRepository;
import com.dda.service.ArtworkService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminStatsController {

    private final ArtworkService artworkService;
    private final ArtworkCommentRepository commentRepository;
    private final NewsletterRepository newsletterRepository;
    private final UserRepository userRepository;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>(artworkService.getAdminStats());
        stats.put("totalUsers", userRepository.count());
        stats.put("newsletterSubscribers", newsletterRepository.countByActiveTrue());
        stats.put("pendingComments", commentRepository.countByStatus(
                com.dda.entity.ArtworkComment.Status.PENDING));
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getUsers() {
        List<User> users = userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        List<Map<String, Object>> result = users.stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("username", u.getUsername());
            m.put("email", u.getEmail());
            m.put("role", u.getRole().name());
            m.put("emailVerified", u.getEmailVerified());
            m.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : null);
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}
