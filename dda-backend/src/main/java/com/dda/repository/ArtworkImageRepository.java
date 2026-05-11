package com.dda.repository;

import com.dda.entity.ArtworkImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ArtworkImageRepository extends JpaRepository<ArtworkImage, Long> {

    List<ArtworkImage> findByArtworkIdOrderBySortOrder(Long artworkId);
}
