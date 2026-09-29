-- Replace promotional copy with concise material and size details.
UPDATE artworks
SET description = CASE slug
    WHEN 'dibu-1' THEN 'Técnica mixta sobre papel. Medidas: consultar.'
    WHEN 'dibu-2' THEN 'Técnica mixta sobre papel. Medidas: consultar.'
    WHEN 'dibu-3' THEN 'Técnica mixta sobre papel. Medidas: consultar.'
    WHEN 'dibu-4' THEN 'Técnica mixta sobre papel. Medidas: consultar.'
    WHEN 'dibu-5' THEN 'Técnica mixta sobre papel. Medidas: consultar.'
    WHEN 'dibu-6' THEN 'Técnica mixta sobre papel. Medidas: consultar.'
    WHEN 'dibu-7' THEN 'Técnica mixta sobre papel. Medidas: consultar.'
    WHEN 'dibu-8' THEN 'Técnica mixta sobre papel. Medidas: consultar.'
    WHEN 'dibu-9' THEN 'Técnica mixta sobre papel. Medidas: consultar.'
    WHEN 'dibu-11' THEN 'Técnica mixta sobre papel. Medidas: consultar.'
    WHEN 'dibu-12' THEN 'Técnica mixta sobre papel. Medidas: consultar.'
    WHEN 'dibu-14' THEN 'Técnica mixta sobre papel. Medidas: consultar.'
    WHEN 'dibu-15' THEN 'Técnica mixta sobre papel. Medidas: consultar.'
    WHEN 'dibu-16' THEN 'Técnica mixta sobre papel. Medidas: consultar.'
    WHEN 'dibu-19' THEN 'Técnica mixta sobre papel. Medidas: consultar.'
    WHEN 'dibu-20' THEN 'Técnica mixta sobre papel. Medidas: consultar.'
END
WHERE slug IN (
    'dibu-1', 'dibu-2', 'dibu-3', 'dibu-4', 'dibu-5', 'dibu-6', 'dibu-7', 'dibu-8',
    'dibu-9', 'dibu-11', 'dibu-12', 'dibu-14', 'dibu-15', 'dibu-16', 'dibu-19', 'dibu-20'
);
