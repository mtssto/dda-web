/**
 * DDA API Client — Fetches artworks and categories from the backend.
 * When the backend is available, replaces the static products.js data.
 * Falls back gracefully to the products.js data if the API is unreachable.
 */
var DDAApi = (function () {
    'use strict';

    var API_BASE = window.DDA_API_BASE || '/api';

    function mapArtworkToProduct(artwork) {
        var imagePath = '';
        if (artwork.images && artwork.images.length > 0) {
            imagePath = artwork.images[0].filePath || '';
        }
        return {
            id: artwork.slug || artwork.id,
            title: artwork.title,
            description: artwork.description || '',
            price: artwork.price || 'Consultar',
            dimensions: artwork.dimensions || '',
            technique: artwork.technique || '',
            category: (artwork.category || '').toLowerCase(),
            image: imagePath,
            sold: artwork.sold || false,
            year: artwork.year || ''
        };
    }

    function fetchAllArtworks() {
        return fetch(API_BASE + '/artworks?page=0&size=200&sort=createdAt,desc')
            .then(function (res) {
                if (!res.ok) throw new Error('API unavailable');
                return res.json();
            })
            .then(function (data) {
                var artworks = data.content || [];
                return artworks.map(mapArtworkToProduct);
            });
    }

    function loadProducts() {
        return fetchAllArtworks()
            .then(function (products) {
                window.products = products;
                return products;
            })
            .catch(function () {
                // API unreachable — use existing products.js data
                return window.products || [];
            });
    }

    return {
        loadProducts: loadProducts,
        fetchAllArtworks: fetchAllArtworks
    };
})();
