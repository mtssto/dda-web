INSERT INTO categories (name, display_name)
SELECT 'Acuarela', 'Acuarela'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Acuarela');

INSERT INTO categories (name, display_name)
SELECT 'Pintura sobre Madera', 'Pintura sobre Madera'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Pintura sobre Madera');

INSERT INTO categories (name, display_name)
SELECT 'Pintura sobre Tela', 'Pintura sobre Tela'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Pintura sobre Tela');

INSERT INTO categories (name, display_name)
SELECT 'Dibujo sobre Papel', 'Dibujo sobre Papel'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Dibujo sobre Papel');

INSERT INTO categories (name, display_name)
SELECT 'Pitufos', 'Pitufos'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Pitufos');

INSERT INTO categories (name, display_name)
SELECT 'Gatos', 'Gatos'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Gatos');

INSERT INTO categories (name, display_name)
SELECT 'Bastidores 20 x 20', 'Bastidores 20 × 20'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Bastidores 20 x 20');
