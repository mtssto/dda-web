/**
 * Start API requests as early as possible (before deferred app scripts).
 * catalog-api.js / obra.js consume the promises when they initialize.
 */
(function () {
    'use strict';

    var PROD_API = 'https://api.diegodeaduriz.art/api';

    function apiBase() {
        if (window.DDA_API_BASE) {
            var clean = String(window.DDA_API_BASE).replace(/\/$/, '');
            return clean.endsWith('/api') ? clean : clean + '/api';
        }
        return PROD_API;
    }

    function jsonFetch(url) {
        return fetch(url, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            credentials: 'omit'
        }).then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        });
    }

    if (/catalog\.html$/i.test(window.location.pathname)) {
        var catalogUrl = apiBase() + '/artworks?page=0&size=12&sort=id,desc';
        window.__ddaCatalogPrefetch = jsonFetch(catalogUrl);
    }

    var obraId = new URLSearchParams(window.location.search).get('id');
    if (obraId && /obra\.html$/i.test(window.location.pathname)) {
        window.__ddaObraPrefetch = jsonFetch(
            apiBase() + '/artworks/' + encodeURIComponent(obraId)
        );
    }
})();
