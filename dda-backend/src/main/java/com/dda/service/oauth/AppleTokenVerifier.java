package com.dda.service.oauth;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.JWKSourceBuilder;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.proc.ConfigurableJWTProcessor;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URL;
import java.util.List;

@Service
@Slf4j
public class AppleTokenVerifier {

    private static final String APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys";
    private static final String APPLE_ISSUER = "https://appleid.apple.com";

    private final String clientId;

    public AppleTokenVerifier(@Value("${app.oauth.apple.client-id:}") String clientId) {
        this.clientId = clientId == null ? "" : clientId.trim();
    }

    public boolean isConfigured() {
        return !clientId.isBlank();
    }

    public OAuthUserInfo verify(String idToken) {
        if (!isConfigured()) {
            throw new IllegalStateException("Sign in with Apple no está configurado en el servidor.");
        }

        try {
            ConfigurableJWTProcessor<SecurityContext> processor = new DefaultJWTProcessor<>();
            JWKSource<SecurityContext> keySource = JWKSourceBuilder
                    .create(new URL(APPLE_JWKS_URL))
                    .build();
            processor.setJWSKeySelector(new JWSVerificationKeySelector<>(JWSAlgorithm.RS256, keySource));

            JWTClaimsSet claims = processor.process(idToken, null);

            if (!APPLE_ISSUER.equals(claims.getIssuer())) {
                throw new IllegalArgumentException("Emisor de Apple inválido.");
            }

            List<String> audience = claims.getAudience();
            if (audience == null || !audience.contains(clientId)) {
                throw new IllegalArgumentException("Audiencia de Apple inválida.");
            }

            String subject = claims.getSubject();
            if (subject == null || subject.isBlank()) {
                throw new IllegalArgumentException("Token de Apple inválido.");
            }

            String email = claims.getStringClaim("email");
            Boolean emailVerifiedClaim = claims.getBooleanClaim("email_verified");

            return OAuthUserInfo.builder()
                    .subject(subject)
                    .email(email != null ? email.toLowerCase() : null)
                    .emailVerified(emailVerifiedClaim == null || emailVerifiedClaim)
                    .displayName(null)
                    .build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Apple token verification failed: {}", e.getMessage());
            throw new IllegalArgumentException("No se pudo verificar la cuenta de Apple.");
        }
    }
}
