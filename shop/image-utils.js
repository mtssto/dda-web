/**
 * Shared image URL helpers — Cloudinary transforms + static asset resolution.
 */
var DDAImages = (function () {
    'use strict';

    function isCloudinaryUrl(url) {
        return typeof url === 'string' &&
            url.indexOf('res.cloudinary.com') !== -1 &&
            url.indexOf('/upload/') !== -1;
    }

    function hasTransformSegment(url) {
        return /\/upload\/[^/]*(f_auto|q_auto|w_\d+|c_limit|c_fill)[^/]*\//.test(url);
    }

    function getTransformedUrl(url, width) {
        if (!url || !isCloudinaryUrl(url) || hasTransformSegment(url)) {
            return url;
        }
        return url.replace('/upload/', '/upload/f_auto,q_auto,w_' + width + ',c_limit/');
    }

    function getCardSrcset(url) {
        if (!isCloudinaryUrl(url)) {
            return '';
        }
        return [
            getTransformedUrl(url, 450) + ' 450w',
            getTransformedUrl(url, 700) + ' 700w',
            getTransformedUrl(url, 950) + ' 950w'
        ].join(', ');
    }

    function encodeSrcset(url) {
        return String(url || '').replace(/ /g, '%20');
    }

    function getApiBaseUrl() {
        if (window.DDA_API_BASE) {
            var clean = String(window.DDA_API_BASE).replace(/\/$/, '');
            return clean.endsWith('/api') ? clean : clean + '/api';
        }
        return '/api';
    }

    function getBackendBaseUrl() {
        return getApiBaseUrl().replace(/\/api$/, '');
    }

    function getStaticBaseUrl() {
        if (window.DDA_STATIC_BASE) {
            return String(window.DDA_STATIC_BASE).replace(/\/$/, '');
        }
        // Portfolio /shop static files are on GitHub Pages — never use DDA_MEDIA_BASE (API host).
        return window.location.origin;
    }

    function hasImageExtension(path) {
        return /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(String(path || '').split('?')[0]);
    }

    function joinUrl(base, path) {
        return base.replace(/\/$/, '') + '/' + String(path || '').replace(/^\/+/, '');
    }

    function resolveImageUrl(image, pagePath) {
        if (!image) return '';

        var rawPath = typeof image === 'string'
            ? image
            : (image.filePath || image.url || image.imageUrl || '');

        rawPath = String(rawPath || '').trim();
        if (!rawPath) return '';

        if (rawPath.indexOf('http://') === 0 || rawPath.indexOf('https://') === 0) {
            return rawPath;
        }

        if (
            rawPath.indexOf('/uploads/') === 0 ||
            rawPath.indexOf('uploads/') === 0 ||
            rawPath.indexOf('/upload/') === 0 ||
            rawPath.indexOf('upload/') === 0
        ) {
            return joinUrl(getBackendBaseUrl(), rawPath);
        }

        var basePage = pagePath || (getStaticBaseUrl() + '/shop/catalog.html');

        if (
            rawPath.indexOf('/portfolio/') === 0 ||
            rawPath.indexOf('portfolio/') === 0 ||
            rawPath.indexOf('../portfolio/') === 0 ||
            rawPath.indexOf('/shop/') === 0 ||
            rawPath.indexOf('shop/') === 0 ||
            rawPath.indexOf('../shop/') === 0
        ) {
            return new URL(rawPath, basePage).href;
        }

        if (rawPath.indexOf('/') === 0) {
            return joinUrl(getStaticBaseUrl(), rawPath);
        }

        if (rawPath.indexOf('/') === -1 && hasImageExtension(rawPath)) {
            return joinUrl(getStaticBaseUrl(), '/portfolio/sections/obras/' + rawPath);
        }

        return new URL(rawPath, basePage).href;
    }

    function toWebPFallback(src) {
        return String(src || '').replace(/\.(png|jpe?g)$/i, '.webp');
    }

    function pictureHtml(src, alt, extraAttrs) {
        var resolved = resolveImageUrl(src, getStaticBaseUrl() + '/shop/shop.html');
        var attrs = extraAttrs || '';

        if (isCloudinaryUrl(resolved)) {
            var optimized = getTransformedUrl(resolved, 700);
            var srcset = getCardSrcset(resolved);
            if (srcset && attrs.indexOf('srcset=') === -1) {
                attrs += ' srcset="' + encodeSrcset(srcset) + '"';
            }
            if (attrs.indexOf('sizes=') === -1) {
                attrs += ' sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 420px"';
            }
            resolved = optimized;
        } else {
            var webpSrc = toWebPFallback(resolved);
            if (webpSrc !== resolved) {
                return '<picture>' +
                    '<source srcset="' + encodeSrcset(webpSrc) + '" type="image/webp">' +
                    '<img src="' + encodeSrcset(resolved) + '" alt="' + String(alt || '').replace(/"/g, '&quot;') + '"' + attrs + '>' +
                    '</picture>';
            }
        }

        if (attrs.indexOf('loading=') === -1) attrs += ' loading="lazy"';
        if (attrs.indexOf('decoding=') === -1) attrs += ' decoding="async"';

        return '<img src="' + encodeSrcset(resolved) + '" alt="' + String(alt || '').replace(/"/g, '&quot;') + '"' + attrs + '>';
    }

    return {
        isCloudinaryUrl: isCloudinaryUrl,
        getTransformedUrl: getTransformedUrl,
        getCardSrcset: getCardSrcset,
        getCardImageUrl: function (url) { return getTransformedUrl(url, 700); },
        getDetailImageUrl: function (url) { return getTransformedUrl(url, 1200); },
        getPdfImageUrl: function (url) { return getTransformedUrl(url, 2000); },
        getThumbImageUrl: function (url) { return getTransformedUrl(url, 120); },
        resolveImageUrl: resolveImageUrl,
        pictureHtml: pictureHtml,
        encodeSrcset: encodeSrcset
    };
})();
