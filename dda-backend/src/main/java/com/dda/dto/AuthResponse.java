package com.dda.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter @AllArgsConstructor @Builder
public class AuthResponse {
    private String token;
    private String username;
    private String role;
    private String message;
    private Boolean pendingVerification;
}
