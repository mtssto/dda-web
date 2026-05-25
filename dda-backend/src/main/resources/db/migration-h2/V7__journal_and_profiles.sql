-- H2 in-memory: DB is always fresh, so plain ALTER TABLE is safe.

ALTER TABLE users ADD COLUMN display_name VARCHAR(100);
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);
ALTER TABLE users ADD COLUMN newsletter_opt_in BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS journal_posts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(120) NOT NULL UNIQUE,
    title_es VARCHAR(300) NOT NULL,
    title_en VARCHAR(300),
    excerpt_es TEXT,
    excerpt_en TEXT,
    content_es LONGTEXT,
    content_en LONGTEXT,
    cover_image VARCHAR(500),
    tags VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    published_at TIMESTAMP NULL,
    scheduled_at TIMESTAMP NULL,
    author_id BIGINT,
    likes_count INT DEFAULT 0,
    send_newsletter_on_publish BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_journal_author FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_journal_status ON journal_posts(status);
CREATE INDEX IF NOT EXISTS idx_journal_published ON journal_posts(published_at);

CREATE TABLE IF NOT EXISTS journal_comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    post_id BIGINT NOT NULL,
    user_id BIGINT,
    author_name VARCHAR(80) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES journal_posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS journal_likes (
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id),
    CONSTRAINT fk_like_post FOREIGN KEY (post_id) REFERENCES journal_posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_like_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS newsletter_campaigns (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    subject VARCHAR(300) NOT NULL,
    post_id BIGINT,
    sent_count INT DEFAULT 0,
    open_count INT DEFAULT 0,
    click_count INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'DRAFT',
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_campaign_post FOREIGN KEY (post_id) REFERENCES journal_posts(id)
);

CREATE TABLE IF NOT EXISTS newsletter_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    subscriber_email VARCHAR(100) NOT NULL,
    event_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_event_campaign FOREIGN KEY (campaign_id) REFERENCES newsletter_campaigns(id) ON DELETE CASCADE
);
