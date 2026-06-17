package com.dda.service.oauth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@Service
@Slf4j
public class GoogleTokenVerifier {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final List<String> clientIds;

    public GoogleTokenVerifier(@Value("${app.oauth.google.client-id:}") String clientId) {
        this.clientIds = parseClientIds(clientId);
    }

    public boolean isConfigured() {
        return !clientIds.isEmpty();
    }

    public OAuthUserInfo verify(String idToken) {
        if (!isConfigured()) {
            throw new IllegalStateException("Google Sign-In no está configurado en el servidor.");
        }
        if (idToken == null || idToken.isBlank()) {
            throw new IllegalArgumentException("Falta el token de Google.");
        }

        String tokenAudience = readTokenAudience(idToken);

        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(),
                    GsonFactory.getDefaultInstance())
                    .setAudience(clientIds)
                    .build();

            GoogleIdToken token = verifier.verify(idToken.trim());
            if (token == null) {
                if (tokenAudience != null && !clientIds.contains(tokenAudience)) {
                    log.warn("Google token audience mismatch. tokenAud={}, configured={}", tokenAudience, clientIds);
                    throw new IllegalArgumentException(
                            "El token de Google no coincide con la app configurada. "
                                    + "Revisá que el Client ID de Google Cloud sea el mismo en Railway y en el sitio.");
                }
                throw new IllegalArgumentException("Token de Google inválido o expirado. Intentá de nuevo.");
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

    private static List<String> parseClientIds(String raw) {
        List<String> ids = new ArrayList<>();
        if (raw == null) {
            return ids;
        }
        for (String part : raw.split(",")) {
            String trimmed = part.trim();
            if (!trimmed.isBlank()) {
                ids.add(trimmed);
            }
        }
        return ids;
    }

    private static String readTokenAudience(String idToken) {
        try {
            String[] parts = idToken.split("\\.");
            if (parts.length < 2) {
                return null;
            }
            byte[] decoded = Base64.getUrlDecoder().decode(parts[1]);
            JsonNode payload = OBJECT_MAPPER.readTree(new String(decoded, StandardCharsets.UTF_8));
            JsonNode aud = payload.get("aud");
            return aud == null || aud.isNull() ? null : aud.asText();
        } catch (Exception e) {
            return null;
        }
    }
}
