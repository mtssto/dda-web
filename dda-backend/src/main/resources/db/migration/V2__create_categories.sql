CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100)
);

INSERT INTO categories (name, display_name) VALUES
    ('pasteles', 'Pasteles'),
    ('ilustraciones', 'Ilustraciones'),
    ('paisajes', 'Paisajes'),
    ('gatos', 'Gatos'),
    ('digital', 'Digital'),
    ('Autorretratos', 'Autorretratos'),
    ('simbolico', 'Simbólico'),
    ('obras', 'Obras'),
    ('texto', 'Texto'),
    ('paisaje', 'Paisaje');
