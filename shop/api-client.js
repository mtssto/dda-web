/**
 * DDA API Client — Fetches artworks and categories from the backend.
 * When the backend is available, replaces the static products.js data.
 * Falls back gracefully to the products.js data if the API is unreachable.
 */
var DDAApi = (function () {
    'use strict';

    var API_BASE = window.DDA_API_BASE || '/api';
    var FALLBACK_IMAGE = '/portfolio/sections/obras/MG_1192.jpg';

    function mapArtworkToProduct(artwork) {
        var imagePath = '';
        if (artwork.images && artwork.images.length > 0) {
            imagePath = artwork.images[0].filePath || '';
        }
        return {
            id: artwork.slug || String(artwork.id),
            title: artwork.title,
            description: artwork.description || '',
            price: artwork.price || 'Consultar',
            dimensions: artwork.dimensions || '',
            technique: artwork.technique || '',
            category: (artwork.category || '').toLowerCase(),
            image: imagePath || FALLBACK_IMAGE,
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

    function fetchCategories() {
        return fetch(API_BASE + '/categories')
            .then(function (res) {
                if (!res.ok) throw new Error('API unavailable');
                return res.json();
            });
    }

    function searchArtworks(query) {
        return fetch(API_BASE + '/artworks/search?q=' + encodeURIComponent(query) + '&page=0&size=20')
            .then(function (res) {
                if (!res.ok) throw new Error('Search failed');
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
                if (products.length > 0) {
                    window.products = products;
                }
                return window.products || [];
            })
            .catch(function () {
                return window.products || [];
            });
    }

    return {
        loadProducts: loadProducts,
        fetchAllArtworks: fetchAllArtworks,
        fetchCategories: fetchCategories,
        searchArtworks: searchArtworks
    };
})();
