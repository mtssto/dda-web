package com.dda.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/uploads")
public class FileServeController {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) throws IOException {
        Path filePath = Paths.get(uploadDir).resolve(filename).normalize();

        // Prevent path traversal attacks
        if (!filePath.startsWith(Paths.get(uploadDir).toAbsolutePath().normalize())) {
            return ResponseEntity.badRequest().build();
        }

        if (!Files.exists(filePath) || !Files.isReadable(filePath)) {
            return ResponseEntity.notFound().build();
        }

        String contentType = Files.probeContentType(filePath);
        if (contentType == null) {
            contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }

        Resource body = new FileSystemResource(filePath);

        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable())
                .contentType(MediaType.parseMediaType(contentType))
                .contentLength(Files.size(filePath))
                .body(body);
    }
}