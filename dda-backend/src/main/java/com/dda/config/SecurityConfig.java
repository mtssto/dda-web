package com.dda.config;

import com.dda.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.http.HttpStatus;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/auth/me").authenticated()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/newsletter/subscribe").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/newsletter/unsubscribe").permitAll()
                        .requestMatchers("/api/newsletter/subscribers").hasRole("ADMIN")
                        .requestMatchers("/api/newsletter/send").hasRole("ADMIN")
                        .requestMatchers("/api/newsletter/admin/**").hasRole("ADMIN")
                        .requestMatchers("/h2-console/**").permitAll()

                        // Public API reads
                        .requestMatchers(HttpMethod.GET, "/api/artworks/me/comments").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/artworks").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/artworks/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/journal/posts").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/journal/posts/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/journal/posts/*/comments").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/artworks/*/comments").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/artworks/*/view").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/artworks/*/like").authenticated()

                        .requestMatchers("/api/journal/admin/**").hasRole("ADMIN")

                        // Public static files, if served by Spring/Railway
                        .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/portfolio/**").permitAll()

                        // Admin API
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // Protected artwork/category/image mutations
                        .requestMatchers(HttpMethod.POST, "/api/artworks/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/artworks/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/artworks/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/artworks/**").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/categories/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/categories/**").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/images/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/images/**").hasRole("ADMIN")

                        .anyRequest().authenticated()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
