(function () {
    'use strict';

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
            : (artwork.imageUrl || artwork.image || '');

        if (!raw) return '';

        if (typeof DDAImages !== 'undefined' && typeof DDAImages.resolveImageUrl === 'function') {
            return DDAImages.getThumbImageUrl(
                DDAImages.resolveImageUrl(raw, window.location.href)
            );
        }

        return raw;
    }

    function closeNewArtwork(card, slug) {
        dismiss(slug || card.dataset.artworkSlug || '');
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

    function revealNewArtwork(card, artwork, imageSrc) {
        var link = card.querySelector('.index-new-artwork__link');
        var thumb = card.querySelector('.index-new-artwork__thumb');
        var title = card.querySelector('.index-new-artwork__title');
        var slug = artwork.slug || String(artwork.id || '');

        if (link) {
            link.href = './shop/obra.html?id=' + encodeURIComponent(slug);
        }

        if (title) {
            title.textContent = artwork.title || '';
        }

        if (thumb && imageSrc) {
            thumb.alt = artwork.title || 'Nueva obra';
            thumb.removeAttribute('src');
            thumb.onload = function () {
                card.hidden = false;
            };
            thumb.onerror = function () {
                card.classList.add('index-new-artwork--no-thumb');
                card.hidden = false;
            };
            thumb.src = imageSrc;
            if (thumb.complete && thumb.naturalWidth > 0) {
                card.hidden = false;
            }
        } else {
            card.classList.add('index-new-artwork--no-thumb');
            card.hidden = false;
        }

        card.dataset.artworkSlug = slug;

        var collage = document.getElementById('collage-bg-container');
        if (collage && link && !link.dataset.blurBound) {
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
    }

    function showNewArtwork(card, artwork) {
        var slug = artwork.slug || String(artwork.id || '');
        if (!slug || isDismissed(slug)) return;

        revealNewArtwork(card, artwork, resolveArtworkImage(artwork));
    }

    document.addEventListener('DOMContentLoaded', function () {
        var card = document.getElementById('indexNewArtwork');
        if (!card) return;

        bindCloseButton(card);

        fetch(getApiBase() + '/artworks?page=0&size=1&sort=createdAt,desc', {
            headers: { Accept: 'application/json' }
        })
            .then(function (res) {
                if (!res.ok) throw new Error('api');
                return res.json();
            })
            .then(function (data) {
                var artwork = (data.content || [])[0];
                if (!artwork) return;
                showNewArtwork(card, artwork);
            })
            .catch(function () {
                // Keep hidden if the API is unavailable.
            });
    });
})();
