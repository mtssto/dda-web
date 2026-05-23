package com.dda.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.admin")
public class AdminSeedProperties {

    /** Create or promote admin on startup when true. */
    private boolean seedEnabled = false;

    private String username = "admin";

    private String email = "admin@diegodeaduriz.art";

    /** Plain text; encoded before save. Leave empty to skip seeding. */
    private String password = "";

    /** If the username already exists, set role to ADMIN instead of creating a duplicate. */
    private boolean promoteExisting = true;
}
