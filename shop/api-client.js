/**
 * DDA API Client — Fetches artworks and categories from the backend.
 * When the backend is available, replaces the static products.js data.
 * Falls back gracefully to the products.js data if the API is unreachable.
 */
var DDAApi = (function () {
    'use strict';

    var API_BASE = window.DDA_API_BASE || '/api';
    var FALLBACK_IMAGE = '/portfolio/sections/obras/MG_1192.jpg';

    function getCategoryValue(artwork) {
        if (!artwork || !artwork.category) return '';
        if (typeof artwork.category === 'string') {
            return artwork.category.toLowerCase();
        }
        return String(artwork.category.name || artwork.category.slug || '').toLowerCase();
    }

    function resolveImageUrl(image) {
        if (typeof DDAImages !== 'undefined' && typeof DDAImages.resolveImageUrl === 'function') {
            return DDAImages.resolveImageUrl(image, window.location.href);
        }

        if (!image) return '';

        var rawPath = typeof image === 'string'
            ? image
            : (image.filePath || image.url || image.imageUrl || '');

        rawPath = String(rawPath || '').trim();
        if (!rawPath) return '';

        if (rawPath.indexOf('http://') === 0 || rawPath.indexOf('https://') === 0) {
            return rawPath;
        }

        var mediaBase = (window.DDA_MEDIA_BASE || '').replace(/\/$/, '');
        if (mediaBase && (rawPath.indexOf('/uploads/') === 0 || rawPath.indexOf('uploads/') === 0)) {
            return mediaBase + (rawPath.indexOf('/') === 0 ? rawPath : '/' + rawPath);
        }

        if (rawPath.indexOf('/') === 0) {
            return rawPath;
        }

        return rawPath;
    }

    function getPrimaryImageUrl(artwork) {
        var images = Array.isArray(artwork.images) ? artwork.images.slice() : [];
        images.sort(function (a, b) {
            return (a.sortOrder || 0) - (b.sortOrder || 0);
        });
        var primaryImage = images.find(function (img) {
            return img && (img.isPrimary === true || img.primary === true);
        }) || images[0];

        var primaryUrl = resolveImageUrl(primaryImage);
        if (primaryUrl) return primaryUrl;

        return resolveImageUrl(artwork.imageUrl || artwork.image || '') || FALLBACK_IMAGE;
    }

    function getImageIdentity(image) {
        var raw = image && typeof image === 'object'
            ? (image.fileName || image.filePath || image.url || image.imageUrl || '')
            : image;
        var filename = String(raw || '').split(/[?#]/)[0].split('/').pop();
        try { filename = decodeURIComponent(filename); } catch (error) { /* keep the encoded filename */ }
        return filename.toLowerCase();
    }

    function mapArtworkToProduct(artwork) {
        var sortedImages = Array.isArray(artwork.images) ? artwork.images.slice() : [];
        sortedImages.sort(function (a, b) {
            return (a.sortOrder || 0) - (b.sortOrder || 0);
        });
        var primary = getPrimaryImageUrl(artwork);
        var slug = artwork.slug || String(artwork.id || '');
        var staticArtwork = (window.products || []).find(function (product) {
            return String(product.slug || product.id || '') === String(slug);
        });
        var imageEntries = sortedImages.concat(
            staticArtwork && Array.isArray(staticArtwork.images) ? staticArtwork.images : []
        );
        var seenImages = new Set();
        var imageUrls = imageEntries.map(function (image) {
            var identity = getImageIdentity(image);
            if (identity && seenImages.has(identity)) return '';
            if (identity) seenImages.add(identity);
            return resolveImageUrl(image);
        }).filter(Boolean);

        return {
            id: slug,
            slug: slug,
            backendId: artwork.id != null ? artwork.id : null,
            title: artwork.title || 'Obra sin título',
            description: artwork.description || '',
            price: artwork.price || 'Consultar',
            dimensions: artwork.dimensions || '',
            technique: artwork.technique || '',
            category: getCategoryValue(artwork),
            image: primary,
            images: imageUrls.length ? imageUrls : (primary ? [primary] : []),
            sold: artwork.sold === true,
            year: artwork.year || '',
            createdAt: artwork.createdAt || artwork.updatedAt || ''
        };
    }

    function fetchAllArtworks() {
        return fetch(API_BASE + '/artworks?page=0&size=500&sort=createdAt,desc')
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
