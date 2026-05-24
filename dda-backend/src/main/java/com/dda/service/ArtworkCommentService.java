package com.dda.service;

import com.dda.entity.Artwork;
import com.dda.entity.ArtworkComment;
import com.dda.entity.User;
import com.dda.exception.ResourceNotFoundException;
import com.dda.repository.ArtworkCommentRepository;
import com.dda.repository.ArtworkRepository;
import com.dda.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ArtworkCommentService {

    private final ArtworkCommentRepository commentRepository;
    private final ArtworkRepository artworkRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public List<ArtworkComment> listApprovedBySlug(String slug) {
        Artwork artwork = artworkRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Artwork not found"));
        return commentRepository.findByArtworkIdAndStatusOrderByCreatedAtDesc(
                artwork.getId(), ArtworkComment.Status.APPROVED);
    }

    @Transactional
    public ArtworkComment addComment(String slug, String content, String username) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Debes iniciar sesión para comentar");
        }
        Artwork artwork = artworkRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Artwork not found"));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String authorLabel = user.getUsername();
        ArtworkComment comment = ArtworkComment.builder()
                .artworkId(artwork.getId())
                .userId(user.getId())
                .authorName(authorLabel)
                .content(content.trim())
                .status(ArtworkComment.Status.APPROVED)
                .build();

        ArtworkComment saved = commentRepository.save(comment);
        emailService.sendArtworkCommentAlert(
                artwork.getTitle(),
                artwork.getSlug(),
                authorLabel,
                saved.getContent());
        return saved;
    }

    public List<ArtworkComment> listPending() {
        return commentRepository.findByStatusOrderByCreatedAtDesc(ArtworkComment.Status.PENDING);
    }

    @Transactional
    public ArtworkComment approve(Long id) {
        ArtworkComment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        comment.setStatus(ArtworkComment.Status.APPROVED);
        return commentRepository.save(comment);
    }
}
