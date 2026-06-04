package com.dda.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class AuthCookieService {

    private final String cookieName;
    private final long maxAgeSeconds;
    private final boolean secure;
    private final String sameSite;

    public AuthCookieService(
            @Value("${app.jwt.cookie-name}") String cookieName,
            @Value("${app.jwt.expiration-ms}") long expirationMs,
            @Value("${app.jwt.cookie-secure}") boolean secure,
            @Value("${app.jwt.cookie-same-site}") String sameSite) {
        this.cookieName = cookieName;
        this.maxAgeSeconds = expirationMs / 1000;
        this.secure = secure;
        this.sameSite = sameSite;
    }

    public String getCookieName() {
        return cookieName;
    }

    public void setAuthCookie(HttpServletResponse response, String token) {
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie(token, maxAgeSeconds).toString());
    }

    public void clearAuthCookie(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie("", 0).toString());
    }

    public String extractToken(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return null;
        }
        for (Cookie cookie : request.getCookies()) {
            if (cookieName.equals(cookie.getName()) && StringUtils.hasText(cookie.getValue())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private ResponseCookie buildCookie(String value, long maxAge) {
        return ResponseCookie.from(cookieName, value)
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(maxAge)
                .sameSite(sameSite)
                .build();
    }
}
