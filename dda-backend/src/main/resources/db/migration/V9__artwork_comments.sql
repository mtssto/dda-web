CREATE TABLE IF NOT EXISTS artwork_comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    artwork_id BIGINT NOT NULL,
    user_id BIGINT,
    author_name VARCHAR(80) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_artwork_comment_artwork FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE,
    CONSTRAINT fk_artwork_comment_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_artwork_comment_artwork ON artwork_comments(artwork_id);
CREATE INDEX idx_artwork_comment_status ON artwork_comments(status);
