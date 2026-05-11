package com.dda.service;

import com.dda.dto.CategoryDTO;
import com.dda.entity.Category;
import com.dda.exception.ResourceNotFoundException;
import com.dda.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryDTO> findAll() {
        return categoryRepository.findAllWithArtworkCount().stream()
                .map(CategoryDTO::fromEntity)
                .toList();
    }

    @Transactional
    public CategoryDTO create(String name, String displayName) {
        if (categoryRepository.findByName(name).isPresent()) {
            throw new IllegalArgumentException("Category already exists: " + name);
        }
        Category category = Category.builder()
                .name(name)
                .displayName(displayName)
                .build();
        return CategoryDTO.fromEntity(categoryRepository.save(category));
    }

    @Transactional
    public CategoryDTO update(Long id, String name, String displayName) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        if (name != null) category.setName(name);
        if (displayName != null) category.setDisplayName(displayName);
        return CategoryDTO.fromEntity(categoryRepository.save(category));
    }
}
