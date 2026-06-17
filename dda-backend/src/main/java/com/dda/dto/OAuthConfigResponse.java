package com.dda.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class OAuthConfigResponse {

    private final String googleClientId;
    private final String appleClientId;
}
