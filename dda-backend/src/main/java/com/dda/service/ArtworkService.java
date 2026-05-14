package com.dda.service;

import com.dda.dto.ArtworkDTO;
import com.dda.dto.ArtworkRequest;
import com.dda.entity.Artwork;
import com.dda.entity.Category;
import com.dda.exception.ResourceNotFoundException;
import com.dda.repository.ArtworkRepository;
import com.dda.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ArtworkService {

    private final ArtworkRepository artworkRepository;
    private final CategoryRepository categoryRepository;

    @Value("${app.static.base-url:}")
    private String staticBaseUrl;

    @Cacheable(value = "artworks", key = "'page:' + #pageable.pageNumber + ':' + #pageable.pageSize + ':' + #pageable.sort")
    @Transactional(readOnly = true)
    public Page<ArtworkDTO> findAll(Pageable pageable) {
        return artworkRepository.findAll(pageable).map(a -> ArtworkDTO.fromEntity(a, staticBaseUrl));
    }

    @Cacheable(value = "artworkBySlug", key = "#slug")
    @Transactional(readOnly = true)
    public ArtworkDTO findBySlug(String slug) {
        Artwork artwork = artworkRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Artwork", "slug", slug));
        return ArtworkDTO.fromEntity(artwork, staticBaseUrl);
    }

    @Cacheable(value = "artworks", key = "'category:' + #categoryName + ':' + #pageable.pageNumber + ':' + #pageable.pageSize")
    @Transactional(readOnly = true)
    public Page<ArtworkDTO> findByCategory(String categoryName, Pageable pageable) {
        return artworkRepository.findByCategoryName(categoryName, pageable).map(a -> ArtworkDTO.fromEntity(a, staticBaseUrl));
    }

    // Search results are not cached — queries are too varied and change frequently
    @Transactional(readOnly = true)
    public Page<ArtworkDTO> search(String query, Pageable pageable) {
        return artworkRepository.search(query, pageable).map(a -> ArtworkDTO.fromEntity(a, staticBaseUrl));
    }

    @Caching(evict = {
            @CacheEvict(value = "artworks", allEntries = true),
            @CacheEvict(value = "artworkBySlug", allEntries = true)
    })
    @Transactional
    public ArtworkDTO create(ArtworkRequest request) {
        String slug = toSlug(request.getTitle());
        int suffix = 1;
        String baseSlug = slug;
        while (artworkRepository.findBySlug(slug).isPresent()) {
            slug = baseSlug + "-" + suffix++;
        }

        Category category = null;
        if (request.getCategory() != null) {
            category = categoryRepository.findByName(request.getCategory())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "name", request.getCategory()));
        }

        Artwork artwork = Artwork.builder()
                .slug(slug)
                .title(request.getTitle())
                .description(request.getDescription())
                .price(request.getPrice())
                .dimensions(request.getDimensions())
                .technique(request.getTechnique())
                .year(request.getYear())
                .sold(request.getSold() != null ? request.getSold() : false)
                .category(category)
                .build();

        return ArtworkDTO.fromEntity(artworkRepository.save(artwork), staticBaseUrl);
    }

    @Caching(evict = {
            @CacheEvict(value = "artworks", allEntries = true),
            @CacheEvict(value = "artworkBySlug", allEntries = true)
    })
    @Transactional
    public ArtworkDTO update(Long id, ArtworkRequest request) {
        Artwork artwork = artworkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Artwork", "id", id));

        artwork.setTitle(request.getTitle());
        artwork.setDescription(request.getDescription());
        artwork.setPrice(request.getPrice());
        artwork.setDimensions(request.getDimensions());
        artwork.setTechnique(request.getTechnique());
        artwork.setYear(request.getYear());

        if (request.getSold() != null) {
            artwork.setSold(request.getSold());
        }

        if (request.getCategory() != null) {
            Category category = categoryRepository.findByName(request.getCategory())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "name", request.getCategory()));
            artwork.setCategory(category);
        }

        return ArtworkDTO.fromEntity(artworkRepository.save(artwork), staticBaseUrl);
    }

    @Caching(evict = {
            @CacheEvict(value = "artworks", allEntries = true),
            @CacheEvict(value = "artworkBySlug", allEntries = true)
    })
    @Transactional
    public void delete(Long id) {
        if (!artworkRepository.existsById(id)) {
            throw new ResourceNotFoundException("Artwork", "id", id);
        }
        artworkRepository.deleteById(id);
    }

    @Caching(evict = {
            @CacheEvict(value = "artworks", allEntries = true),
            @CacheEvict(value = "artworkBySlug", allEntries = true)
    })
    @Transactional
    public ArtworkDTO toggleSold(Long id) {
        Artwork artwork = artworkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Artwork", "id", id));
        artwork.setSold(!artwork.getSold());
        return ArtworkDTO.fromEntity(artworkRepository.save(artwork), staticBaseUrl);
    }

    private String toSlug(String title) {
        String normalized = Normalizer.normalize(title, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("[\\p{InCombiningDiacriticalMarks}]");
        String slug = pattern.matcher(normalized).replaceAll("");
        return slug.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("[\\s]+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}