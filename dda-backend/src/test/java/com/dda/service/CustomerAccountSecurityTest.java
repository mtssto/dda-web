package com.dda.service;

import com.dda.dto.PasswordResetConfirmRequest;
import com.dda.dto.RegisterRequest;
import com.dda.dto.AuthResponse;
import com.dda.dto.LoginRequest;
import com.dda.entity.AuthProvider;
import com.dda.entity.PasswordResetToken;
import com.dda.entity.User;
import com.dda.repository.PasswordResetTokenRepository;
import com.dda.repository.UserRepository;
import com.dda.security.AttemptLimiter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;
import java.time.LocalDateTime;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerAccountSecurityTest {
    @Mock UserRepository users;
    @Mock PasswordResetTokenRepository resets;
    @Mock EmailService email;
    @Mock JdbcTemplate jdbc;
    @Mock AuthenticationManager authenticationManager;
    @Mock com.dda.security.JwtTokenProvider jwt;
    private final PasswordEncoder encoder = new BCryptPasswordEncoder();
    private CustomerAccountService accounts;
    private AdminBootstrapService bootstrap;
    private AuthService auth;

    @BeforeEach void setUp() {
        accounts = new CustomerAccountService(users, resets, encoder, email);
        ReflectionTestUtils.setField(accounts, "staticBaseUrl", "https://diegodeaduriz.com");
        bootstrap = new AdminBootstrapService(users, jdbc, encoder);
        ReflectionTestUtils.setField(bootstrap, "configuredSecret", "one-use-test-secret");
        auth = new AuthService(users, encoder, authenticationManager, jwt, email);
    }

    @Test void sendsHashedSingleUseTokenOnlyToLocalAccount() {
        User user = localUser();
        when(users.findByEmail("client@example.com")).thenReturn(Optional.of(user));
        accounts.requestPasswordReset("CLIENT@example.com");

        ArgumentCaptor<PasswordResetToken> saved = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(resets).save(saved.capture());
        ArgumentCaptor<String> link = ArgumentCaptor.forClass(String.class);
        verify(email).sendPasswordResetEmail(eq(user.getEmail()), eq(user.getUsername()), link.capture());
        String rawToken = link.getValue().substring(link.getValue().indexOf("reset_token=") + 12);
        assertNotEquals(rawToken, saved.getValue().getTokenHash());
        assertTrue(saved.getValue().getExpiresAt().isAfter(LocalDateTime.now().plusMinutes(29)));
        assertTrue(saved.getValue().getExpiresAt().isBefore(LocalDateTime.now().plusMinutes(31)));
    }

    @Test void unknownAndOAuthAccountsDoNotSendResetEmail() {
        when(users.findByEmail("missing@example.com")).thenReturn(Optional.empty());
        accounts.requestPasswordReset("missing@example.com");
        User oauth = localUser(); oauth.setAuthProvider(AuthProvider.GOOGLE);
        when(users.findByEmail("oauth@example.com")).thenReturn(Optional.of(oauth));
        accounts.requestPasswordReset("oauth@example.com");
        verify(email, never()).sendPasswordResetEmail(anyString(), anyString(), anyString());
        verify(resets, never()).save(any());
    }

    @Test void resetRequiresValidUnexpiredUnusedTokenAndChangesPassword() {
        User user = localUser();
        PasswordResetToken token = PasswordResetToken.builder().id(4L).user(user).tokenHash("hash")
                .expiresAt(LocalDateTime.now().plusMinutes(10)).build();
        when(resets.findByTokenHash(anyString())).thenReturn(Optional.of(token));
        when(resets.consumeIfUnused(eq(4L), any(LocalDateTime.class))).thenReturn(1);
        PasswordResetConfirmRequest request = resetRequest("UniqueNewPass9!");
        accounts.confirmPasswordReset(request);
        assertTrue(encoder.matches("UniqueNewPass9!", user.getPassword()));
        verify(resets).deleteByUserIdAndUsedAtIsNull(user.getId());

        when(resets.consumeIfUnused(eq(4L), any(LocalDateTime.class))).thenReturn(0);
        assertThrows(IllegalArgumentException.class, () -> accounts.confirmPasswordReset(request));

        token.setExpiresAt(LocalDateTime.now().minusSeconds(1));
        assertThrows(IllegalArgumentException.class, () -> accounts.confirmPasswordReset(request));
    }

    @Test void bootstrapSecretCanCreateOnlyOneAdmin() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("firstadmin"); request.setEmail("admin@example.com"); request.setPassword("SecurePass9!");
        when(users.existsByRole(User.Role.ADMIN)).thenReturn(false);
        when(users.existsByUsername(anyString())).thenReturn(false);
        when(users.existsByEmail(anyString())).thenReturn(false);
        when(jdbc.update(anyString())).thenReturn(1, 0);
        bootstrap.createFirstAdmin(request, "one-use-test-secret");
        ArgumentCaptor<User> created = ArgumentCaptor.forClass(User.class);
        verify(users).save(created.capture());
        assertEquals(User.Role.ADMIN, created.getValue().getRole());
        assertThrows(IllegalStateException.class, () -> bootstrap.createFirstAdmin(request, "one-use-test-secret"));
        assertThrows(IllegalArgumentException.class, () -> bootstrap.createFirstAdmin(request, "wrong"));
    }

    @Test void publicRegistrationAlwaysCreatesUserRole() {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newclient"); request.setEmail("newclient@example.com"); request.setPassword("SecurePass9!");
        when(users.existsByUsername("newclient")).thenReturn(false);
        when(users.existsByEmail("newclient@example.com")).thenReturn(false);
        Authentication authentication = new UsernamePasswordAuthenticationToken("newclient", "SecurePass9!");
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(jwt.generateToken(authentication)).thenReturn("jwt-token");
        AuthResponse result = auth.register(request);
        ArgumentCaptor<User> created = ArgumentCaptor.forClass(User.class);
        verify(users).save(created.capture());
        assertEquals(User.Role.USER, created.getValue().getRole());
        assertEquals("USER", result.getRole());
    }

    @Test void customerAndAdminLoginRoutesAcceptOnlyTheirRoles() {
        LoginRequest request = new LoginRequest(); request.setUsername("client"); request.setPassword("SecurePass9!");
        User customer = localUser();
        when(users.findByUsername("client")).thenReturn(Optional.of(customer));
        assertThrows(IllegalArgumentException.class, () -> auth.login(request));
        verify(authenticationManager, never()).authenticate(any());
        Authentication accepted = new UsernamePasswordAuthenticationToken("client", "SecurePass9!");
        when(authenticationManager.authenticate(any())).thenReturn(accepted);
        when(jwt.generateToken(accepted)).thenReturn("customer-jwt");
        assertEquals("USER", auth.customerLogin(request).getRole());

        User admin = localUser(); admin.setRole(User.Role.ADMIN); admin.setUsername("admin");
        when(users.findByUsername("admin")).thenReturn(Optional.of(admin));
        request.setUsername("admin");
        assertThrows(IllegalArgumentException.class, () -> auth.customerLogin(request));
        when(jwt.generateToken(accepted)).thenReturn("admin-jwt");
        assertEquals("ADMIN", auth.login(request).getRole());
    }

    @Test void attemptLimiterBlocksSixthFailureAndClearsOnSuccess() {
        AttemptLimiter limiter = new AttemptLimiter();
        for (int i = 0; i < 5; i++) { assertFalse(limiter.isLoginBlocked("client", "203.0.113.1")); limiter.loginFailed("client", "203.0.113.1"); }
        assertTrue(limiter.isLoginBlocked("client", "203.0.113.1"));
        assertFalse(limiter.isLoginBlocked("other", "203.0.113.1"));
        limiter.loginSucceeded("client", "203.0.113.1");
        assertFalse(limiter.isLoginBlocked("client", "203.0.113.1"));
    }

    private User localUser() {
        return User.builder().id(1L).username("client").email("client@example.com").password(encoder.encode("OldPassword9!"))
                .authProvider(AuthProvider.LOCAL).role(User.Role.USER).emailVerified(true).build();
    }

    private PasswordResetConfirmRequest resetRequest(String password) {
        PasswordResetConfirmRequest request = new PasswordResetConfirmRequest();
        request.setToken("token-value"); request.setPassword(password); return request;
    }
}
