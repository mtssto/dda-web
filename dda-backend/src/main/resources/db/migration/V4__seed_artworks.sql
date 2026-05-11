-- Seed all 80 artworks from products.js

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('catastrofe-catarsis', 'Catástrofe / Catarsis', '<strong>54 × 50 cm</strong> de <strong>acrílico sobre tela</strong>. Una obra donde De Aduriz organiza signos, palabras e imágenes en un sistema visual de gran intensidad simbólica. La composición, precisa y frontal, articula tensión entre caos y transformación, con una iconografía propia que mezcla escritura, emblema y visión. <strong>Pieza única</strong>, firmada. <strong>Certificado de autenticidad</strong> incluido.', 'Consultar', '54 x 50 cm', 'Acrílico sobre tela', 'a confirmar', FALSE,
    (SELECT id FROM categories WHERE name = 'simbolico'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'catastrofe-catarsis'), '/portfolio/sections/obras/catastrofe-catarsis-54x50-pastel-tiza-sobre-telas.jpeg', 'catastrofe-catarsis-54x50-pastel-tiza-sobre-telas.jpeg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('fama-fortuna-fake-news', 'Fama / Fortuna / Fake News', '<strong>52 × 52 cm</strong>. En esta pieza, De Aduriz cruza lenguaje, símbolo y crítica contemporánea en una superficie de alto impacto visual. La obra combina humor, tensión gráfica y referencias al dinero, la circulación de imágenes y la distorsión de lo real. <strong>Pieza única</strong>, firmada DDA 2020. <strong>Certificado de autenticidad</strong> incluido.', 'Consultar', '52 x 52 cm', 'Acrílico sobre tela', '2020', FALSE,
    (SELECT id FROM categories WHERE name = 'simbolico'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'fama-fortuna-fake-news'), '/portfolio/sections/obras/fama-fortuna-fake-news-52x52.jpeg', 'fama-fortuna-fake-news-52x52.jpeg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('no-me-veras-llorar-siete-gotitas-negras', 'No me verás llorar / Siete gotitas negras', '<strong>52 × 52 cm</strong>. Una obra de composición austera y gran potencia poética, donde texto y símbolo construyen una imagen directa, casi ritual. De Aduriz trabaja aquí con una economía formal que refuerza el clima de advertencia, ironía y condensación emocional. <strong>Pieza única</strong>, firmada y fechada 7-1-20. <strong>Certificado de autenticidad</strong> incluido.', 'Consultar', '52 x 52 cm', 'Acrílico sobre tela', '2020', FALSE,
    (SELECT id FROM categories WHERE name = 'texto'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'no-me-veras-llorar-siete-gotitas-negras'), '/portfolio/sections/obras/no-me-veras-llorar-siete-gotitas-negras-52x52.jpeg', 'no-me-veras-llorar-siete-gotitas-negras-52x52.jpeg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('supervision-superhabit', 'Supervisión / Superhabit', '<strong>54 × 50 cm</strong> de <strong>acrílico sobre tela</strong> (<strong>2020</strong>). Una pieza donde escritura, diagrama y símbolo se integran en una estructura visual rigurosa y enigmática. Aduriz despliega un lenguaje propio, entre lo místico, lo gráfico y lo conceptual, con una presencia visual clara y singular. <strong>Pieza única</strong>, firmada DDA 2020. <strong>Certificado de autenticidad</strong> incluido.', 'Consultar', '54 x 50 cm', 'Acrílico sobre tela', '2020', FALSE,
    (SELECT id FROM categories WHERE name = 'simbolico'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'supervision-superhabit'), '/portfolio/sections/obras/supervision-superhabit-54x50-pastel-tiza-sobre-telas.jpeg', 'supervision-superhabit-54x50-pastel-tiza-sobre-telas.jpeg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('escriturismo-para-los-dias-de-calor', 'Escriturismo para los días de calor', '<strong>57 × 37 cm</strong> de <strong>óleo sobre puerta de madera</strong> (<strong>2024</strong>). Una pieza donde la palabra se vuelve imagen, ritmo y desvío. De Aduriz trabaja sobre una puerta intervenida como si fuera un umbral entre escritura, humor y pintura. Las asociaciones verbales y los cruces de sentido construyen una obra de fuerte identidad visual, entre la poesía gráfica y el objeto. <strong>Pieza única</strong>, firmada DDA 2024. <strong>Certificado de autenticidad</strong> incluido.', 'Consultar', '57 x 37 cm', 'Óleo sobre puerta de madera', '2020', FALSE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'escriturismo-para-los-dias-de-calor'), '/portfolio/sections/obras/escriturismo-para los-dias-de-calor-57x37-oleo-sobre-puerta-de-madera.jpg', 'escriturismo-para los-dias-de-calor-57x37-oleo-sobre-puerta-de-madera.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('estiercol-en-grageas-por-si-las-moscas', 'Estiércol en grageas (por si las moscas)', '<strong>57 × 37 cm</strong> de <strong>óleo sobre puerta de madera</strong>. En esta obra, De Aduriz vuelve a usar la palabra como materia visual y crítica. Sobre una puerta pintada en turquesa, despliega pares, equívocos y asociaciones que mezclan ironía, cultura popular y tensión conceptual. El resultado es una pieza singular, directa y cargada de humor. <strong>Pieza única</strong>, firmada. <strong>Certificado de autenticidad</strong> incluido.', 'Consultar', '57 x 37 cm', 'Óleo sobre puerta de madera', '2020', FALSE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'estiercol-en-grageas-por-si-las-moscas'), '/portfolio/sections/obras/estiercol-en-grageas-57x37-oleo-sobre-puerta-de-madera.jpg', 'estiercol-en-grageas-57x37-oleo-sobre-puerta-de-madera.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('paisaje-con-angel-verde-fumando-dos-gatos-y-aliento-divino', 'Paisaje con ángel verde fumando, dos gatos y aliento divino', '<strong>51 × 26 cm</strong> de <strong>marcadores y lápiz sobre papel</strong>. Un paisaje horizontal que despliega un universo completo: dos gatos — uno marrón grande con ojos de distintos colores a la izquierda, otro azul etéreo flotando en el centro —, un ángel verde fumando en el medio campo, una arquitectura gótica naranja, un arcoiris denso y matérico, una bailarina blanca y negra, y un pino verde al fondo derecho. Todo convive sin jerarquía, como si el papel fuera un territorio donde cualquier cosa puede existir junto a cualquier otra. El reverso de la obra también está intervenido: una nube con el título escrito a mano, dos ojos y un pequeño gato dormido — un segundo cuadro dentro del mismo soporte. <strong>Pieza única</strong>, con reverso intervenido. <strong>Certificado de autenticidad</strong> incluido.', 'Consultar', '51 x 26 cm', 'Marcadores y lápiz sobre papel', '2021', FALSE,
    (SELECT id FROM categories WHERE name = 'paisaje'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'paisaje-con-angel-verde-fumando-dos-gatos-y-aliento-divino'), '/portfolio/sections/obras/paisaje-con-angel-verde-fumando-dos-gatos-y-aliento-divino-51x26.jpeg', 'paisaje-con-angel-verde-fumando-dos-gatos-y-aliento-divino-51x26.jpeg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('pax-aeterna', 'Pax æterna', '<strong>50 × 36 cm</strong> de <strong>marcadores blancos sobre papel negro</strong> (<strong>2021</strong>). Fechada el 30 de diciembre de 2021, firmada DDA. Una figura central — mezcla de payaso, robot y ser ceremonial — proclama PAX desde un globo de diálogo. El fondo negro actúa como cielo nocturno o pizarrón: la línea blanca brilla con la misma energía que tiene un trazo hecho de una sola vez, sin correcciones. A su alrededor, símbolos personales del artista: una estrella de cinco puntas, un triángulo con ojo, signos que parecen jeroglíficos propios, una escalera. Una obra íntima y festiva al mismo tiempo — hecha en los últimos días del año, con la calma y la precisión que solo aparece cuando se está muy seguro de lo que se hace. <strong>Pieza única</strong>, firmada y fechada. <strong>Certificado de autenticidad</strong> incluido.', 'Consultar', '50 x 36 cm', 'Marcadores sobre papel', '2021', FALSE,
    (SELECT id FROM categories WHERE name = 'obras'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'pax-aeterna'), '/portfolio/sections/obras/Pax-æterna-50x36-2021.jpeg', 'Pax-æterna-50x36-2021.jpeg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('convivencia-pacifica-marcadores', 'Convivencia pacífica (marcadores)', '<strong>50 × 34 cm</strong> de <strong>marcadores sobre papel</strong>. Un papel que no tiene miedo al vacío: cada centímetro está habitado por alguna criatura, planta, símbolo o pequeño acontecimiento. Gnomo, cactus, diamante, gato alado, robot, casas, serpiente — todos conviven sin jerarquía y sin conflicto. Una obra de esas que cuanto más tiempo la mirás, más cosas encontrás. Ideal para un estudio, una habitación infantil o cualquier espacio que necesite energía y humor. <strong>Pieza única</strong>, firmada. <strong>Certificado de autenticidad</strong> incluido.', 'Consultar', '50 x 34 cm', 'Marcadores sobre papel', '2020', FALSE,
    (SELECT id FROM categories WHERE name = 'ilustraciones'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'convivencia-pacifica-marcadores'), '/portfolio/sections/obras/convivencia-pacifica-marcadores-sobre-papel.png', 'convivencia-pacifica-marcadores-sobre-papel.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('naturaleza-artistica-con-lapiz-y-montana', 'Naturaleza artística con lápiz y montaña', '<strong>50 × 34 cm</strong> de <strong>lápiz y marcadores sobre papel</strong>. En primer plano una montaña o criatura marrón enorme, sonriente, cubierta de flores — con un diamante morado en la cabeza. A su lado, una figura amarilla más delicada. Atrás, una cinta roja que recorre todo el plano, un ángel fumando, un fantasma, casas, árboles con cara. La mezcla de lápiz y marcador crea capas de densidad diferentes: lo construido a mano convive con lo gestual. Una obra de esas que tienen su propia lógica interna. <strong>Pieza única</strong>, firmada. <strong>Certificado de autenticidad</strong> incluido.', 'Consultar', '50 x 34 cm', 'Lápiz y marcadores sobre papel', '2020', FALSE,
    (SELECT id FROM categories WHERE name = 'ilustraciones'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'naturaleza-artistica-con-lapiz-y-montana'), '/portfolio/sections/obras/naturaleza-artistica-con-lapiz-y-montaña-lapiz-sobre-papel.png', 'naturaleza-artistica-con-lapiz-y-montaña-lapiz-sobre-papel.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('paisaje-con-dialogo-misterioso', 'Paisaje con diálogo misterioso', '<strong>50 × 34 cm</strong> de <strong>marcadores sobre papel</strong>. Un paisaje que mezcla lo doméstico con lo inexplicable: casas rosadas, un arcoiris, montañas verdes, olas azules — y en el medio, escrita a mano con flecha, la palabra <em>clarovidencia</em>. En el ángulo superior derecho, un objeto volador no identificado. El diálogo del título no está en ningún globo de texto — está entre los elementos, en la tensión entre lo cotidiano y lo extraño. <strong>Pieza única</strong>, firmada. <strong>Certificado de autenticidad</strong> incluido.', 'Consultar', '50 x 34 cm', 'Marcadores sobre papel', '2020', FALSE,
    (SELECT id FROM categories WHERE name = 'paisajes'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'paisaje-con-dialogo-misterioso'), '/portfolio/sections/obras/paisaje-con-dialogo-misterioso-marcadores-sobre-papel.png', 'paisaje-con-dialogo-misterioso-marcadores-sobre-papel.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('paisaje-regio-lapiz-marcadores', 'Paisaje regio', '<strong>50 × 34 cm</strong> de <strong>lápiz y marcadores sobre papel</strong> (<strong>2020</strong>). Composición vertical, firmada DDA 2020. Un pájaro rojo grande con ojo ocupa el centro — mitad criatura, mitad forma abstracta. A la izquierda, un robot o marioneta dibujado en violeta con articulaciones visibles. Abajo, un pequeño pueblo volcánico y la inscripción 칸누 en coreano. Una obra que cruza culturas y registros sin esfuerzo, con la soltura que solo da años de dibujo. <strong>Pieza única</strong>, firmada. <strong>Certificado de autenticidad</strong> incluido.', 'Consultar', '50 x 34 cm', 'Lápiz y marcadores sobre papel', '2020', FALSE,
    (SELECT id FROM categories WHERE name = 'paisajes'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'paisaje-regio-lapiz-marcadores'), '/portfolio/sections/obras/paisaje-regio-lapiz-marcadores-sobre-papel.png', 'paisaje-regio-lapiz-marcadores-sobre-papel.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('autorretrato-con-mo-o', 'Autorretrato con moño', '<strong>82 × 56 cm</strong> de <strong>pastel al óleo sobre madera</strong> (<strong>2025</strong>). El moño como gesto: un accesorio que en manos de De Aduriz se convierte en declaración de identidad. Este autorretrato reciente continúa la serie de autorretratos del artista con una presencia directa y desafiante — la mirada al frente, el adorno como escudo y comme performance. El <strong>pastel al óleo sobre madera</strong> aporta una textura densa y luminosa que el lienzo no permitiría. <strong>Obra nueva</strong>, disponible con <strong>certificado de autenticidad</strong>.', 'Consultar', '82 x 56 cm', 'Pastel al óleo sobre madera', '2025', FALSE,
    (SELECT id FROM categories WHERE name = 'Autorretratos'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'autorretrato-con-mo-o'), '/portfolio/sections/obras/autorretrato-con-moño-2025-82x56.png', 'autorretrato-con-moño-2025-82x56.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('gato-blanco-nuevo', 'Gato Blanco Nuevo', '<strong>69 × 59 cm</strong> de <strong>pastel al óleo sobre puerta de chapa</strong> (<strong>2025</strong>). Un gato blanco sobre una puerta de chapa intervenida — el soporte industrial en tensión con la delicadeza del animal. El blanco aquí no es ausencia sino todo lo contrario: densidad, luz propia, presencia que domina el espacio. Una de las piezas más recientes del artista, donde el objeto cotidiano (la puerta) se convierte en campo pictórico. <strong>Pieza única</strong> con <strong>certificado de autenticidad</strong>.', 'Consultar', '69 x 59 cm', 'Pastel al óleo sobre puerta de chapa', '2025', FALSE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'gato-blanco-nuevo'), '/portfolio/sections/obras/Gato-Blanco-Nuevo-2025-69x59.png', 'Gato-Blanco-Nuevo-2025-69x59.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('gato-11-11', 'Gato 11:11', '<strong>69 × 30 cm</strong> de <strong>pastel al óleo sobre madera</strong> (<strong>2025</strong>). El 11:11 es el momento del deseo, el instante en que el tiempo se duplica y se abre una ventana. Un gato en ese umbral: mitad aquí, mitad en otra dimensión. El formato vertical y angosto de la obra refuerza esa sensación de portal, de pasaje. Una pieza cargada de sincronías para quienes creen en ellas — y de belleza pura para quienes no. Disponible con <strong>certificado de autenticidad</strong>.', 'Consultar', '69 x 30 cm', 'Pastel al óleo sobre madera', '2025', FALSE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'gato-11-11'), '/portfolio/sections/obras/gato-11-11-2025-69x30.png', 'gato-11-11-2025-69x30.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('convivencia-pacifica', 'Convivencia pacífica', '<strong>40 × 30 cm</strong> de <strong>pastel al óleo sobre tela</strong> (<strong>2024</strong>). En el universo de Aduriz conviven figuras que en otra parte serían incompatibles: lo humano y lo animal, lo cósmico y lo doméstico, el humor y la profundidad. Esta obra lo condensa en un formato íntimo — <strong>40 × 30 cm</strong> que caben en cualquier espacio pero que generan una conversación silenciosa con quien los habita. Ideal como primera obra o como pieza de una colección en crecimiento. <strong>Certificado de autenticidad</strong> incluido.', 'Consultar', '40 x 30 cm', 'Pastel al óleo sobre tela', '2024', FALSE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'convivencia-pacifica'), '/portfolio/sections/obras/convivencia-pacifica-2024-40x30.png', 'convivencia-pacifica-2024-40x30.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('gato-alfa-omega', 'Gato Alfa & Omega', '<strong>60 × 40 cm</strong> de <strong>pastel al óleo sobre chapa</strong> (<strong>2025</strong>). El principio y el fin en un mismo animal. El gato como figura que contiene todas las posibilidades — el alfa que abre y el omega que cierra. La chapa como soporte le da a esta obra una materialidad cruda y contemporánea que contrasta con la suavidad del pastel al óleo. Una pieza que funciona igual en un espacio doméstico que en uno institucional. <strong>Obra nueva</strong> 2025, con <strong>certificado de autenticidad</strong>.', 'Consultar', '60 x 40 cm', 'Pastel al óleo sobre chapa', '2025', FALSE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'gato-alfa-omega'), '/portfolio/sections/obras/gato-alfa-&-omega-2025-60x40.png', 'gato-alfa-&-omega-2025-60x40.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('pitufex', 'Pitufex', '<strong>46 × 36 cm</strong> de <strong>pastel al óleo sobre puerta de madera</strong> pequeña (<strong>2025</strong>). El nombre es un invento — mitad Pitufina, mitad Pyrex, mitad ninguna de las dos. Una figura que escapa a las categorías conocidas y habita su propio universo con total convicción. La puerta pequeña como soporte convierte esta obra en un objeto que es pintura y escultura al mismo tiempo: tiene frente, tiene cuerpo, tiene historia. Una de las piezas más singulares de la producción reciente de De Aduriz. <strong>Certificado de autenticidad</strong> incluido.', 'Consultar', '46 x 36 cm', 'Pastel al óleo sobre puerta de madera pequeña', '2025', FALSE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'pitufex'), '/portfolio/sections/obras/pitufex-2025-46x36.png', 'pitufex-2025-46x36.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('andromeda', 'Andrómedan', 'Puerta intervenida de doble cara: anverso en pastel azul eléctrico con figura cósmica andrógina coronada con el número 7; reverso en madera desnuda con cadena de palabras en tiza que mutan entre idiomas hasta terminar en Twice upon a time. <strong>Objeto único</strong>. Se ofrece a restaurar.', 'Consultar', '170 x 50 cm', 'Pastel al óleo sobre madera', '2025', FALSE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'andromeda'), '/portfolio/sections/obras/andromedan-2025-pastel-tiza-sobre-puerta.png', 'andromedan-2025-pastel-tiza-sobre-puerta.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('belleza-y-felicidad-con-sol-y-luna', 'Belleza y felicidad con sol y luna', 'Una obra que celebra la dualidad: el sol y la luna conviven en un mismo espacio cargado de energía y color. <strong>Pastel tiza</strong> trabajado con una sensibilidad única que define el universo visual de Diego De Aduriz.', 'Consultar', 'Consultar medidas', 'Pastel tiza sobre papel', '2014', TRUE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'belleza-y-felicidad-con-sol-y-luna'), '/portfolio/sections/obras/Belleza-y-felicidad-con-sol-y-luna-2014- pastel-tiz-sobre-papel.png', 'Belleza-y-felicidad-con-sol-y-luna-2014- pastel-tiz-sobre-papel.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('diablo-elegante', 'Diablo elegante', '<strong>100 x 70 cm</strong> de <strong>pastel tiza sobre papel</strong> (<strong>2015</strong>). El diablo elegante no es una figura amenazante — es un ser de pura presencia, casi un dandy del inframundo. <strong>Obra vendida</strong> que muestra la versatilidad del artista para trabajar con humor y profundidad.', 'Consultar', '100 x 70 cm', 'Pastel tiza sobre papel', '2015', TRUE,
    (SELECT id FROM categories WHERE name = 'obras'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'diablo-elegante'), '/portfolio/sections/obras/diablo-elegante-pastel-tiza-sobre-papel-2015.jpg', 'diablo-elegante-pastel-tiza-sobre-papel-2015.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('criatura-que-sopla', 'Criatura que sopla', 'Obra reciente de 2025, pintada sobre madera con pastel al óleo. Una figura enigmática que exhala vida y movimiento. <strong>Pieza única</strong> con reverso trabajado — se entrega con <strong>certificado de autenticidad</strong>.', 'Consultar', '34 x 19 cm', 'Pastel al óleo sobre madera', '2025', FALSE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'criatura-que-sopla'), '/portfolio/sections/obras/criatura-que-sopla-pastel-al-oleo-sobre-madera-2025.png', 'criatura-que-sopla-pastel-al-oleo-sobre-madera-2025.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('rayo-dorado', 'Rayo dorado', '<strong>140 x 82 cm</strong> de pura energía sobre madera. La combinación de aerosol y pastel crea capas de profundidad y luz que cambian según el ángulo de visión. Una obra de gran presencia para espacios que buscan impacto visual.', '$3000 USD', '140 x 82 cm', 'Aerosol y pastel sobre madera', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'paisajes'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'rayo-dorado'), '/portfolio/sections/obras/MG_0312_1.png', 'MG_0312_1.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('paisaje-sol-sonriente', 'Paisaje con sol sonriente', 'Un paisaje que irradia calidez. El sol como protagonista con una expresividad propia del universo simbólico de De Aduriz. Obra en <strong>pastel sobre papel</strong>, delicada y luminosa.', 'Consultar', '80 x 60 cm', 'Pastel sobre papel', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'paisajes'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'paisaje-sol-sonriente'), '/portfolio/sections/obras/paisaje-con-sol-sonriente-pastel-sonre-papel.png', 'paisaje-con-sol-sonriente-pastel-sonre-papel.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('yukito', 'Yukito', 'Un gato de formato íntimo (<strong>33 x 25 cm</strong>) trabajado con <strong>pastel tiza sobre papel</strong>. Ideal para espacios pequeños o como primera obra de colección. La mirada del animal transmite una calma hipnótica.', '$2000 USD', '33 x 25 cm', 'Pastel tiza sobre papel', '2020', FALSE,
    (SELECT id FROM categories WHERE name = 'gatos'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'yukito'), '/portfolio/sections/obras/MG_0327.jpg.png', 'MG_0327.jpg.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('payaso', 'Payaso Iluminado', 'Pintado sobre una puerta de madera real (<strong>51 x 98 cm</strong>), esta obra rompe el límite entre objeto y arte. El acrílico y el pastel óleo se combinan sobre una superficie que ya tiene historia propia. Reverso intervenido — una pieza escultórica tanto como pictórica.', 'Consultar', '51 x 98 cm', 'Acrílico y pastel óleo sobre puerta de madera', '2025', FALSE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'payaso'), '/portfolio/sections/obras/payaso.png', 'payaso.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('ascension', 'Ascensión', 'Una figura que asciende, trabajada en <strong>pastel tiza sobre madera</strong>. La verticalidad de la composición refuerza el movimiento hacia arriba, hacia la luz. Una obra de gran carga simbólica y espiritual.', 'Consultar', '160 x 81 cm', 'Pastel tiza sobre madera', '2025', FALSE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'ascension'), '/portfolio/sections/obras/ascension.png', 'ascension.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('don-diego-explosion', 'Don Diego y los soles en explosión', 'Autorretrato expandido: el artista en medio de una explosión de soles, sobre tela. Una obra autobiográfica y cósmica al mismo tiempo. El <strong>pastel sobre tela</strong> logra una textura rica y vibrante que hay que ver en persona.', 'Consultar', '62 x 42 cm', 'Pastel sobre tela', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'don-diego-explosion'), '/portfolio/sections/obras/don-diego-y-pastel-sobre-explosion-pastel-sobre-tela.png', 'don-diego-y-pastel-sobre-explosion-pastel-sobre-tela.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('do-re-mi-fa', 'Do re mi fa sol la si', 'La música traducida en imagen. Una obra que evoca ritmo y color a partir de las notas de la escala, trabajada en <strong>pastel sobre papel</strong> con la libertad gestual característica de De Aduriz.', 'Consultar', 'Consultar medidas', 'Pastel sobre papel', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'do-re-mi-fa'), '/portfolio/sections/obras/do-re-mi-fa-sol-la-si-pastel-sobre-papel.png', 'do-re-mi-fa-sol-la-si-pastel-sobre-papel.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('gato-arcoiris', 'Gato arcoiris', '<strong>100 x 65 cm</strong> de color puro. Un gato envuelto en el espectro del arcoiris, en <strong>pastel tiza sobre papel</strong>. Una de las obras más celebradas de la serie felina de De Aduriz — festiva, luminosa e imposible de ignorar.', 'Consultar', '100 x 65 cm', 'Pastel tiza sobre papel', '2020', FALSE,
    (SELECT id FROM categories WHERE name = 'gatos'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'gato-arcoiris'), '/portfolio/sections/obras/Diego+de+Aduriz+-+Gato+arcoiris+-+100+x+65+cm+-++pastel+sobre+papel+-+2020.png', 'Diego+de+Aduriz+-+Gato+arcoiris+-+100+x+65+cm+-++pastel+sobre+papel+-+2020.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('gato-con-flor-de-loto', 'Gato con flor de loto', 'Un pequeño gran cuadro: <strong>25 x 18 cm</strong> donde conviven la delicadeza de la flor de loto y la presencia del gato. Formato íntimo, ideal como regalo o primera pieza de colección. <strong>Pastel tiza sobre papel</strong>, 2018.', 'Consultar', '25 x 18 cm', 'Pastel tiza sobre papel', '2018', FALSE,
    (SELECT id FROM categories WHERE name = 'gatos'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'gato-con-flor-de-loto'), '/portfolio/sections/obras/Diego+de+Aduriz+-+Gato+con+flor+de+loto+-+Pastel+tiza+sobre+papel+-+25+x+18+cm+-+2018.png', 'Diego+de+Aduriz+-+Gato+con+flor+de+loto+-+Pastel+tiza+sobre+papel+-+25+x+18+cm+-+2018.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('cartas-a-dios', 'Cartas a Dios', 'Una obra que dialoga con lo sagrado y lo cotidiano. El título sugiere una comunicación directa, íntima, casi imposible — y sin embargo, la imagen la hace posible. Una de las piezas más personales del artista.', 'Consultar', 'Consultar medidas', 'Consultar técnica', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'cartas-a-dios'), '/portfolio/sections/obras/cartas-a-dios.png', 'cartas-a-dios.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('-utorretrato', 'Autorretrato', 'El artista frente a sí mismo. Trabajado en <strong>pastel tiza sobre madera</strong>, este autorretrato captura una mirada introspectiva y directa. <strong>Pieza única</strong> dentro de la serie de autorretratos de De Aduriz.', 'Consultar', 'Consultar medidas', 'Pastel tiza sobre madera', '2025', FALSE,
    (SELECT id FROM categories WHERE name = 'Autorretratos'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = '-utorretrato'), '/portfolio/sections/obras/autorretrato.png', 'autorretrato.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('-utorretrato-2007', 'Autorretrato', '<strong>110 x 150 cm</strong> en <strong>marcadores sobre papel</strong> — una de las obras más tempranas y sorprendentes del artista (<strong>2007</strong>). La escala y la técnica inusual hacen de esta pieza un documento histórico dentro de su obra.', 'Consultar', '110 x 150 cm', 'Marcadores sobre papel', '2007', TRUE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = '-utorretrato-2007'), '/portfolio/sections/obras/Diego+de+Aduriz+-+Autorretrato+-+110+x+150+cm+-+Marcadores+sobre+papel+-+2007.jpg', 'Diego+de+Aduriz+-+Autorretrato+-+110+x+150+cm+-+Marcadores+sobre+papel+-+2007.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('carta-7', 'Carta 7', 'Una obra monumental: <strong>150 x 200 cm</strong> de aerosol, acrílico y <strong>pastel sobre tela</strong> (<strong>2022</strong>). La superposición de técnicas crea un campo pictórico denso y vibrante. Una de las piezas más ambiciosas y recientes de Aduriz — ideal para espacios de gran escala.', 'Consultar', '150 x 200 cm', 'Aerosol, acrílico, pastel sobre tela', '2022', FALSE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'carta-7'), '/portfolio/sections/obras/carta-7-aeresol, acrilico, pastel sobre tela.png', 'carta-7-aeresol, acrilico, pastel sobre tela.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('retrato-1', 'Autorretrato con collar', 'Un autorretrato que juega con la identidad y el adorno. El collar como elemento de poder y vulnerabilidad al mismo tiempo. <strong>Pastel al óleo sobre madera</strong> con una presencia que no pasa desapercibida.', 'Consultar', 'Consultar medidas', 'Pastel al óleo sobre madera', '2025', FALSE,
    (SELECT id FROM categories WHERE name = 'Autorretratos'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'retrato-1'), '/portfolio/sections/obras/retrato-1.png', 'retrato-1.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('retrato-2', 'Autorretrato con máscara de gato', 'Entre humano y animal, entre persona y personaje. El artista usa la máscara de gato para explorar otra identidad posible. Una obra cargada de humor, misterio y profundidad. <strong>Pastel al óleo sobre madera</strong>.', 'Consultar', '155 x 64 cm', 'Pastel al óleo sobre madera', '2025', FALSE,
    (SELECT id FROM categories WHERE name = 'Autorretratos'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'retrato-2'), '/portfolio/sections/obras/retrato-2.jpeg', 'retrato-2.jpeg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('the-future-is-stupid', 'The future is stupid', '<strong>50 x 35 cm</strong> de ironía y color (<strong>2015</strong>). Una obra que envejeció muy bien — su título resuena hoy más que nunca. <strong>Técnica mixta sobre papel</strong> con la gestualidad directa de Aduriz. Para los que coleccionan arte con punto de vista.', '$2000 USD', '50 x 35 cm', 'Técnica mixta sobre papel', '2015', FALSE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'the-future-is-stupid'), '/portfolio/sections/obras/Diego+de+Aduriz+-+The+future+is+stupid+-+tecnica+mixta+sobre+papel+-+50+x+35+cm+-+2015.png', 'Diego+de+Aduriz+-+The+future+is+stupid+-+tecnica+mixta+sobre+papel+-+50+x+35+cm+-+2015.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('abecedario', 'Abecedario', '<strong>150 x 100 cm</strong> donde el lenguaje se vuelve imagen. Las letras del abecedario se transforman en un campo pictórico vivo, trabajado en <strong>pastel y acrílico sobre tela</strong> (<strong>2021</strong>). Una obra que habla del origen de todo: las palabras, la comunicación, el arte mismo.', '$2500 USD', '150 x 100 cm', 'Pastel y acrílico sobre tela', '2021', FALSE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'abecedario'), '/portfolio/sections/obras/Diego+de+Aduriz+-+Abecedario+-+150+x+100+cm+-+Pastel+y+acrilico+sobre+tela+-+2021.png', 'Diego+de+Aduriz+-+Abecedario+-+150+x+100+cm+-+Pastel+y+acrilico+sobre+tela+-+2021.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('sin-titulo', 'Sin titulo', '<strong>34 x 24 cm</strong> de <strong>técnica mixta sobre papel</strong> (<strong>2012</strong>). Una obra temprana que muestra la voz en formación: gestual, instintiva, sin concesiones. Para los que quieren seguir la trayectoria del artista desde sus inicios.', 'Consultar', '34 x 24 cm', 'Técnica mixta sobre papel', '2012', FALSE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'sin-titulo'), '/portfolio/sections/obras/Diego+de+Aduriz+-+Sin+titulo+-+Tecnica+mixta+sobre+papel+-+34+x+24+cm+-+2012.png', 'Diego+de+Aduriz+-+Sin+titulo+-+Tecnica+mixta+sobre+papel+-+34+x+24+cm+-+2012.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('mi-cuerpo-electrico-24', 'ULTRAVIOLETA/INFRARROJO', '<strong>114 x 114 cm</strong> cuadrados de <strong>acrílico y aerosol sobre madera</strong> (<strong>2020</strong>). Un formato perfecto, una paleta extrema. La obra vibra entre longitudes de onda invisibles al ojo humano — pero el arte las hace visibles.', 'Consultar', '114 x 114 cm', 'Acrílico y aerosol sobre madera', '2020', FALSE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'mi-cuerpo-electrico-24'), '/portfolio/sections/obras/micuerpo.jpg', 'micuerpo.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('mi-cuerpo-electrico-29', 'Séptimo rayo', 'Una obra de gran escala (<strong>160 x 200 cm</strong>) en <strong>pastel y acrílico sobre tela</strong> (<strong>2021</strong>). El séptimo rayo como metáfora de la transformación — una energía que atraviesa y cambia todo lo que toca. Pieza central para una colección o espacio de gran envergadura.', 'Consultar', '160 x 200 cm', 'Pastel y acrílico sobre tela', '2021', FALSE,
    (SELECT id FROM categories WHERE name = 'paisajes'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'mi-cuerpo-electrico-29'), '/portfolio/sections/obras/Diego+de+Aduriz+-+Mi+cuerpo+electrico+29+160+x+200+-+Pastel+y+acrilico+sobre+tela+-+2021.jpg', 'Diego+de+Aduriz+-+Mi+cuerpo+electrico+29+160+x+200+-+Pastel+y+acrilico+sobre+tela+-+2021.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('sin-titulo-3', 'Sin título', 'Una obra que habla por sí sola, sin necesitar nombre. La ausencia de título es una invitación a proyectar el significado propio. Disponible para consulta.', 'Consultar', 'Consultar medidas', 'Consultar técnica', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'sin-titulo-3'), '/portfolio/sections/obras/sin-título.png', 'sin-título.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('dibu-10', 'Paisaje con Flor y Hombre Plateado', 'Un paisaje de bolsillo con protagonistas insólitos: una flor y un hombre plateado que conviven en la misma escena. <strong>Técnica mixta sobre papel</strong>, pequeño formato, gran imaginación.', '14 USD', 'Consultar medidas', 'Técnica mixta sobre papel', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'paisajes'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'dibu-10'), '/Ilustrates/dibu10.jpg', 'dibu10.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('obra-sin-titulo', 'ESTE ES UN LUGAR SAGRADO', 'El título lo dice todo — y la imagen lo confirma. Una obra de <strong>técnica mixta</strong> que invoca la sacralidad del espacio pictórico. Para quienes buscan arte con intención y presencia.', 'Consultar', '114 x 85 cm', 'Técnica mixta', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'obra-sin-titulo'), '/portfolio/sections/obras/IMG_0402+copia.jpg', 'IMG_0402+copia.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('obra-sin-titulo-mg-0329', 'Paisaje con duende', 'Un paisaje habitado por una presencia mágica. El duende aparece integrado a la naturaleza, como si siempre hubiera estado ahí. <strong>Pastel tiza sobre papel</strong> con la ternura y el misterio característicos de Aduriz.', 'Consultar', '40 x 30 cm', 'Pastel tiza sobre papel', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'obra-sin-titulo-mg-0329'), '/portfolio/sections/obras/MG_0329.png', 'MG_0329.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('4-cabezas', 'Cuatro cabezas', 'Cuatro personalidades, cuatro miradas, un mismo plano. Una obra que multiplica la presencia y genera un diálogo silencioso entre figuras. <strong>Pastel sobre papel</strong> con composición densa y expresiva.', 'Consultar', 'Consultar medidas', 'Pastel sobre papel', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = '4-cabezas'), '/portfolio/sections/obras/4-cabezas-pastel-sobre-papel.png', '4-cabezas-pastel-sobre-papel.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('paisaje-teorico', 'Paisaje teórico', '<strong>24 x 34 cm</strong> de <strong>técnica mixta sobre papel</strong> (<strong>2009</strong>). Un paisaje que no existe en la naturaleza sino en la mente — construido con lógica propia, colores imposibles y una coherencia que solo el arte puede lograr.', 'Consultar', '24 x 34 cm', 'Técnica mixta sobre papel', '2009', FALSE,
    (SELECT id FROM categories WHERE name = 'paisajes'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'paisaje-teorico'), '/portfolio/sections/obras/Diego+de+Aduriz+-+Paisaje+teorico+-+Tecnica+mixta+sobre+papel+-+24+x+34+cm+-+2009.png', 'Diego+de+Aduriz+-+Paisaje+teorico+-+Tecnica+mixta+sobre+papel+-+24+x+34+cm+-+2009.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('paisaje-con-oso', 'Paisaje con oso', '<strong>140 x 125 cm</strong> de <strong>aerosol y pastel sobre madera</strong>. Un oso en un paisaje que lo contiene y lo celebra — monumental como el animal, libre como la técnica. Una de las piezas más potentes del catálogo.', '$2500 USD', '140 x 125 cm', 'Aerosol y pastel sobre madera', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'paisajes'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'paisaje-con-oso'), '/portfolio/sections/obras/MG_0307.png', 'MG_0307.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('cuarto-creciente', 'Cuarto creciente', 'La luna en su fase de crecimiento como tema y como forma. <strong>Pastel sobre tela</strong> con una paleta nocturna y una energía expansiva. Una obra que cambia con la luz del espacio donde se instale.', 'Consultar', '52 x 31 cm', 'Pastel sobre tela', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'cuarto-creciente'), '/portfolio/sections/obras/cuarto-creciente-pastel-sobre-tela.png', 'cuarto-creciente-pastel-sobre-tela.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('gato-merlin', 'Gato Merlín', 'La obra más grande e icónica de la serie felina: <strong>205 x 210 cm</strong> de <strong>pastel sobre tela</strong>. Merlín no es un gato — es una presencia. Una obra de museo que domina cualquier espacio con autoridad y carisma. Para coleccionistas que buscan una pieza central e irrepetible.', '$5000 USD', '205 x 210 cm', 'Pastel sobre tela', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'gatos'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'gato-merlin'), '/portfolio/sections/obras/MG_1192.jpg', 'MG_1192.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('paisaje-con-mascara-i', 'Paisaje con máscara I', '<strong>182 x 102 cm</strong> de <strong>pintura y collage sobre tela</strong>. La máscara aparece como elemento extraño y necesario al mismo tiempo — flotando en un paisaje que la absorbe sin explicarla. Una obra que genera preguntas.', '$3000 USD', '182 x 102 cm', 'Pintura y collage sobre tela', '2020', FALSE,
    (SELECT id FROM categories WHERE name = 'paisajes'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'paisaje-con-mascara-i'), '/portfolio/sections/obras/mascara2.jpg', 'mascara2.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('gato-cosmico', 'Gato cósmico', '<strong>80 x 110 cm</strong> de <strong>pastel tiza</strong> (<strong>2013</strong>). Un gato que trasciende lo terrestre y ocupa el cosmos como si le perteneciera. <strong>Obra vendida</strong> — si te interesa una pieza similar, escribinos.', 'Consultar', '80 x 110 cm', 'Pastel tiza', '2013', TRUE,
    (SELECT id FROM categories WHERE name = 'gatos'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'gato-cosmico'), '/portfolio/sections/obras/Diego+de+Aduriz+-+Gato+cosmico+-+Pastel+tiza+-+80+x+110+cm+2013.jpeg', 'Diego+de+Aduriz+-+Gato+cosmico+-+Pastel+tiza+-+80+x+110+cm+2013.jpeg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('paisaje-con-mascara-ii', 'Paisaje con máscara II', 'La segunda entrega de la serie de máscaras en paisajes. <strong>Pintura y collage sobre tela</strong> — la máscara como segundo rostro del territorio. Una obra que dialoga con la primera y puede exhibirse junto a ella.', 'Consultar', '182 x 102 cm', 'Pintura y collage sobre tela', '2020', FALSE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'paisaje-con-mascara-ii'), '/portfolio/sections/obras/mascara1.jpg', 'mascara1.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('paisaje-azul-collage', 'Paisaje azul', 'Collage de atmósfera serena y profunda. El azul domina y unifica una composición construida con fragmentos que juntos forman un territorio propio. Una obra contemplativa para espacios que buscan calma.', 'Consultar', 'Consultar medidas', 'Collage', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'paisajes'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'paisaje-azul-collage'), '/portfolio/sections/obras/paisaje-azul-collage.png', 'paisaje-azul-collage.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('paisaje-con-monstruo-amistoso', 'Paisaje con monstruo amistoso', '<strong>24 x 34 cm</strong> de <strong>lápiz sobre papel</strong> (<strong>2011</strong>). El monstruo aquí no da miedo — es parte del paisaje, casi un vecino. Una obra tierna y precisa que muestra el universo de Aduriz desde sus fundamentos gráficos.', 'Consultar', '24 x 34 cm', 'Lápiz sobre papel', '2011', FALSE,
    (SELECT id FROM categories WHERE name = 'paisajes'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'paisaje-con-monstruo-amistoso'), '/portfolio/sections/obras/Diego+de+Aduriz+-+Piasaje+con+monstruo+amistoso+-+Lapiz+sobre+papel+-+24+x+34+cm+-+2011.jpeg', 'Diego+de+Aduriz+-+Piasaje+con+monstruo+amistoso+-+Lapiz+sobre+papel+-+24+x+34+cm+-+2011.jpeg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('luz-azul', 'LUZAZUL', '<strong>180 x 210 cm</strong> de acrílico y <strong>pastel tiza</strong> sobre tela (<strong>2015</strong>). Una obra que llena una habitación de luz azul — una presencia física, casi meteorológica. De las obras más importantes y de mayor escala del artista.', 'Consultar', '180 x 210 cm', 'Acrílico y pastel tiza sobre tela', '2015', FALSE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'luz-azul'), '/portfolio/sections/obras/luz_azul.jpg', 'luz_azul.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('gato-celeste', 'Gato celeste', '<strong>35 x 25 cm</strong> de <strong>pastel tiza sobre papel</strong> — pequeño, intenso, celestial. El gato celeste flota entre el cielo y la tierra con una gracia que solo el pastel puede capturar así. Ideal como primera obra o regalo para amantes del arte y los gatos.', '$1500 USD', '35 x 25 cm', 'Pastel tiza sobre papel', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'gatos'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'gato-celeste'), '/portfolio/sections/obras/MG_0327.jpg', 'MG_0327.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('puerta-azul', 'Puerta Azul', '<strong>210 x 92 cm</strong> de pintura y <strong>pastel tiza sobre madera</strong> (<strong>2015–2017</strong>). Una puerta real convertida en umbral simbólico — azul como el cielo, como el agua, como lo que está del otro lado. <strong>Obra vendida</strong> que dejó huella.', 'Consultar', '210 x 92 cm', 'Pintura y pastel tiza sobre madera', '2015', TRUE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'puerta-azul'), '/portfolio/sections/obras/Diego+de+Aduriz+-+Puerta+Azul+-+210+x+92+cm+-+Pintura+y+pastel+tiza+sobre+madera+-+2015_2017.jpeg', 'Diego+de+Aduriz+-+Puerta+Azul+-+210+x+92+cm+-+Pintura+y+pastel+tiza+sobre+madera+-+2015_2017.jpeg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('puerta-1', 'Espíritu (Humito)', '<strong>80 x 195 cm</strong> de <strong>acrílico y pastel óleo sobre puerta de madera</strong> (<strong>2018</strong>). El espíritu emerge como humito — liviano, efímero, irresistible. El soporte puerta le da una dimensión corporal única: esta obra tiene la escala de una persona.', 'Consultar', '80 x 195 cm', 'Acrílico y pastel óleo sobre puerta / Técnica mixta sobre madera', '2018', FALSE,
    (SELECT id FROM categories WHERE name = 'pasteles'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'puerta-1'), '/portfolio/sections/obras/puerta-1-espiritu(humite)-tecnica-pastel-sobre-puerta-tecnoca-mixta-sobre-madera.png', 'puerta-1-espiritu(humite)-tecnica-pastel-sobre-puerta-tecnoca-mixta-sobre-madera.png', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('dibu-1', 'Diábolo', 'Ilustración original en <strong>técnica mixta sobre papel</strong>. Pequeño formato coleccionable, firmado por el artista. Ideal para iniciar una colección accesible.', '12 USD', 'Consultar medidas', 'Técnica mixta sobre papel', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'ilustraciones'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'dibu-1'), '/Ilustrates/dibu1.jpg', 'dibu1.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('dibu-2', 'Ilustración #2', 'Ilustración original en <strong>técnica mixta sobre papel</strong>. <strong>Pieza única</strong>, firmada. Una forma accesible de tener una obra original de Diego De Aduriz.', '22 USD', 'Consultar medidas', 'Técnica mixta sobre papel', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'ilustraciones'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'dibu-2'), '/Ilustrates/dibu2.jpg', 'dibu2.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('dibu-3', 'Ilustración #3', 'Ilustración original en <strong>técnica mixta sobre papel</strong>. <strong>Pieza única</strong> y firmada — arte original a precio de entrada.', '8 USD', 'Consultar medidas', 'Técnica mixta sobre papel', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'ilustraciones'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'dibu-3'), '/Ilustrates/dibu3.jpg', 'dibu3.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('dibu-4', 'Ilustración #4', 'Ilustración original en <strong>técnica mixta sobre papel</strong>. <strong>Pieza única</strong>, firmada por el artista.', '15 USD', 'Consultar medidas', 'Técnica mixta sobre papel', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'ilustraciones'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'dibu-4'), '/Ilustrates/dibu4.jpg', 'dibu4.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('dibu-5', 'Ilustración #5', 'Ilustración original en <strong>técnica mixta sobre papel</strong>. <strong>Pieza única</strong>, firmada por el artista.', '19 USD', 'Consultar medidas', 'Técnica mixta sobre papel', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'ilustraciones'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'dibu-5'), '/Ilustrates/dibu5.jpg', 'dibu5.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('dibu-6', 'Ilustración #6', 'Ilustración original en <strong>técnica mixta sobre papel</strong>. <strong>Pieza única</strong>, firmada por el artista.', '6 USD', 'Consultar medidas', 'Técnica mixta sobre papel', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'ilustraciones'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'dibu-6'), '/Ilustrates/dibu6.jpg', 'dibu6.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('dibu-7', 'Ilustración #7', 'Ilustración original en <strong>técnica mixta sobre papel</strong>. <strong>Pieza única</strong>, firmada por el artista.', '24 USD', 'Consultar medidas', 'Técnica mixta sobre papel', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'ilustraciones'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'dibu-7'), '/Ilustrates/dibu7.jpg', 'dibu7.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('dibu-8', 'Ilustración #8', 'Ilustración original en <strong>técnica mixta sobre papel</strong>. <strong>Pieza única</strong>, firmada por el artista.', '11 USD', 'Consultar medidas', 'Técnica mixta sobre papel', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'ilustraciones'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'dibu-8'), '/Ilustrates/dibu8.jpg', 'dibu8.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('dibu-9', 'Ilustración #9', 'Ilustración original en <strong>técnica mixta sobre papel</strong>. <strong>Pieza única</strong>, firmada por el artista.', '20 USD', 'Consultar medidas', 'Técnica mixta sobre papel', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'ilustraciones'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'dibu-9'), '/Ilustrates/dibu9.jpg', 'dibu9.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('dibu-11', 'Diábolo 1', 'Ilustración original en <strong>técnica mixta sobre papel</strong>. <strong>Pieza única</strong>, firmada por el artista.', '9 USD', 'Consultar medidas', 'Técnica mixta sobre papel', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'ilustraciones'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'dibu-11'), '/Ilustrates/dibu11.jpg', 'dibu11.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('dibu-12', 'Paisaje fenomenal', 'Un paisaje que merece su nombre. Ilustración original en <strong>técnica mixta sobre papel</strong> — pequeño formato, gran universo.', '25 USD', 'Consultar medidas', 'Técnica mixta sobre papel', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'ilustraciones'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'dibu-12'), '/Ilustrates/dibu12.jpg', 'dibu12.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('dibu-14', 'Diábolo 4', 'Ilustración original en <strong>técnica mixta sobre papel</strong>. <strong>Pieza única</strong>, firmada por el artista.', '7 USD', 'Consultar medidas', 'Técnica mixta sobre papel', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'ilustraciones'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'dibu-14'), '/Ilustrates/dibu14.jpg', 'dibu14.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('dibu-15', 'Diábolo 5', 'Ilustración original en <strong>técnica mixta sobre papel</strong>. <strong>Pieza única</strong>, firmada por el artista.', '18 USD', 'Consultar medidas', 'Técnica mixta sobre papel', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'ilustraciones'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'dibu-15'), '/Ilustrates/dibu15.jpg', 'dibu15.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('dibu-16', 'Diábolo 6', 'Ilustración original en <strong>técnica mixta sobre papel</strong>. <strong>Pieza única</strong>, firmada por el artista.', '23 USD', 'Consultar medidas', 'Técnica mixta sobre papel', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'ilustraciones'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'dibu-16'), '/Ilustrates/dibu16.jpg', 'dibu16.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('dibu-19', 'Diábolo 9', 'Ilustración original en <strong>técnica mixta sobre papel</strong>. <strong>Pieza única</strong>, firmada por el artista.', '16 USD', 'Consultar medidas', 'Técnica mixta sobre papel', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'ilustraciones'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'dibu-19'), '/Ilustrates/dibu19.jpg', 'dibu19.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('dibu-20', 'Ilustración #20', 'Ilustración original en <strong>técnica mixta sobre papel</strong>. <strong>Pieza única</strong>, firmada por el artista.', '13 USD', 'Consultar medidas', 'Técnica mixta sobre papel', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'ilustraciones'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'dibu-20'), '/Ilustrates/dibu20.jpg', 'dibu20.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('digital-artwork-1', 'Digital Artwork #1', 'Obra digital original. Impresión de alta calidad disponible en <strong>30 x 40 cm</strong>. El arte digital de Aduriz trae su universo visual a un formato reproducible y accesible.', '$20.00 USD', '30 x 40 cm', 'Arte digital', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'digital'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'digital-artwork-1'), 'https://64.media.tumblr.com/c29b535685cd870a467bdc6eb0d60ef2/tumblr_n27f1t2IvP1r74tb2o1_1280.jpg', 'tumblr_n27f1t2IvP1r74tb2o1_1280.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('digital-artwork-2', 'Digital Artwork #2', 'Obra digital original. Impresión de alta calidad disponible en <strong>30 x 40 cm</strong>.', '$20.00 USD', '30 x 40 cm', 'Arte digital', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'digital'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'digital-artwork-2'), 'https://64.media.tumblr.com/c3123779be189a5a8737b190f595574a/tumblr_n275dsU7Xr1r74tb2o1_250.jpg', 'tumblr_n275dsU7Xr1r74tb2o1_250.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('digital-artwork-3', 'Digital Artwork #3', 'Obra digital original. Impresión de alta calidad disponible en <strong>30 x 40 cm</strong>.', '$20.00 USD', '30 x 40 cm', 'Arte digital', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'digital'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'digital-artwork-3'), 'https://64.media.tumblr.com/9e5c31eb51ce7e28c7982f271746f302/tumblr_n275eaKQwf1r74tb2o1_640.jpg', 'tumblr_n275eaKQwf1r74tb2o1_640.jpg', TRUE, 0);

INSERT INTO artworks (slug, title, description, price, dimensions, technique, artwork_year, sold, category_id)
VALUES ('digital-artwork-4', 'Digital Artwork #4', 'Obra digital original. Impresión de alta calidad disponible en <strong>30 x 40 cm</strong>.', '$20.00 USD', '30 x 40 cm', 'Arte digital', 'Consultar año', FALSE,
    (SELECT id FROM categories WHERE name = 'digital'));
INSERT INTO artwork_images (artwork_id, file_path, file_name, is_primary, sort_order)
VALUES ((SELECT id FROM artworks WHERE slug = 'digital-artwork-4'), 'https://64.media.tumblr.com/15528b2c6461bb6795b432f0b5a67bd3/tumblr_n2757yIlWR1r74tb2o1_540.jpg', 'tumblr_n2757yIlWR1r74tb2o1_540.jpg', TRUE, 0);

