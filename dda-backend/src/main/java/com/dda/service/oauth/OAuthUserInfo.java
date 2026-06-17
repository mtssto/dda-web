package com.dda.service.oauth;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OAuthUserInfo {

    private final String subject;
    private final String email;
    private final boolean emailVerified;
    private final String displayName;
}
