CREATE TABLE password_reset_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_password_reset_user ON password_reset_tokens(user_id);
CREATE TABLE auth_admin_bootstrap_state (
    id INTEGER PRIMARY KEY,
    consumed BOOLEAN NOT NULL DEFAULT FALSE
);
INSERT INTO auth_admin_bootstrap_state (id, consumed) VALUES (1, FALSE);
