package com.dda.controller;

import com.dda.dto.CategoryDTO;
import com.dda.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<CategoryDTO>> findAll() {
        return ResponseEntity.ok(categoryService.findAll());
    }

    @PostMapping
    public ResponseEntity<CategoryDTO> create(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String displayName = body.get("displayName");
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Category name is required");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.create(name, displayName));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryDTO> update(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(categoryService.update(id, body.get("name"), body.get("displayName")));
    }
}
