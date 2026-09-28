package com.dda.service;

import com.dda.dto.RegisterRequest;
import com.dda.entity.AuthProvider;
import com.dda.entity.User;
import com.dda.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.security.MessageDigest;

@Service @RequiredArgsConstructor
public class AdminBootstrapService {
    private final UserRepository users;
    private final JdbcTemplate jdbc;
    private final PasswordEncoder encoder;
    @Value("${app.admin.bootstrap-secret:}") private String configuredSecret;

    @Transactional
    public void createFirstAdmin(RegisterRequest request, String suppliedSecret) {
        if (configuredSecret == null || configuredSecret.isBlank() || suppliedSecret == null
                || !MessageDigest.isEqual(configuredSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                suppliedSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8))) {
            throw new IllegalArgumentException("Código de bootstrap inválido.");
        }
        if (users.existsByRole(User.Role.ADMIN)) throw new IllegalStateException("Ya existe un administrador.");
        int claimed = jdbc.update("UPDATE auth_admin_bootstrap_state SET consumed = TRUE WHERE id = 1 AND consumed = FALSE");
        if (claimed != 1) throw new IllegalStateException("El código de bootstrap ya fue utilizado.");
        if (users.existsByUsername(request.getUsername()) || users.existsByEmail(request.getEmail()))
            throw new IllegalArgumentException("El usuario o email ya está registrado.");
        users.save(User.builder().username(request.getUsername()).email(request.getEmail().trim().toLowerCase())
                .password(encoder.encode(request.getPassword())).authProvider(AuthProvider.LOCAL)
                .role(User.Role.ADMIN).emailVerified(true).build());
    }
}
