package com.dda.controller;

import com.dda.dto.AuthResponse;
import com.dda.dto.LoginRequest;
import com.dda.dto.OAuthConfigResponse;
import com.dda.dto.OAuthLoginRequest;
import com.dda.dto.RegisterRequest;
import com.dda.dto.PasswordResetRequest;
import com.dda.dto.PasswordResetConfirmRequest;
import com.dda.dto.UserProfileResponse;
import com.dda.entity.AuthProvider;
import com.dda.security.AuthCookieService;
import com.dda.security.CustomUserDetails;
import com.dda.service.AuthService;
import com.dda.service.CustomerAccountService;
import com.dda.service.AdminBootstrapService;
import com.dda.service.EmailService;
import com.dda.security.AttemptLimiter;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.AuthenticationException;
import com.dda.service.oauth.AppleTokenVerifier;
import com.dda.service.oauth.GoogleTokenVerifier;
import com.dda.service.oauth.OAuthAuthService;
import com.dda.service.oauth.OAuthUserInfo;
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
    private final GoogleTokenVerifier googleTokenVerifier;
    private final AppleTokenVerifier appleTokenVerifier;
    private final OAuthAuthService oauthAuthService;
    private final CustomerAccountService customerAccountService;
    private final AdminBootstrapService adminBootstrapService;
    private final AttemptLimiter attemptLimiter;
    private final EmailService emailService;

    @Value("${app.static.base-url:https://diegodeaduriz.com}")
    private String staticBaseUrl;

    @Value("${app.oauth.google.client-id:}")
    private String googleClientId;

    @Value("${app.oauth.apple.client-id:}")
    private String appleClientId;

    @PostMapping("/customer/login")
    public ResponseEntity<?> customerLogin(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest,
                                           HttpServletResponse response) {
        String username = request.getUsername() == null ? "" : request.getUsername().trim().toLowerCase();
        String ip = httpRequest.getRemoteAddr();
        if (attemptLimiter.isLoginBlocked(username, ip)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of("message", "Demasiados intentos. Esperá 15 minutos e intentá de nuevo."));
        }
        try {
            AuthResponse authResponse = authService.customerLogin(request);
            attemptLimiter.loginSucceeded(username, ip);
            authCookieService.setAuthCookie(response, authResponse.getToken());
            return ResponseEntity.ok(toPublicResponse(authResponse));
        } catch (DisabledException e) {
            attemptLimiter.loginFailed(username, ip);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage(), "pendingVerification", true));
        } catch (AuthenticationException | IllegalArgumentException e) {
            attemptLimiter.loginFailed(username, ip);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Usuario o contraseña incorrectos"));
        }
    }

    @PostMapping("/password-reset/request")
    public ResponseEntity<Map<String, String>> requestPasswordReset(@Valid @RequestBody PasswordResetRequest request,
                                                                     HttpServletRequest httpRequest) {
        String email = request.getEmail().trim().toLowerCase();
        String ip = httpRequest.getRemoteAddr();
        if (attemptLimiter.isResetBlocked(email, ip)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of("message", "Demasiadas solicitudes. Intentá de nuevo más tarde."));
        }
        attemptLimiter.resetRequested(email, ip);
        if (!emailService.isConfiguredForTransactionalEmail()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("message", "La recuperación por email no está disponible por el momento. Probá más tarde."));
        }
        customerAccountService.requestPasswordReset(email);
        return ResponseEntity.accepted().body(Map.of("message", "Si existe una cuenta local con ese email, recibirás instrucciones para recuperar el acceso."));
    }

    @PostMapping("/password-reset/confirm")
    public ResponseEntity<Map<String, String>> confirmPasswordReset(@Valid @RequestBody PasswordResetConfirmRequest request) {
        customerAccountService.confirmPasswordReset(request);
        return ResponseEntity.ok(Map.of("message", "Contraseña actualizada. Ya podés iniciar sesión."));
    }

    @PostMapping("/bootstrap-admin")
    public ResponseEntity<Map<String, String>> bootstrapAdmin(@Valid @RequestBody RegisterRequest request,
            @RequestHeader(value = "X-Admin-Bootstrap-Code", required = false) String code,
            HttpServletRequest httpRequest) {
        String ip = httpRequest.getRemoteAddr();
        if (attemptLimiter.isBootstrapBlocked(ip)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of("message", "Demasiados intentos. Esperá 15 minutos e intentá de nuevo."));
        }
        try {
            adminBootstrapService.createFirstAdmin(request, code);
            attemptLimiter.bootstrapSucceeded(ip);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Administrador inicial creado. Iniciá sesión desde el acceso administrativo."));
        } catch (RuntimeException e) {
            attemptLimiter.bootstrapFailed(ip);
            throw e;
        }
    }

    @GetMapping("/oauth-config")
    public ResponseEntity<OAuthConfigResponse> oauthConfig() {
        return ResponseEntity.ok(OAuthConfigResponse.builder()
                .googleClientId(googleClientId == null ? "" : googleClientId.trim())
                .appleClientId(appleClientId == null ? "" : appleClientId.trim())
                .build());
    }

    @PostMapping("/google")
    public ResponseEntity<?> loginWithGoogle(@Valid @RequestBody OAuthLoginRequest request,
                                             HttpServletResponse response) {
        try {
            OAuthUserInfo info = googleTokenVerifier.verify(request.getIdToken());
            AuthResponse authResponse = oauthAuthService.loginWithProvider(AuthProvider.GOOGLE, info, null, null);
            authCookieService.setAuthCookie(response, authResponse.getToken());
            return ResponseEntity.ok(toPublicResponse(authResponse));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/apple")
    public ResponseEntity<?> loginWithApple(@Valid @RequestBody OAuthLoginRequest request,
                                            HttpServletResponse response) {
        try {
            OAuthUserInfo info = appleTokenVerifier.verify(request.getIdToken());
            AuthResponse authResponse = oauthAuthService.loginWithProvider(
                    AuthProvider.APPLE,
                    info,
                    request.getFirstName(),
                    request.getLastName());
            authCookieService.setAuthCookie(response, authResponse.getToken());
            return ResponseEntity.ok(toPublicResponse(authResponse));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

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
    public ResponseEntity<?> me(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.ok(Map.of("authenticated", false));
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
        // Token in JSON is a fallback when the httpOnly cookie cannot be sent cross-site
        // (diegodeaduriz.com → *.railway.app). Frontend keeps it in sessionStorage only.
        return AuthResponse.builder()
                .username(authResponse.getUsername())
                .role(authResponse.getRole())
                .message(authResponse.getMessage())
                .pendingVerification(authResponse.getPendingVerification())
                .token(authResponse.getToken())
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
