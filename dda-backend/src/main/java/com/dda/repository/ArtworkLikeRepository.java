package com.dda.repository;

import com.dda.entity.ArtworkLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ArtworkLikeRepository extends JpaRepository<ArtworkLike, ArtworkLike.Key> {

    boolean existsByArtworkIdAndUserId(Long artworkId, Long userId);

    void deleteByArtworkIdAndUserId(Long artworkId, Long userId);

    List<ArtworkLike> findByUserId(Long userId);
}
