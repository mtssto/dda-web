package com.dda.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OAuthLoginRequest {

    @NotBlank
    @JsonAlias("id_token")
    private String idToken;

    private String firstName;

    private String lastName;
}
