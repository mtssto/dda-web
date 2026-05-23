/**
 * DDA Frontend Configuration
 * Update DDA_API_BASE when deploying the backend to production.
 * Local dev: leave as '/api' (works with the Python dev_server.py proxy)
 */
(function () {
    'use strict';

    // When running locally with dev_server.py, '/api' gets proxied to localhost:8081
    // For production, set this to your Railway backend URL, e.g.:
    // window.DDA_API_BASE = 'https://your-app.up.railway.app/api';
    window.DDA_API_BASE = 'https://dda-web-production.up.railway.app/api';
    // Uploaded images (/uploads/...) are served by the backend, not GitHub Pages:
    window.DDA_MEDIA_BASE = 'https://dda-web-production.up.railway.app';
})();
