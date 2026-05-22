package com.dda.service;

import com.dda.dto.JournalPostDTO;
import com.dda.dto.JournalPostRequest;
import com.dda.entity.JournalComment;
import com.dda.entity.JournalPost;
import com.dda.entity.User;
import com.dda.exception.ResourceNotFoundException;
import com.dda.repository.JournalCommentRepository;
import com.dda.repository.JournalPostRepository;
import com.dda.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JournalService {

    private final JournalPostRepository postRepository;
    private final JournalCommentRepository commentRepository;
    private final UserRepository userRepository;
    private final NewsletterService newsletterService;

    public Page<JournalPostDTO> listPublished(Pageable pageable) {
        return postRepository.findByStatus(JournalPost.Status.PUBLISHED, pageable).map(this::toDto);
    }

    public JournalPostDTO getBySlug(String slug) {
        JournalPost post = postRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        if (post.getStatus() != JournalPost.Status.PUBLISHED) {
            throw new ResourceNotFoundException("Post not published");
        }
        return toDto(post);
    }

    public Page<JournalPostDTO> listAdmin(Pageable pageable) {
        return postRepository.findAll(pageable).map(this::toDto);
    }

    @Transactional
    public JournalPostDTO create(JournalPostRequest request, Long authorId) {
        JournalPost post = JournalPost.builder()
                .slug(request.getSlug())
                .titleEs(request.getTitle().get("es"))
                .titleEn(request.getTitle().get("en"))
                .excerptEs(request.getExcerpt() != null ? request.getExcerpt().get("es") : null)
                .excerptEn(request.getExcerpt() != null ? request.getExcerpt().get("en") : null)
                .contentEs(request.getContent() != null ? request.getContent().get("es") : null)
                .contentEn(request.getContent() != null ? request.getContent().get("en") : null)
                .coverImage(request.getCoverImage())
                .tags(request.getTags() != null ? String.join(",", request.getTags()) : null)
                .status(JournalPost.Status.valueOf(request.getStatus()))
                .scheduledAt(request.getScheduledAt())
                .authorId(authorId)
                .sendNewsletterOnPublish(Boolean.TRUE.equals(request.getSendNewsletter()))
                .build();

        applyPublishRules(post);
        post = postRepository.save(post);

        if (post.getStatus() == JournalPost.Status.PUBLISHED && Boolean.TRUE.equals(post.getSendNewsletterOnPublish())) {
            newsletterService.sendJournalCampaign(post);
        }

        return toDto(post);
    }

    private void applyPublishRules(JournalPost post) {
        if (post.getStatus() == JournalPost.Status.PUBLISHED) {
            post.setPublishedAt(LocalDateTime.now());
        } else if (post.getStatus() == JournalPost.Status.SCHEDULED && post.getScheduledAt() != null) {
            post.setPublishedAt(null);
        }
    }

    @Transactional
    public JournalComment addComment(Long postId, String content, String username) {
        JournalPost post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        User user = userRepository.findByUsername(username).orElse(null);

        JournalComment comment = JournalComment.builder()
                .postId(post.getId())
                .userId(user != null ? user.getId() : null)
                .authorName(username)
                .content(content)
                .status(JournalComment.Status.PENDING)
                .build();

        return commentRepository.save(comment);
    }

    public List<JournalComment> listApprovedComments(Long postId) {
        return commentRepository.findByPostIdAndStatusOrderByCreatedAtDesc(postId, JournalComment.Status.APPROVED);
    }

    public List<JournalComment> listPendingComments() {
        return commentRepository.findByStatusOrderByCreatedAtDesc(JournalComment.Status.PENDING);
    }

    @Transactional
    public JournalComment approveComment(Long id) {
        JournalComment comment = commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        comment.setStatus(JournalComment.Status.APPROVED);
        return commentRepository.save(comment);
    }

    private JournalPostDTO toDto(JournalPost post) {
        List<String> tags = post.getTags() == null || post.getTags().isBlank()
                ? List.of()
                : Arrays.stream(post.getTags().split(",")).map(String::trim).collect(Collectors.toList());

        return JournalPostDTO.builder()
                .id(post.getId())
                .slug(post.getSlug())
                .title(java.util.Map.of("es", post.getTitleEs(), "en", post.getTitleEn() != null ? post.getTitleEn() : post.getTitleEs()))
                .excerpt(java.util.Map.of("es", post.getExcerptEs() != null ? post.getExcerptEs() : "", "en", post.getExcerptEn() != null ? post.getExcerptEn() : ""))
                .content(java.util.Map.of("es", post.getContentEs() != null ? post.getContentEs() : "", "en", post.getContentEn() != null ? post.getContentEn() : ""))
                .coverImage(post.getCoverImage())
                .tags(tags)
                .status(post.getStatus().name())
                .publishedAt(post.getPublishedAt())
                .scheduledAt(post.getScheduledAt())
                .likes(post.getLikesCount())
                .readMinutes(estimateReadMinutes(post.getContentEs()))
                .build();
    }

    private int estimateReadMinutes(String content) {
        if (content == null) return 3;
        int words = content.split("\\s+").length;
        return Math.max(2, words / 180);
    }
}
