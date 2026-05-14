package com.dda.controller;

import com.dda.service.ImageMigrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/migration")
@RequiredArgsConstructor
public class MigrationController {

    private final ImageMigrationService migrationService;

    /**
     * POST /api/admin/migration/cloudinary
     *
     * Migrates all artwork images that are not yet on Cloudinary.
     * Safe to call multiple times — already-migrated images are skipped.
     * Requires a valid JWT (admin) in the Authorization header.
     */
    @PostMapping("/cloudinary")
    public ResponseEntity<ImageMigrationService.MigrationResult> migrateToCloudinary() {
        return ResponseEntity.ok(migrationService.migrateAll());
    }
}
