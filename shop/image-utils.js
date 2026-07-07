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

    function encodeUrlSpaces(url) {
        return String(url || '').replace(/ /g, '%20');
    }

    /** @deprecated Use encodeUrlSpaces for single URLs; formatSrcsetAttr for srcset. */
    function encodeSrcset(url) {
        return encodeUrlSpaces(url);
    }

    function escapeHtmlAttr(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function formatSrcsetAttr(srcset) {
        if (!srcset) return '';
        return srcset.split(',').map(function (part) {
            part = part.trim();
            if (!part) return '';
            var lastSpace = part.lastIndexOf(' ');
            if (lastSpace === -1) {
                return encodeUrlSpaces(part);
            }
            var url = part.slice(0, lastSpace).trim();
            var descriptor = part.slice(lastSpace + 1).trim();
            return encodeUrlSpaces(url) + ' ' + descriptor;
        }).filter(Boolean).join(', ');
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

    function isBrokenCloudinaryAttr(value) {
        var raw = String(value || '');
        return raw.indexOf('%20450w,') !== -1 || raw.indexOf(' 450w,') !== -1;
    }

    function extractFirstCloudinaryUrl(value) {
        var match = String(value || '').match(/(https?:\/\/res\.cloudinary\.com\/[^\s,]+)/);
        return match ? match[1] : '';
    }

    function repairBrokenImageElement(img) {
        if (!img || !img.getAttribute) return false;

        var src = img.getAttribute('src') || '';
        var srcset = img.getAttribute('srcset') || '';
        if (!isBrokenCloudinaryAttr(src) && !isBrokenCloudinaryAttr(srcset)) {
            return false;
        }

        var raw = extractFirstCloudinaryUrl(src) || extractFirstCloudinaryUrl(srcset);
        if (!raw) return false;

        img.removeAttribute('srcset');
        img.removeAttribute('sizes');
        img.src = getTransformedUrl(raw, 700);
        return true;
    }

    function repairBrokenImages(root) {
        var scope = root || document;
        if (!scope.querySelectorAll) return 0;

        var fixed = 0;
        scope.querySelectorAll('img').forEach(function (img) {
            if (repairBrokenImageElement(img)) fixed += 1;
        });
        return fixed;
    }

    /** Single-URL card image — no Cloudinary srcset (avoids malformed responsive requests). */
    function cardImageHtml(src, alt, extraAttrs) {
        var resolved = resolveImageUrl(src, getStaticBaseUrl() + '/shop/shop.html');
        var attrs = extraAttrs || '';
        var safeAlt = escapeHtmlAttr(alt);

        if (isCloudinaryUrl(resolved)) {
            resolved = getTransformedUrl(resolved, 700);
        } else {
            var webpSrc = toWebPFallback(resolved);
            if (webpSrc !== resolved) {
                if (attrs.indexOf('loading=') === -1) attrs += ' loading="lazy"';
                if (attrs.indexOf('decoding=') === -1) attrs += ' decoding="async"';
                return '<picture>' +
                    '<source srcset="' + escapeHtmlAttr(encodeUrlSpaces(webpSrc)) + '" type="image/webp">' +
                    '<img src="' + escapeHtmlAttr(encodeUrlSpaces(resolved)) + '" alt="' + safeAlt + '"' + attrs + '>' +
                    '</picture>';
            }
        }

        if (attrs.indexOf('loading=') === -1) attrs += ' loading="lazy"';
        if (attrs.indexOf('decoding=') === -1) attrs += ' decoding="async"';

        return '<img src="' + escapeHtmlAttr(encodeUrlSpaces(resolved)) + '" alt="' + safeAlt + '"' + attrs + '>';
    }

    function pictureHtml(src, alt, extraAttrs) {
        return cardImageHtml(src, alt, extraAttrs);
    }

    return {
        isCloudinaryUrl: isCloudinaryUrl,
        getTransformedUrl: getTransformedUrl,
        getCardSrcset: getCardSrcset,
        getCardImageUrl: function (url) { return getTransformedUrl(url, 700); },
        getCatalogThumbUrl: function (url) { return getTransformedUrl(url, 400); },
        getDetailImageUrl: function (url) { return getTransformedUrl(url, 1200); },
        getPdfImageUrl: function (url) { return getTransformedUrl(url, 2000); },
        getThumbImageUrl: function (url) { return getTransformedUrl(url, 120); },
        resolveImageUrl: resolveImageUrl,
        cardImageHtml: cardImageHtml,
        pictureHtml: pictureHtml,
        repairBrokenImages: repairBrokenImages,
        encodeSrcset: encodeSrcset,
        encodeUrlSpaces: encodeUrlSpaces,
        formatSrcsetAttr: formatSrcsetAttr,
        escapeHtmlAttr: escapeHtmlAttr
    };
})();
