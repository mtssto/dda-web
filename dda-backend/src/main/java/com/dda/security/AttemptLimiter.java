package com.dda.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.concurrent.atomic.AtomicInteger;

/** In-process failed-attempt windows; keys are hashed so usernames/IPs are not retained. */
@Component
public class AttemptLimiter {
    private final Cache<String, AtomicInteger> login = Caffeine.newBuilder()
            .maximumSize(100_000).expireAfterWrite(Duration.ofMinutes(15)).build();
    private final Cache<String, AtomicInteger> reset = Caffeine.newBuilder()
            .maximumSize(100_000).expireAfterWrite(Duration.ofHours(1)).build();
    private final Cache<String, AtomicInteger> bootstrap = Caffeine.newBuilder()
            .maximumSize(10_000).expireAfterWrite(Duration.ofMinutes(15)).build();

    public boolean isLoginBlocked(String username, String ip) { return count(login, username + "|" + ip) >= 5; }
    public void loginFailed(String username, String ip) { increment(login, username + "|" + ip); }
    public void loginSucceeded(String username, String ip) { login.invalidate(key(username + "|" + ip)); }
    public boolean isResetBlocked(String email, String ip) { return count(reset, email + "|" + ip) >= 3; }
    public void resetRequested(String email, String ip) { increment(reset, email + "|" + ip); }
    public boolean isBootstrapBlocked(String ip) { return count(bootstrap, ip) >= 5; }
    public void bootstrapFailed(String ip) { increment(bootstrap, ip); }
    public void bootstrapSucceeded(String ip) { bootstrap.invalidate(key(ip)); }

    private int count(Cache<String, AtomicInteger> cache, String value) {
        AtomicInteger current = cache.getIfPresent(key(value)); return current == null ? 0 : current.get();
    }
    private void increment(Cache<String, AtomicInteger> cache, String value) {
        cache.asMap().compute(key(value), (k, current) -> {
            if (current == null) current = new AtomicInteger(); current.incrementAndGet(); return current;
        });
    }
    private String key(String value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.trim().toLowerCase().getBytes(StandardCharsets.UTF_8))); }
        catch (Exception e) { throw new IllegalStateException(e); }
    }
}
