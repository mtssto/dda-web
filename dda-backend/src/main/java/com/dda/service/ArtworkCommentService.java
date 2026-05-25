package com.dda.service;

import com.dda.dto.ArtworkCommentMineDTO;
import com.dda.dto.ArtworkDTO;
import com.dda.entity.Artwork;
import com.dda.entity.ArtworkComment;
import com.dda.entity.User;
import com.dda.exception.ResourceNotFoundException;
import com.dda.repository.ArtworkCommentRepository;
import com.dda.repository.ArtworkRepository;
import com.dda.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${app.static.base-url:https://diegodeaduriz.art}")
    private String staticBaseUrl;

    @Transactional(readOnly = true)
    public List<ArtworkCommentMineDTO> listByUsername(String username) {
        if (username == null || username.isBlank()) {
            return List.of();
        }
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return commentRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::toMineDto)
                .toList();
    }

    private ArtworkCommentMineDTO toMineDto(ArtworkComment comment) {
        Artwork artwork = artworkRepository.findById(comment.getArtworkId()).orElse(null);
        String slug = artwork != null ? artwork.getSlug() : "";
        String title = artwork != null ? artwork.getTitle() : "Obra";
        String imageUrl = "";

        if (artwork != null) {
            ArtworkDTO dto = ArtworkDTO.fromEntity(artwork, staticBaseUrl);
            if (dto.getImages() != null && !dto.getImages().isEmpty()) {
                imageUrl = dto.getImages().stream()
                        .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                        .map(ArtworkDTO.ImageDTO::getFilePath)
                        .findFirst()
                        .orElse(dto.getImages().get(0).getFilePath());
            }
        }

        return ArtworkCommentMineDTO.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .authorName(comment.getAuthorName())
                .createdAt(comment.getCreatedAt())
                .status(comment.getStatus() != null ? comment.getStatus().name() : null)
                .artworkSlug(slug)
                .artworkTitle(title)
                .artworkImageUrl(imageUrl)
                .build();
    }

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
