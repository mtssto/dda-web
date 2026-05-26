package com.dda.service;

import com.dda.dto.AuthResponse;
import com.dda.dto.LoginRequest;
import com.dda.dto.RegisterRequest;
import com.dda.entity.User;
import com.dda.repository.UserRepository;
import com.dda.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final EmailService emailService;

    @Value("${app.public-base-url:https://dda-web-production.up.railway.app}")
    private String publicBaseUrl;

    @Value("${dda.mail.enabled:false}")
    private boolean mailEnabled;

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Usuario o contraseña incorrectos"));

        if (mailEnabled && !Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new DisabledException("Tu email aún no ha sido verificado. Revisá tu bandeja de entrada.");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        String token = tokenProvider.generateToken(authentication);

        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .role(user.getRole().name())
                .build();
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("El nombre de usuario ya está en uso");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("El email ya está registrado");
        }

        boolean isFirstUser = userRepository.count() == 0;

        // When email is disabled (dev mode), auto-verify and return JWT immediately
        if (!mailEnabled) {
            User user = User.builder()
                    .username(request.getUsername())
                    .email(request.getEmail())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .role(isFirstUser ? User.Role.ADMIN : User.Role.USER)
                    .emailVerified(true)
                    .build();

            userRepository.save(user);

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
            String token = tokenProvider.generateToken(authentication);

            return AuthResponse.builder()
                    .token(token)
                    .username(user.getUsername())
                    .role(user.getRole().name())
                    .build();
        }

        String verificationToken = UUID.randomUUID().toString();

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(isFirstUser ? User.Role.ADMIN : User.Role.USER)
                .emailVerified(false)
                .verificationToken(verificationToken)
                .verificationTokenExpiry(LocalDateTime.now().plusHours(24))
                .build();

        userRepository.save(user);

        String verifyUrl = publicBaseUrl + "/api/auth/verify?token=" + verificationToken;
        emailService.sendVerificationEmail(request.getEmail(), request.getUsername(), verifyUrl);

        return AuthResponse.builder()
                .username(user.getUsername())
                .message("Te enviamos un email de verificación. Revisá tu bandeja de entrada.")
                .pendingVerification(true)
                .build();
    }

    @Transactional
    public String verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token de verificación inválido."));

        if (user.getVerificationTokenExpiry() != null
                && user.getVerificationTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("El enlace de verificación ha expirado. Solicitá uno nuevo.");
        }

        user.setEmailVerified(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        userRepository.save(user);

        return user.getUsername();
    }

    @Transactional
    public void resendVerification(String email) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("No encontramos una cuenta con ese email."));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new IllegalArgumentException("Tu email ya está verificado. Podés iniciar sesión.");
        }

        String newToken = UUID.randomUUID().toString();
        user.setVerificationToken(newToken);
        user.setVerificationTokenExpiry(LocalDateTime.now().plusHours(24));
        userRepository.save(user);

        String verifyUrl = publicBaseUrl + "/api/auth/verify?token=" + newToken;
        emailService.sendVerificationEmail(user.getEmail(), user.getUsername(), verifyUrl);
    }
}
