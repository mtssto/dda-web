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
    private final MediaUrlResolver mediaUrlResolver;

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
        if (postRepository.findBySlug(request.getSlug()).isPresent()) {
            throw new IllegalArgumentException("El enlace de la entrada ya está en uso. Cambiá el título o el enlace.");
        }

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

    @Transactional
    public JournalPostDTO update(Long id, JournalPostRequest request) {
        JournalPost post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post", "id", id));

        String slug = request.getSlug() != null ? request.getSlug().trim() : post.getSlug();
        if (postRepository.existsBySlugAndIdNot(slug, id)) {
            throw new IllegalArgumentException("El slug ya está en uso");
        }

        if (request.getTitle() != null) {
            if (request.getTitle().get("es") != null) {
                post.setTitleEs(request.getTitle().get("es"));
            }
            if (request.getTitle().get("en") != null) {
                post.setTitleEn(request.getTitle().get("en"));
            }
        }
        if (request.getExcerpt() != null) {
            if (request.getExcerpt().get("es") != null) {
                post.setExcerptEs(request.getExcerpt().get("es"));
            }
            if (request.getExcerpt().get("en") != null) {
                post.setExcerptEn(request.getExcerpt().get("en"));
            }
        }
        if (request.getContent() != null) {
            if (request.getContent().get("es") != null) {
                post.setContentEs(request.getContent().get("es"));
            }
            if (request.getContent().get("en") != null) {
                post.setContentEn(request.getContent().get("en"));
            }
        }

        post.setSlug(slug);
        if (request.getCoverImage() != null) {
            post.setCoverImage(request.getCoverImage());
        }
        if (request.getTags() != null) {
            post.setTags(String.join(",", request.getTags()));
        }
        JournalPost.Status previousStatus = post.getStatus();
        if (request.getStatus() != null) {
            post.setStatus(JournalPost.Status.valueOf(request.getStatus()));
        }
        if (request.getScheduledAt() != null) {
            post.setScheduledAt(request.getScheduledAt());
        }
        if (request.getSendNewsletter() != null) {
            post.setSendNewsletterOnPublish(request.getSendNewsletter());
        }

        applyPublishRules(post);
        post = postRepository.save(post);

        if (previousStatus != JournalPost.Status.PUBLISHED
                && post.getStatus() == JournalPost.Status.PUBLISHED
                && Boolean.TRUE.equals(post.getSendNewsletterOnPublish())) {
            newsletterService.sendJournalCampaign(post);
        }

        return toDto(post);
    }

    @Transactional
    public void delete(Long id) {
        if (!postRepository.existsById(id)) {
            throw new ResourceNotFoundException("Post", "id", id);
        }
        postRepository.deleteById(id);
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
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("Debes iniciar sesión para comentar");
        }
        JournalPost post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found"));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        JournalComment comment = JournalComment.builder()
                .postId(post.getId())
                .userId(user.getId())
                .authorName(user.getUsername())
                .content(content.trim())
                .status(JournalComment.Status.APPROVED)
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
                .content(java.util.Map.of(
                        "es", mediaUrlResolver.resolveContentHtml(post.getContentEs() != null ? post.getContentEs() : ""),
                        "en", mediaUrlResolver.resolveContentHtml(post.getContentEn() != null ? post.getContentEn() : "")))
                .coverImage(mediaUrlResolver.resolve(post.getCoverImage()))
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
