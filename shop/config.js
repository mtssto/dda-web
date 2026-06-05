/**
 * DDA Frontend Configuration
 * Update DDA_API_BASE when deploying the backend to production.
 * Local dev: leave as '/api' (works with the Python dev_server.py proxy)
 */
(function () {
    'use strict';

    // When running locally with dev_server.py, '/api' gets proxied to localhost:8081
    // Production API (Railway). For cookie auth, prefer api.diegodeaduriz.art (see DEPLOYMENT.md).
    window.DDA_API_BASE = 'https://dda-web-production.up.railway.app/api';
    // Backend uploads only (/uploads/...). Portfolio images stay on the static site.
    window.DDA_MEDIA_BASE = 'https://dda-web-production.up.railway.app';
    // Optional if the shop HTML is served from another host (e.g. preview on github.io):
    // window.DDA_STATIC_BASE = 'https://diegodeaduriz.art';
})();
