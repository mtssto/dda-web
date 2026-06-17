package com.dda.service.oauth;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@Slf4j
public class GoogleTokenVerifier {

    private final String clientId;

    public GoogleTokenVerifier(@Value("${app.oauth.google.client-id:}") String clientId) {
        this.clientId = clientId == null ? "" : clientId.trim();
    }

    public boolean isConfigured() {
        return !clientId.isBlank();
    }

    public OAuthUserInfo verify(String idToken) {
        if (!isConfigured()) {
            throw new IllegalStateException("Google Sign-In no está configurado en el servidor.");
        }

        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(clientId))
                    .build();

            GoogleIdToken token = verifier.verify(idToken);
            if (token == null) {
                throw new IllegalArgumentException("Token de Google inválido o expirado.");
            }

            GoogleIdToken.Payload payload = token.getPayload();
            String email = payload.getEmail();
            if (email == null || email.isBlank()) {
                throw new IllegalArgumentException("Google no devolvió un email para esta cuenta.");
            }

            return OAuthUserInfo.builder()
                    .subject(payload.getSubject())
                    .email(email.toLowerCase())
                    .emailVerified(Boolean.TRUE.equals(payload.getEmailVerified()))
                    .displayName((String) payload.get("name"))
                    .build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Google token verification failed: {}", e.getMessage());
            throw new IllegalArgumentException("No se pudo verificar la cuenta de Google.");
        }
    }
}
