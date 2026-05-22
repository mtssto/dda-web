package com.dda.repository;

import com.dda.entity.JournalComment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface JournalCommentRepository extends JpaRepository<JournalComment, Long> {
    List<JournalComment> findByPostIdAndStatusOrderByCreatedAtDesc(Long postId, JournalComment.Status status);
    List<JournalComment> findByStatusOrderByCreatedAtDesc(JournalComment.Status status);
}
