package com.dda.config;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FlywayRepairConfig {

    private static final Logger log = LoggerFactory.getLogger(FlywayRepairConfig.class);

    /**
     * One-time recovery: set DDA_FLYWAY_REPAIR=true, deploy once, then remove the variable.
     * Repair only updates flyway_schema_history (checksums / failed entries). It does not delete data.
     */
    @Bean
    @ConditionalOnProperty(name = "dda.flyway.repair", havingValue = "true")
    FlywayMigrationStrategy repairThenMigrate(Flyway flyway) {
        return f -> {
            log.warn("DDA_FLYWAY_REPAIR=true: running Flyway repair (metadata only — your tables and rows are not touched)");
            f.repair();
            f.migrate();
        };
    }
}
