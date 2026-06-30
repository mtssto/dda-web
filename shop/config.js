/**
 * DDA Frontend Configuration
 *
 * Production: uses api.diegodeaduriz.art
 * Local static server (python -m http.server): same production API — no backend needed.
 * Local dev_server.py: injects DDA_USE_LOCAL_API + /api proxy (see dev_server.py).
 */
(function () {
    'use strict';

    var PROD_API = 'https://api.diegodeaduriz.art/api';
    var PROD_MEDIA = 'https://api.diegodeaduriz.art';

    if (!window.DDA_API_BASE) {
        window.DDA_API_BASE = PROD_API;
    }
    if (!window.DDA_MEDIA_BASE) {
        window.DDA_MEDIA_BASE = PROD_MEDIA;
    }
})();
