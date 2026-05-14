package com.dda.repository;

import com.dda.entity.ArtworkImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ArtworkImageRepository extends JpaRepository<ArtworkImage, Long> {

    List<ArtworkImage> findByArtworkIdOrderBySortOrder(Long artworkId);

    /** Returns all images that haven't been migrated to Cloudinary yet. */
    List<ArtworkImage> findByCloudinaryPublicIdIsNull();

    /** Demotes all primary images for a given artwork before setting a new one. */
    @Modifying
    @Query("UPDATE ArtworkImage i SET i.isPrimary = false WHERE i.artwork.id = :artworkId")
    void clearPrimaryForArtwork(@Param("artworkId") Long artworkId);
}
