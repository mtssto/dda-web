package com.dda.repository;

import com.dda.entity.ArtworkComment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ArtworkCommentRepository extends JpaRepository<ArtworkComment, Long> {
    List<ArtworkComment> findByArtworkIdAndStatusOrderByCreatedAtDesc(Long artworkId, ArtworkComment.Status status);
    List<ArtworkComment> findByStatusOrderByCreatedAtDesc(ArtworkComment.Status status);
    List<ArtworkComment> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByStatus(ArtworkComment.Status status);
}
