package com.dda.config;

import com.dda.entity.User;
import com.dda.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminUserSeeder implements ApplicationRunner {

    private final AdminSeedProperties adminSeed;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!adminSeed.isSeedEnabled()) {
            return;
        }

        String password = adminSeed.getPassword();
        if (password == null || password.isBlank()) {
            log.warn("Admin seed skipped: app.admin.password is not set");
            return;
        }

        String username = adminSeed.getUsername().trim();
        String email = adminSeed.getEmail().trim();

        var existing = userRepository.findByUsername(username);
        if (existing.isPresent()) {
            if (adminSeed.isPromoteExisting() && existing.get().getRole() != User.Role.ADMIN) {
                User user = existing.get();
                user.setRole(User.Role.ADMIN);
                userRepository.save(user);
                log.info("Promoted existing user '{}' to ADMIN", username);
            }
            return;
        }

        if (userRepository.count() > 0) {
            boolean hasAdmin = userRepository.findAll().stream()
                    .anyMatch(u -> u.getRole() == User.Role.ADMIN);
            if (hasAdmin) {
                return;
            }
            log.info("No ADMIN user found; creating seed admin '{}'", username);
        }

        if (userRepository.existsByEmail(email)) {
            log.warn("Admin seed skipped: email '{}' already in use", email);
            return;
        }

        User admin = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(User.Role.ADMIN)
                .emailVerified(true)
                .build();
        userRepository.save(admin);
        log.info("Seed admin created: username='{}' email='{}'", username, email);
    }
}
