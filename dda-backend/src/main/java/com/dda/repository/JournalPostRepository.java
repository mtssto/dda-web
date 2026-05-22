package com.dda.repository;

import com.dda.entity.JournalPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface JournalPostRepository extends JpaRepository<JournalPost, Long> {
    Optional<JournalPost> findBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    Page<JournalPost> findByStatus(JournalPost.Status status, Pageable pageable);
    long countByStatus(JournalPost.Status status);
}
