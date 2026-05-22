-- For databases created before source column was added to V6
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS source VARCHAR(50);
