-- Add source column when DB ran an older V6 that did not include it
SET @db = DATABASE();

SET @exists := (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = @db AND table_name = 'newsletter_subscribers' AND column_name = 'source');
SET @sql := IF(@exists = 0, 'ALTER TABLE newsletter_subscribers ADD COLUMN source VARCHAR(50)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
