(function () {
    'use strict';

    var CACHE_KEY = 'dda_index_newest_artwork_v1';
    var dismissedSlug = null;
    var closeBound = false;

    function getApiBase() {
        if (window.DDA_API_BASE) {
            return String(window.DDA_API_BASE).replace(/\/$/, '');
        }
        return 'https://api.diegodeaduriz.art/api';
    }

    function isDismissed(slug) {
        return dismissedSlug === String(slug || '');
    }

    function dismiss(slug) {
        dismissedSlug = String(slug || '');
    }

    function readCache() {
        try {
            var raw = localStorage.getItem(CACHE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function writeCache(artwork, imageSrc) {
        try {
            var slug = artwork.slug || String(artwork.id || '');
            if (!slug) return;
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                slug: slug,
                title: artwork.title || '',
                imageSrc: imageSrc || '',
                ts: Date.now()
            }));
        } catch (e) {
            // ignore quota / private mode
        }
    }

    function resolveArtworkImage(artwork) {
        var images = Array.isArray(artwork.images) ? artwork.images.slice() : [];
        images.sort(function (a, b) {
            return (a.sortOrder || 0) - (b.sortOrder || 0);
        });
        var primary = images.find(function (img) {
            return img && (img.isPrimary === true || img.primary === true);
        }) || images[0];

        var raw = primary
            ? (primary.filePath || primary.url || primary.imageUrl || '')
            : (artwork.imageUrl || artwork.image || artwork.imageSrc || '');

        if (!raw) return '';

        if (typeof DDAImages !== 'undefined' && typeof DDAImages.resolveImageUrl === 'function') {
            return DDAImages.getThumbImageUrl(
                DDAImages.resolveImageUrl(raw, window.location.href)
            );
        }

        return raw;
    }

    function fetchNewestArtwork() {
        return fetch(getApiBase() + '/artworks?page=0&size=1&sort=createdAt,desc', {
            headers: { Accept: 'application/json' },
            credentials: 'omit'
        })
            .then(function (res) {
                if (!res.ok) throw new Error('api');
                return res.json();
            })
            .then(function (data) {
                return (data.content || [])[0] || null;
            })
            .catch(function () {
                return null;
            });
    }

    // Start network request as early as possible — do not wait for DOMContentLoaded.
    var newestArtworkPromise = fetchNewestArtwork();

    window.DDAIndexPromo = {
        hasNewArtworkVisible: false
    };

    function notifyNewArtworkVisible() {
        window.DDAIndexPromo.hasNewArtworkVisible = true;
        window.dispatchEvent(new CustomEvent('dda:new-artwork-visible'));
    }

    function notifyNewArtworkDismissed() {
        window.DDAIndexPromo.hasNewArtworkVisible = false;
        window.dispatchEvent(new CustomEvent('dda:new-artwork-dismissed'));
    }

    function closeNewArtwork(card, slug) {
        dismiss(slug || card.dataset.artworkSlug || '');
        notifyNewArtworkDismissed();
        card.classList.add('is-closing');
        window.setTimeout(function () {
            card.hidden = true;
            card.classList.remove('is-closing');
        }, 300);
    }

    function bindCloseButton(card) {
        if (closeBound) return;
        var closeBtn = document.getElementById('indexNewArtworkClose');
        if (!closeBtn) return;
        closeBound = true;
        closeBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            closeNewArtwork(card, card.dataset.artworkSlug || '');
        });
    }

    function bindCollageBlur(link) {
        var collage = document.getElementById('collage-bg-container');
        if (!collage || !link || link.dataset.blurBound) return;
        link.dataset.blurBound = '1';
        link.addEventListener('mouseenter', function () {
            collage.style.filter = 'blur(6px)';
        });
        link.addEventListener('mouseleave', function () {
            collage.style.filter = 'blur(0px)';
        });
        link.addEventListener('focus', function () {
            collage.style.filter = 'blur(6px)';
        });
        link.addEventListener('blur', function () {
            collage.style.filter = 'blur(0px)';
        });
    }

    function revealNewArtwork(card, artwork, imageSrc) {
        var link = card.querySelector('.index-new-artwork__link');
        var thumb = card.querySelector('.index-new-artwork__thumb');
        var title = card.querySelector('.index-new-artwork__title');
        var slug = artwork.slug || String(artwork.id || '');

        if (!slug || isDismissed(slug)) return;

        if (link) {
            link.href = './shop/obra.html?id=' + encodeURIComponent(slug);
            bindCollageBlur(link);
        }

        if (title) {
            title.textContent = artwork.title || '';
        }

        card.dataset.artworkSlug = slug;
        card.classList.remove('index-new-artwork--no-thumb');
        card.hidden = false;
        notifyNewArtworkVisible();

        if (!thumb || !imageSrc) {
            card.classList.add('index-new-artwork--no-thumb');
            return;
        }

        thumb.alt = artwork.title || 'Nueva obra';
        thumb.classList.add('is-loading');

        thumb.onload = function () {
            thumb.classList.remove('is-loading');
        };
        thumb.onerror = function () {
            thumb.classList.remove('is-loading');
            card.classList.add('index-new-artwork--no-thumb');
        };

        if (thumb.getAttribute('src') !== imageSrc) {
            thumb.src = imageSrc;
        } else if (thumb.complete && thumb.naturalWidth > 0) {
            thumb.classList.remove('is-loading');
        }
    }

    function showNewArtwork(card, artwork, imageSrc) {
        var resolvedImage = imageSrc || resolveArtworkImage(artwork);
        revealNewArtwork(card, artwork, resolvedImage);
        writeCache(artwork, resolvedImage);
    }

    function boot() {
        var card = document.getElementById('indexNewArtwork');
        if (!card) return;

        bindCloseButton(card);

        var cached = readCache();
        if (cached && cached.slug && !isDismissed(cached.slug)) {
            revealNewArtwork(card, {
                slug: cached.slug,
                id: cached.slug,
                title: cached.title
            }, cached.imageSrc || '');
        }

        newestArtworkPromise.then(function (artwork) {
            if (!artwork) return;
            showNewArtwork(card, artwork);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
