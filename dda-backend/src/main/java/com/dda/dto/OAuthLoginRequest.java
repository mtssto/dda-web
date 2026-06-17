package com.dda.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OAuthLoginRequest {

    @NotBlank
    private String idToken;

    private String firstName;

    private String lastName;
}
