export default function handler(req, res) {
    const { id, img, title, desc } = req.query;

    const DOMAIN = 'https://diegodeaduriz.art';
    const fallbackImg = DOMAIN + '/portfolio/sections/obras/MG_1192.jpg';

    // Only allow images from your own domain
    const safeImg = (img && img.startsWith(DOMAIN + '/')) ? img : fallbackImg;
    const safeTitle = (title || 'Obra') + ' — Diego De Aduriz';
    const safeDesc = desc || 'Obra original de Diego De Aduriz';
    const pageUrl = DOMAIN + '/shop/obra.html?id=' + encodeURIComponent(id || '');

    // Escape for HTML attribute context
    const esc = (s) => s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${esc(safeTitle)}</title>
  <meta property="og:type"        content="product">
  <meta property="og:url"         content="${esc(pageUrl)}">
  <meta property="og:title"       content="${esc(safeTitle)}">
  <meta property="og:description" content="${esc(safeDesc)}">
  <meta property="og:image"       content="${esc(safeImg)}">
  <meta property="og:image:width"  content="1200">
  <meta property="og:image:height" content="1200">
  <meta name="twitter:card"        content="summary_large_image">
  <meta name="twitter:title"       content="${esc(safeTitle)}">
  <meta name="twitter:description" content="${esc(safeDesc)}">
  <meta name="twitter:image"       content="${esc(safeImg)}">
  <meta http-equiv="refresh" content="0;url=${esc(pageUrl)}">
  <script>window.location.replace(${JSON.stringify(pageUrl)});</script>
</head>
<body><a href="${esc(pageUrl)}">Ver obra</a></body>
</html>`);
}
