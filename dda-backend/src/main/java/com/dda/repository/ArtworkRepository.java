package com.dda.repository;

import com.dda.entity.Artwork;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ArtworkRepository extends JpaRepository<Artwork, Long> {

    Optional<Artwork> findBySlug(String slug);

    Page<Artwork> findByCategoryName(String categoryName, Pageable pageable);

    Page<Artwork> findBySold(boolean sold, Pageable pageable);

    @Query("SELECT a FROM Artwork a WHERE " +
           "LOWER(a.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(a.technique) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(a.dimensions) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Artwork> search(@Param("query") String query, Pageable pageable);
}
