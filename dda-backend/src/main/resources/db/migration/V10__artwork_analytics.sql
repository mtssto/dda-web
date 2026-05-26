ALTER TABLE artworks ADD COLUMN view_count BIGINT NOT NULL DEFAULT 0;
ALTER TABLE artworks ADD COLUMN likes_count BIGINT NOT NULL DEFAULT 0;

CREATE TABLE artwork_likes (
    artwork_id BIGINT NOT NULL,
    user_id    BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (artwork_id, user_id),
    CONSTRAINT fk_artwork_like_artwork FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE,
    CONSTRAINT fk_artwork_like_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
);
