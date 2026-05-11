CREATE TABLE artworks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    price VARCHAR(50),
    dimensions VARCHAR(50),
    technique VARCHAR(100),
    artwork_year VARCHAR(20),
    sold BOOLEAN NOT NULL DEFAULT FALSE,
    category_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_artwork_category FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE artwork_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    artwork_id BIGINT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(200),
    content_type VARCHAR(50),
    file_size BIGINT,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    CONSTRAINT fk_image_artwork FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE
);

CREATE INDEX idx_artwork_slug ON artworks(slug);
CREATE INDEX idx_artwork_category ON artworks(category_id);
CREATE INDEX idx_artwork_sold ON artworks(sold);
CREATE INDEX idx_image_artwork ON artwork_images(artwork_id);
