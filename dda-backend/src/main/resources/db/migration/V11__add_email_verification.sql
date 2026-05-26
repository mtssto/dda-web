ALTER TABLE users ADD COLUMN email_verified           BOOLEAN      NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN verification_token       VARCHAR(255);
ALTER TABLE users ADD COLUMN verification_token_expiry TIMESTAMP;

-- Grandfather existing users so they are not locked out
UPDATE users SET email_verified = TRUE;
