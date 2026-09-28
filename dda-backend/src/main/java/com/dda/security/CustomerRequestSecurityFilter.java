package com.dda.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.net.URI;
import java.util.Set;

@Component @RequiredArgsConstructor
public class CustomerRequestSecurityFilter extends OncePerRequestFilter {
    private final AuthCookieService cookies;
    private static final Set<String> ALLOWED = Set.of("https://diegodeaduriz.com", "https://www.diegodeaduriz.com",
            "https://whitewidow.github.io", "https://api.diegodeaduriz.com",
            "https://dda-web-production.up.railway.app");

    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String method = request.getMethod();
        boolean write = !("GET".equals(method) || "HEAD".equals(method) || "OPTIONS".equals(method));
        String path = request.getRequestURI();
        boolean sensitiveAuthWrite = write && (path.equals("/api/auth/customer/login") || path.equals("/api/auth/register")
                || path.equals("/api/auth/login") || path.equals("/api/auth/google") || path.equals("/api/auth/apple")
                || path.equals("/api/auth/logout")
                || path.startsWith("/api/auth/password-reset/") || path.equals("/api/auth/resend-verification")
                || path.equals("/api/auth/bootstrap-admin"));
        boolean cookieWrite = write && cookies.extractToken(request) != null;
        if (sensitiveAuthWrite || cookieWrite) {
            String origin = request.getHeader("Origin");
            if (!isAllowed(origin)) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"message\":\"Origen no permitido\"}");
                return;
            }
        }
        chain.doFilter(request, response);
    }

    private boolean isAllowed(String origin) {
        if (origin == null) return false;
        try {
            URI uri = URI.create(origin);
            String normalized = uri.getScheme() + "://" + uri.getAuthority();
            if (ALLOWED.contains(normalized)) return true;
            String host = uri.getHost();
            return "http".equals(uri.getScheme()) && host != null
                    && (host.equals("localhost") || host.equals("127.0.0.1"));
        } catch (RuntimeException e) { return false; }
    }
}
