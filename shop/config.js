/**
 * DDA Frontend Configuration
 * Update DDA_API_BASE when deploying the backend to production.
 * Local dev: leave as '/api' (works with the Python dev_server.py proxy)
 */
(function () {
    'use strict';

    // When running locally with dev_server.py, '/api' gets proxied to localhost:8081
    // Production API (Railway). For reliable cookie auth from diegodeaduriz.art, prefer:
    // window.DDA_API_BASE = 'https://api.diegodeaduriz.art/api';
    // window.DDA_MEDIA_BASE = 'https://api.diegodeaduriz.art';
    window.DDA_API_BASE = 'https://dda-web-production.up.railway.app/api';
    window.DDA_MEDIA_BASE = 'https://dda-web-production.up.railway.app';
})();
