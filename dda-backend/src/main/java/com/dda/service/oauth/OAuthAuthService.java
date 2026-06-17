package com.dda.service.oauth;

import com.dda.dto.AuthResponse;
import com.dda.entity.AuthProvider;
import com.dda.entity.User;
import com.dda.repository.UserRepository;
import com.dda.security.CustomUserDetails;
import com.dda.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OAuthAuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse loginWithProvider(AuthProvider provider, OAuthUserInfo info, String firstName, String lastName) {
        User user = userRepository.findByAuthProviderAndProviderUserId(provider, info.getSubject())
                .orElseGet(() -> resolveOrCreateUser(provider, info, firstName, lastName));

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            user.setEmailVerified(true);
            userRepository.save(user);
        }

        String token = tokenProvider.generateToken(
                new UsernamePasswordAuthenticationToken(
                        new CustomUserDetails(user),
                        null,
                        new CustomUserDetails(user).getAuthorities()));

        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .role(user.getRole().name())
                .build();
    }

    private User resolveOrCreateUser(AuthProvider provider, OAuthUserInfo info, String firstName, String lastName) {
        if (info.getEmail() != null && !info.getEmail().isBlank()) {
            var existingByEmail = userRepository.findByEmail(info.getEmail());
            if (existingByEmail.isPresent()) {
                User existing = existingByEmail.get();
                if (existing.getAuthProvider() != provider) {
                    if (existing.getAuthProvider() == AuthProvider.LOCAL) {
                        existing.setAuthProvider(provider);
                        existing.setProviderUserId(info.getSubject());
                        if (info.isEmailVerified()) {
                            existing.setEmailVerified(true);
                        }
                        return userRepository.save(existing);
                    }
                    throw new IllegalArgumentException(
                            "Ya existe una cuenta con este email. Iniciá sesión con tu contraseña o el mismo proveedor.");
                }
                if (existing.getProviderUserId() == null) {
                    existing.setProviderUserId(info.getSubject());
                    existing.setAuthProvider(provider);
                    return userRepository.save(existing);
                }
                return existing;
            }
        }

        String email = info.getEmail();
        if (email == null || email.isBlank()) {
            email = provider.name().toLowerCase() + "_" + info.getSubject().substring(0, Math.min(12, info.getSubject().length()))
                    + "@users.diegodeaduriz.art";
            int suffix = 1;
            String baseEmail = email;
            while (userRepository.existsByEmail(email)) {
                email = baseEmail.replace("@", suffix++ + "@");
            }
        }

        String usernameBase = buildUsernameBase(info.getDisplayName(), firstName, lastName, email);
        String username = uniqueUsername(usernameBase);

        User user = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode("oauth-" + UUID.randomUUID()))
                .authProvider(provider)
                .providerUserId(info.getSubject())
                .role(User.Role.USER)
                .emailVerified(info.isEmailVerified())
                .build();

        return userRepository.save(user);
    }

    private String buildUsernameBase(String displayName, String firstName, String lastName, String email) {
        String raw = displayName;
        if (raw == null || raw.isBlank()) {
            if (firstName != null && !firstName.isBlank()) {
                raw = firstName + (lastName != null && !lastName.isBlank() ? lastName : "");
            }
        }
        if (raw == null || raw.isBlank()) {
            raw = email != null && email.contains("@") ? email.substring(0, email.indexOf('@')) : "user";
        }
        String sanitized = raw.toLowerCase().replaceAll("[^a-z0-9_]", "");
        if (sanitized.length() < 3) {
            sanitized = "user";
        }
        return sanitized.substring(0, Math.min(40, sanitized.length()));
    }

    private String uniqueUsername(String base) {
        String candidate = base;
        int suffix = 1;
        while (userRepository.existsByUsername(candidate)) {
            String suffixStr = String.valueOf(suffix++);
            int maxBase = Math.max(3, 50 - suffixStr.length());
            candidate = base.substring(0, Math.min(base.length(), maxBase)) + suffixStr;
        }
        return candidate;
    }
}
