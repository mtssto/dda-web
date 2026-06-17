ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL';
ALTER TABLE users ADD COLUMN provider_user_id VARCHAR(255) NULL;

CREATE UNIQUE INDEX idx_users_auth_provider_subject ON users(auth_provider, provider_user_id);
