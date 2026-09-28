package com.dda.service;

import com.dda.dto.PasswordResetConfirmRequest;
import com.dda.dto.RegisterRequest;
import com.dda.entity.AuthProvider;
import com.dda.entity.PasswordResetToken;
import com.dda.entity.User;
import com.dda.repository.PasswordResetTokenRepository;
import com.dda.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Service @RequiredArgsConstructor
public class CustomerAccountService {
    private final UserRepository users;
    private final PasswordResetTokenRepository resetTokens;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    @Value("${app.static.base-url:https://diegodeaduriz.com}") private String staticBaseUrl;
    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional
    public void requestPasswordReset(String rawEmail) {
        String email = rawEmail.trim().toLowerCase();
        var candidate = users.findByEmail(email);
        if (candidate.isEmpty() || candidate.get().getAuthProvider() != AuthProvider.LOCAL) return;
        User user = candidate.get();
        resetTokens.deleteByUserIdAndUsedAtIsNull(user.getId());
        byte[] bytes = new byte[32]; RANDOM.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        resetTokens.save(PasswordResetToken.builder().user(user).tokenHash(hash(token))
                .expiresAt(LocalDateTime.now().plusMinutes(30)).build());
        String base = staticBaseUrl.endsWith("/") ? staticBaseUrl.substring(0, staticBaseUrl.length() - 1) : staticBaseUrl;
        emailService.sendPasswordResetEmail(user.getEmail(), user.getUsername(),
                base + "/shop/user-login.html?reset_token=" + token);
    }

    @Transactional
    public void confirmPasswordReset(PasswordResetConfirmRequest request) {
        PasswordResetToken reset = resetTokens.findByTokenHash(hash(request.getToken()))
                .orElseThrow(() -> new IllegalArgumentException("El enlace no es válido o expiró. Pedí uno nuevo."));
        if (reset.getUsedAt() != null || reset.getExpiresAt().isBefore(LocalDateTime.now())
                || reset.getUser().getAuthProvider() != AuthProvider.LOCAL) {
            throw new IllegalArgumentException("El enlace no es válido o expiró. Pedí uno nuevo.");
        }
        LocalDateTime now = LocalDateTime.now();
        if (resetTokens.consumeIfUnused(reset.getId(), now) != 1)
            throw new IllegalArgumentException("El enlace no es válido o expiró. Pedí uno nuevo.");
        reset.getUser().setPassword(passwordEncoder.encode(request.getPassword()));
        resetTokens.deleteByUserIdAndUsedAtIsNull(reset.getUser().getId());
    }

    private String hash(String token) {
        try { return java.util.HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8))); }
        catch (Exception e) { throw new IllegalStateException(e); }
    }
}
