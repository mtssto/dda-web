package com.dda.controller;

import com.dda.dto.AuthResponse;
import com.dda.dto.LoginRequest;
import com.dda.dto.RegisterRequest;
import com.dda.dto.UserProfileResponse;
import com.dda.security.AuthCookieService;
import com.dda.security.CustomUserDetails;
import com.dda.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthCookieService authCookieService;

    @Value("${app.static.base-url:https://diegodeaduriz.art}")
    private String staticBaseUrl;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        try {
            AuthResponse authResponse = authService.login(request);
            authCookieService.setAuthCookie(response, authResponse.getToken());
            return ResponseEntity.ok(toPublicResponse(authResponse));
        } catch (DisabledException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "message", e.getMessage(),
                            "pendingVerification", true
                    ));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request,
                                                 HttpServletResponse response) {
        AuthResponse authResponse = authService.register(request);
        if (authResponse.getToken() != null) {
            authCookieService.setAuthCookie(response, authResponse.getToken());
        }
        return ResponseEntity.ok(toPublicResponse(authResponse));
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> me(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(new UserProfileResponse(
                userDetails.getUsername(),
                userDetails.getUser().getRole().name()
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        authCookieService.clearAuthCookie(response);
        return ResponseEntity.noContent().build();
    }

    private AuthResponse toPublicResponse(AuthResponse authResponse) {
        return AuthResponse.builder()
                .username(authResponse.getUsername())
                .role(authResponse.getRole())
                .message(authResponse.getMessage())
                .pendingVerification(authResponse.getPendingVerification())
                .build();
    }

    @GetMapping("/verify")
    public ResponseEntity<Void> verifyEmail(@RequestParam String token) {
        try {
            authService.verifyEmail(token);
            String redirect = staticBaseUrl + "/shop/user-login.html?verified=true";
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(redirect))
                    .build();
        } catch (IllegalArgumentException e) {
            String redirect = staticBaseUrl + "/shop/user-login.html?verify_error="
                    + java.net.URLEncoder.encode(e.getMessage(), java.nio.charset.StandardCharsets.UTF_8);
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(redirect))
                    .build();
        }
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, String>> resendVerification(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El email es obligatorio."));
        }
        try {
            authService.resendVerification(email);
            return ResponseEntity.ok(Map.of("message", "Te reenviamos el email de verificación."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
