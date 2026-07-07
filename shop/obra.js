(function () {
    'use strict';

    var WA_NUMBER = '5491160139563';
    var _loadedProduct = null;

    var backBtn = document.querySelector('.site-header-back');

    if (backBtn) {
        backBtn.addEventListener('click', function (e) {
            if (window.history.length > 1) {
                e.preventDefault();
                window.history.back();
            }
        });
    }

    function getProductId() {
        var params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    function findProduct(id) {
        if (!window.products || !id) return null;
        return window.products.find(function (p) {
            return p.id === id || p.slug === id || String(p.id) === id;
        }) || null;
    }

    function fetchFromApi(slug) {
        var apiBase = window.DDA_API_BASE || '/api';

        function loadArtwork() {
            return fetch(apiBase + '/artworks/' + encodeURIComponent(slug), {
                headers: { 'Accept': 'application/json' }
            })
            .then(function (res) {
                if (!res.ok) throw new Error('Not found');
                return res.json();
            });
        }

        var request = window.__ddaObraPrefetch
            ? window.__ddaObraPrefetch.catch(function () { return loadArtwork(); })
            : loadArtwork();

        window.__ddaObraPrefetch = null;

        return request
        .then(function (artwork) {
            var images = Array.isArray(artwork.images) ? artwork.images.slice() : [];
            images.sort(function (a, b) {
                return (a.sortOrder || 0) - (b.sortOrder || 0);
            });

            var primaryImage = images.find(function (img) {
                return img && (img.isPrimary === true || img.primary === true);
            }) || images[0];

            var imagePath = '';
            if (primaryImage) {
                imagePath = primaryImage.filePath || primaryImage.url || '';
            }
            var allImages = images.map(function (img) {
                return img.filePath || img.url || '';
            }).filter(Boolean);

            var pageBase = (window.DDA_STATIC_BASE || window.location.origin) + '/shop/obra.html';
            var resolvedImages = allImages.length > 0 ? allImages : [imagePath || '/portfolio/sections/obras/MG_1192.jpg'];
            resolvedImages = resolvedImages.map(function (path) {
                if (typeof DDAImages !== 'undefined') {
                    return DDAImages.resolveImageUrl(path, pageBase);
                }
                return path;
            });
            var primaryImage = resolvedImages[0] || '/portfolio/sections/obras/MG_1192.jpg';

            return {
                id: artwork.slug || String(artwork.id),
                artworkId: artwork.id,
                slug: artwork.slug || String(artwork.id),
                title: artwork.title,
                description: artwork.description || '',
                price: artwork.price || 'Consultar',
                dimensions: artwork.dimensions || '',
                technique: artwork.technique || '',
                category: (artwork.category || '').toLowerCase(),
                image: primaryImage,
                images: resolvedImages,
                sold: artwork.sold === true,
                year: artwork.year || ''
            };
        });
    }

    function optimizeObraImage(url, size) {
        if (typeof DDAImages === 'undefined') return url;
        if (size === 'lightbox') return DDAImages.getPdfImageUrl(url);
        if (size === 'detail') return DDAImages.getDetailImageUrl(url);
        if (size === 'thumb') return DDAImages.getThumbImageUrl(url);
        return DDAImages.getCardImageUrl(url);
    }

    function setObraMainImage(mainImg, imageUrl) {
        if (!mainImg || !imageUrl) return;
        var detailUrl = optimizeObraImage(imageUrl, 'detail');
        mainImg.src = detailUrl;
        mainImg.setAttribute('data-zoom-src', optimizeObraImage(imageUrl, 'lightbox'));

        var preload = document.getElementById('obraImagePreload');
        if (!preload) {
            preload = document.createElement('link');
            preload.id = 'obraImagePreload';
            preload.rel = 'preload';
            preload.as = 'image';
            document.head.appendChild(preload);
        }
        preload.href = detailUrl;
    }

    function setupObraLightbox() {
        if (setupObraLightbox._bound) return;
        setupObraLightbox._bound = true;

        var mainImageContainer = document.getElementById('obraMainImage');
        var zoomBtn = document.getElementById('obraZoomBtn');
        var lightbox = document.getElementById('obraLightbox');
        var lightboxImg = document.getElementById('lightboxImg');
        var lightboxClose = document.getElementById('lightboxClose');

        function openLightbox() {
            var mainImg = document.getElementById('obraImg');
            if (!lightbox || !lightboxImg || !mainImg || !mainImg.src) return;

            lightboxImg.src = mainImg.getAttribute('data-zoom-src') || mainImg.src;
            lightboxImg.alt = mainImg.alt || '';
            lightboxImg.dataset.zoomLevel = '0';
            lightboxImg.style.transform = 'scale(1)';
            lightboxImg.style.transformOrigin = 'center center';
            lightboxImg.style.cursor = 'zoom-in';
            lightbox.classList.add('active');
            document.body.classList.add('obra-lightbox-open');
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            if (!lightbox) return;
            lightbox.classList.remove('active');
            document.body.classList.remove('obra-lightbox-open');
            document.body.style.overflow = '';
            if (lightboxImg) {
                lightboxImg.dataset.zoomLevel = '0';
                lightboxImg.style.transform = 'scale(1)';
                lightboxImg.style.transformOrigin = 'center center';
            }
        }

        if (mainImageContainer) {
            mainImageContainer.addEventListener('click', function (e) {
                if (e.target.closest('.obra-zoom-btn')) return;
                openLightbox();
            });
        }

        if (zoomBtn) {
            zoomBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                openLightbox();
            });
        }

        if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);

        if (lightbox) {
            lightbox.addEventListener('click', function (e) {
                if (e.target === lightbox) closeLightbox();
            });
        }

        if (lightboxImg) {
            lightboxImg.addEventListener('click', function (e) {
                e.stopPropagation();

                var currentZoom = parseInt(this.dataset.zoomLevel || '0', 10);
                currentZoom = (currentZoom + 1) % 3;
                this.dataset.zoomLevel = String(currentZoom);

                if (currentZoom === 0) {
                    this.style.transform = 'scale(1)';
                    this.style.transformOrigin = 'center center';
                    this.style.cursor = 'zoom-in';
                } else if (currentZoom === 1) {
                    var rect = this.getBoundingClientRect();
                    var xPercent = ((e.clientX - rect.left) / rect.width) * 100;
                    var yPercent = ((e.clientY - rect.top) / rect.height) * 100;
                    this.style.transformOrigin = xPercent + '% ' + yPercent + '%';
                    this.style.transform = 'scale(2)';
                    this.style.cursor = 'zoom-in';
                } else {
                    this.style.transform = 'scale(3)';
                    this.style.cursor = 'zoom-out';
                }
            });
        }

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && lightbox && lightbox.classList.contains('active')) {
                closeLightbox();
            }
        });
    }

    function getTranslation(key) {
        var lang = localStorage.getItem('preferredLanguage') || 'es';
        if (document.body.classList.contains('lang-en')) lang = 'en';
        if (window.pageTranslations && window.pageTranslations[lang] && window.pageTranslations[lang][key]) {
            return window.pageTranslations[lang][key];
        }
        return '';
    }

    function applyPageTranslations() {
        if (typeof window.changeLanguage === 'function') {
            window.changeLanguage(localStorage.getItem('preferredLanguage') || 'es');
        }
    }

    function getCategoryLabel(cat) {
        var labels = {
            'simbolico': 'Simbólico',
            'texto': 'Texto',
            'paisaje': 'Paisaje',
            'retrato': 'Retrato',
            'abstracto': 'Abstracto',
            'figurativo': 'Figurativo',
            'gatos': 'Gatos',
            'ilustracion': 'Ilustración',
            'otro': 'Otro'
        };
        return labels[cat] || cat || '';
    }

    function getWishlistKey() {
        return 'dda_wishlist';
    }

    function isInWishlist(id) {
        var items = JSON.parse(localStorage.getItem(getWishlistKey()) || '[]');
        return items.indexOf(id) !== -1;
    }

    function toggleWishlist(id, slug) {
        var items = JSON.parse(localStorage.getItem(getWishlistKey()) || '[]');
        var idx = items.indexOf(id);
        var added;
        if (idx === -1) {
            items.push(id);
            added = true;
        } else {
            items.splice(idx, 1);
            added = false;
        }
        localStorage.setItem(getWishlistKey(), JSON.stringify(items));

        if (slug && typeof DDAAuth !== 'undefined' && DDAAuth.isAuthenticated()) {
            var apiBase = window.DDA_API_BASE || '/api';
            fetch(apiBase + '/artworks/' + encodeURIComponent(slug) + '/like', {
                method: 'POST',
                credentials: 'include',
                headers: DDAAuth.authHeaders()
            }).catch(function () {});
        }

        return added;
    }

    function showToast(msg) {
        var existing = document.querySelector('.copy-toast');
        if (existing) existing.remove();
        var el = document.createElement('div');
        el.className = 'copy-toast';
        el.textContent = msg;
        document.body.appendChild(el);
        requestAnimationFrame(function () {
            el.classList.add('visible');
        });
        setTimeout(function () {
            el.classList.remove('visible');
            setTimeout(function () { el.remove(); }, 300);
        }, 2500);
    }

    function renderProduct(product) {
        _loadedProduct = product;
        var loading = document.getElementById('obraLoading');
        var content = document.getElementById('obraContent');
        if (loading) loading.style.display = 'none';
        if (content) content.style.display = 'grid';

        // Update page title and meta
        document.title = product.title + ' — Diego De Aduriz';
        var breadcrumbTitle = document.getElementById('breadcrumbTitle');
        if (breadcrumbTitle) breadcrumbTitle.textContent = product.title;

        var fullUrl = 'https://diegodeaduriz.art/shop/obra.html?id=' + encodeURIComponent(product.id);
        var fullImg = optimizeObraImage(product.image, 'detail');
        if (fullImg && fullImg.indexOf('http') !== 0) {
            fullImg = 'https://diegodeaduriz.art' + (fullImg.indexOf('/') === 0 ? '' : '/') + fullImg;
        }

        // Update OG meta
        var ogUrl = document.getElementById('og-url');
        var ogTitle = document.getElementById('og-title');
        var ogDesc = document.getElementById('og-description');
        var ogImg = document.getElementById('og-image');
        var twTitle = document.getElementById('tw-title');
        var twDesc = document.getElementById('tw-description');
        var twImg = document.getElementById('tw-image');

        if (ogUrl) ogUrl.setAttribute('content', fullUrl);
        if (ogTitle) ogTitle.setAttribute('content', product.title + ' — Diego De Aduriz');
        if (ogDesc) ogDesc.setAttribute('content', product.dimensions + ' · ' + product.technique);
        if (ogImg) ogImg.setAttribute('content', fullImg);
        if (twTitle) twTitle.setAttribute('content', product.title + ' — Diego De Aduriz');
        if (twDesc) twDesc.setAttribute('content', product.dimensions + ' · ' + product.technique);
        if (twImg) twImg.setAttribute('content', fullImg);

        // Main image
        var images = product.images || [product.image];
        var currentIndex = 0;
        var mainImg = document.getElementById('obraImg');
        if (mainImg) {
            setObraMainImage(mainImg, images[0]);
            mainImg.alt = product.title;
            mainImg.removeAttribute('width');
            mainImg.removeAttribute('height');
            mainImg.loading = 'eager';
            mainImg.decoding = 'async';
            mainImg.fetchPriority = 'high';
            mainImg.onerror = function () {
                this.src = '/portfolio/sections/obras/MG_1192.jpg';
            };
        }

        // Thumbnails
        var thumbContainer = document.getElementById('obraThumbnails');
        if (thumbContainer && images.length > 1) {
            images.forEach(function (imgSrc, i) {
                var thumb = document.createElement('div');
                thumb.className = 'obra-thumb' + (i === 0 ? ' active' : '');
                var img = document.createElement('img');
                img.src = optimizeObraImage(imgSrc, 'thumb');
                img.alt = product.title + ' - imagen ' + (i + 1);
                img.loading = 'lazy';
                img.decoding = 'async';
                img.width = 72;
                img.height = 72;
                thumb.appendChild(img);
                thumb.addEventListener('click', function () {
                    currentIndex = i;
                    setObraMainImage(mainImg, imgSrc);
                    thumbContainer.querySelectorAll('.obra-thumb').forEach(function (t) { t.classList.remove('active'); });
                    thumb.classList.add('active');
                });
                thumbContainer.appendChild(thumb);
            });
        }

        // Sold badge
        var soldBadge = document.getElementById('obraSoldBadge');
        if (soldBadge) soldBadge.style.display = product.sold ? 'block' : 'none';

        // Title, availability & price
        var titleEl = document.getElementById('obraTitle');
        var availabilityEl = document.getElementById('obraAvailability');
        var priceEl = document.getElementById('obraPrice');
        var inquiryHint = document.getElementById('obraInquiryHint');
        var soldPanel = document.getElementById('obraSoldPanel');
        var actionsEl = document.getElementById('obraActions');

        if (titleEl) titleEl.textContent = product.title;
        if (availabilityEl) {
            if (product.sold) {
                availabilityEl.hidden = true;
                availabilityEl.textContent = '';
            } else {
                availabilityEl.hidden = false;
                availabilityEl.textContent = getTranslation('obra.available') || 'Disponible para consulta';
                availabilityEl.className = 'obra-availability obra-availability--open';
            }
        }
        if (priceEl) {
            if (product.sold) {
                priceEl.hidden = true;
                priceEl.textContent = '';
                priceEl.classList.remove('obra-price--sold');
            } else {
                priceEl.hidden = false;
                priceEl.textContent = product.price || 'Consultar';
                priceEl.classList.remove('obra-price--sold');
            }
        }
        if (inquiryHint) inquiryHint.hidden = !!product.sold;
        if (soldPanel) soldPanel.hidden = !product.sold;
        if (actionsEl) actionsEl.hidden = !!product.sold;

        // Meta
        setMetaRow('obraDimensionsRow', 'obraDimensions', product.dimensions);
        setMetaRow('obraTechniqueRow', 'obraTechnique', product.technique);
        setMetaRow('obraYearRow', 'obraYear', product.year);
        setMetaRow('obraCategoryRow', 'obraCategory', getCategoryLabel(product.category));

        // Description
        var descEl = document.getElementById('obraDescription');
        if (descEl) {
            if (product.description) {
                descEl.innerHTML = product.description;
            } else {
                descEl.style.display = 'none';
            }
        }

        // Add to cart
        var cartBtn = document.getElementById('obraAddCart');
        if (cartBtn) {
            if (product.sold) {
                cartBtn.style.display = 'none';
            } else {
                updateCartButton(cartBtn, product);
                cartBtn.addEventListener('click', function () {
                    if (typeof DDACart === 'undefined') return;
                    var added = DDACart.addItem(product);
                    if (added) showToast('Agregado a tu selección');
                    updateCartButton(cartBtn, product);
                });
            }
        }

        // WhatsApp
        var waBtn = document.getElementById('obraWhatsApp');
        if (waBtn && !product.sold) {
            var waMsg = 'Hola Diego, me interesa la obra "' + product.title + '"';
            if (product.price && product.price !== 'Consultar') waMsg += ' (' + product.price + ')';
            waMsg += '. ¿Podés contarme disponibilidad y envío?';
            waBtn.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(waMsg);
            waBtn.addEventListener('click', function () {
                if (typeof trackGenerateLead === 'function') {
                    trackGenerateLead(product, 'whatsapp_obra');
                }
            });
        }

        if (typeof trackViewItem === 'function') {
            trackViewItem(product);
        }

        applyPageTranslations();

        // Wishlist
        var wishBtn = document.getElementById('obraWishlist');
        var wishText = document.getElementById('wishlistText');
        if (wishBtn) {
            var wid = product.id || product.title;
            updateWishlistButton(wishBtn, wishText, wid);
            wishBtn.addEventListener('click', function () {
                var nowIn = toggleWishlist(wid, product.slug);
                updateWishlistButton(wishBtn, wishText, wid);
                showToast(nowIn ? 'Agregado a favoritos' : 'Eliminado de favoritos');
                if (nowIn && typeof trackAddToWishlist === 'function') trackAddToWishlist(product);
            });
        }

        // Track view: server-side + GA4
        var viewSlug = product.slug || product.id;
        var apiBase = window.DDA_API_BASE || '/api';
        fetch(apiBase + '/artworks/' + encodeURIComponent(viewSlug) + '/view', { method: 'POST' }).catch(function () {});
        if (typeof trackViewItem === 'function') trackViewItem(product);

        // Track recently viewed for shop carousel
        (function () {
            var rvKey = 'dda_recently_viewed';
            var rv = JSON.parse(localStorage.getItem(rvKey) || '[]');
            var rvId = product.slug || product.id || product.title;
            rv = rv.filter(function (r) { return String(r.id) !== String(rvId); });
            rv.unshift({ id: rvId, title: product.title, image: (product.images && product.images[0]) || product.image || '', year: product.year || '' });
            if (rv.length > 8) rv = rv.slice(0, 8);
            localStorage.setItem(rvKey, JSON.stringify(rv));
        })();

        if (typeof DDAComments !== 'undefined') {
            var commentSlug = product.slug || product.id;
            DDAComments.mountArtworkSection(commentSlug);
        }

        // Share buttons
        setupShare(product, fullUrl, fullImg);

        // Related artworks
        renderRelated(product);

        function refreshRelatedFromLiveData() {
            fetchRelatedFromApi(product).then(function (apiRelated) {
                if (!apiRelated.length) return;
                var merged = apiRelated.slice();
                var seen = {};
                merged.forEach(function (p) {
                    seen[String(p.slug || p.id || '')] = true;
                });
                (window.products || []).forEach(function (p) {
                    var key = String(p.slug || p.id || '');
                    if (!key || seen[key]) return;
                    seen[key] = true;
                    merged.push(p);
                });
                window.products = merged;
                renderRelated(product);
            });
        }

        if (typeof DDAApi !== 'undefined' && DDAApi.loadProducts) {
            DDAApi.loadProducts().then(function () {
                renderRelated(product);
                refreshRelatedFromLiveData();
            }).catch(function () {
                refreshRelatedFromLiveData();
            });
        } else {
            refreshRelatedFromLiveData();
        }
    }

    function setMetaRow(rowId, valueId, value) {
        var row = document.getElementById(rowId);
        var valueEl = document.getElementById(valueId);
        if (!value || value === 'undefined' || value === 'a confirmar') {
            if (row) row.style.display = 'none';
        } else {
            if (valueEl) valueEl.textContent = value;
        }
    }

    function updateCartButton(btn, product) {
        if (typeof DDACart === 'undefined') return;
        var inCart = DDACart.isInCart(product.id);
        btn.disabled = inCart;
        var labelEl = document.getElementById('obraAddCartLabel');
        var label = inCart
            ? (getTranslation('obra.in_cart') || 'Ya está en el carrito')
            : (getTranslation('obra.add_selection') || 'Agregar a mi selección');
        if (labelEl) {
            labelEl.textContent = label;
        } else {
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> ' + label;
        }
    }

    function updateWishlistButton(btn, textEl, id) {
        var inList = isInWishlist(id);
        if (inList) {
            btn.classList.add('active');
            if (textEl) textEl.textContent = getTranslation('obra.wishlist_active') || 'En tus favoritos';
        } else {
            btn.classList.remove('active');
            if (textEl) textEl.textContent = getTranslation('obra.wishlist_add') || 'Agregar a favoritos';
        }
    }

    function setupShare(product, url, imgUrl) {
        var title = product.title + ' — Diego De Aduriz';
        var text = product.title + ' · ' + (product.dimensions || '') + ' · ' + (product.technique || '');

        var shareWA = document.getElementById('shareWhatsApp');
        if (shareWA) {
            shareWA.addEventListener('click', function () {
                window.open('https://wa.me/?text=' + encodeURIComponent(title + '\n' + url), '_blank');
            });
        }

        var shareTW = document.getElementById('shareTwitter');
        if (shareTW) {
            shareTW.addEventListener('click', function () {
                window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(title) + '&url=' + encodeURIComponent(url), '_blank');
            });
        }

        var shareFB = document.getElementById('shareFacebook');
        if (shareFB) {
            shareFB.addEventListener('click', function () {
                window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url), '_blank');
            });
        }

        var sharePIN = document.getElementById('sharePinterest');
        if (sharePIN) {
            sharePIN.addEventListener('click', function () {
                var pinUrl = 'https://pinterest.com/pin/create/button/'
                    + '?url='         + encodeURIComponent(url)
                    + '&media='       + encodeURIComponent(imgUrl)
                    + '&description=' + encodeURIComponent(title);
                window.open(pinUrl, '_blank', 'width=750,height=550');
            });
        }

        var shareIG = document.getElementById('shareInstagram');
        if (shareIG) {
            shareIG.addEventListener('click', function () {
                navigator.clipboard.writeText(url).then(function () {
                    showToast('Enlace copiado — pegalo en tu historia de Instagram');
                }).catch(function () {
                    showToast('Enlace copiado');
                });
            });
        }

        var shareCopy = document.getElementById('shareCopy');
        if (shareCopy) {
            shareCopy.addEventListener('click', function () {
                navigator.clipboard.writeText(url).then(function () {
                    showToast('Enlace copiado');
                }).catch(function () {
                    var input = document.createElement('input');
                    input.value = url;
                    document.body.appendChild(input);
                    input.select();
                    document.execCommand('copy');
                    document.body.removeChild(input);
                    showToast('Enlace copiado');
                });
            });
        }
    }

    function mapApiArtworkToRelated(artwork) {
        var images = Array.isArray(artwork.images) ? artwork.images.slice() : [];
        images.sort(function (a, b) {
            return (a.sortOrder || 0) - (b.sortOrder || 0);
        });
        var primary = images.find(function (img) {
            return img && (img.isPrimary === true || img.primary === true);
        }) || images[0];
        var imagePath = primary
            ? (primary.filePath || primary.url || primary.imageUrl || '')
            : (artwork.imageUrl || artwork.image || '');
        if (imagePath && typeof DDAImages !== 'undefined') {
            imagePath = DDAImages.resolveImageUrl(imagePath, window.location.href);
        }
        return {
            id: artwork.slug || String(artwork.id || ''),
            slug: artwork.slug || String(artwork.id || ''),
            title: artwork.title || '',
            image: imagePath,
            price: artwork.price || 'Consultar',
            category: (artwork.category && artwork.category.name)
                ? String(artwork.category.name).toLowerCase()
                : String(artwork.category || '').toLowerCase(),
            technique: artwork.technique || '',
            sold: artwork.sold === true
        };
    }

    function fetchRelatedFromApi(product) {
        var category = String(product.category || '').trim();
        if (!category) return Promise.resolve([]);

        var apiBase = window.DDA_API_BASE || 'https://api.diegodeaduriz.art/api';
        var url = apiBase.replace(/\/$/, '') + '/artworks/category/' + encodeURIComponent(category)
            + '?page=0&size=12&available=true';

        return fetch(url, {
            headers: { Accept: 'application/json' },
            credentials: 'omit'
        })
            .then(function (res) {
                if (!res.ok) throw new Error('related');
                return res.json();
            })
            .then(function (data) {
                return (data.content || []).map(mapApiArtworkToRelated);
            })
            .catch(function () {
                return [];
            });
    }

    function pickRelatedProducts(product, pool) {
        var source = Array.isArray(pool) ? pool : [];
        var productKey = String(product.slug || product.id || '');

        var related = source.filter(function (p) {
            var pKey = String(p.slug || p.id || '');
            if (!pKey || pKey === productKey) return false;
            return p.category === product.category || p.technique === product.technique;
        }).slice(0, 8);

        if (related.length === 0) {
            related = source.filter(function (p) {
                return String(p.slug || p.id || '') !== productKey;
            }).slice(0, 8);
        }

        return related;
    }

    function renderRelated(product) {
        var pool = window.products || [];
        var related = pickRelatedProducts(product, pool);

        if (related.length === 0) return;

        var section = document.getElementById('obraRelated');
        var track = document.getElementById('relatedGrid');
        if (!section || !track) return;

        track.innerHTML = '';
        section.style.display = 'block';

        related.forEach(function (p) {
            var slug = p.slug || p.id;
            var card = document.createElement('a');
            card.className = 'related-card';
            card.href = 'obra.html?id=' + encodeURIComponent(slug);

            var imgDiv = document.createElement('div');
            imgDiv.className = 'related-card-img';

            if (p.sold) {
                var badge = document.createElement('span');
                badge.className = 'related-card-badge';
                badge.textContent = getTranslation('card.sold') || 'VENDIDO';
                imgDiv.appendChild(badge);
            }

            var img = document.createElement('img');
            var imgSrc = p.image || '';
            if (typeof DDAImages !== 'undefined' && imgSrc) {
                var resolved = DDAImages.resolveImageUrl(imgSrc, window.location.href);
                imgSrc = DDAImages.isCloudinaryUrl(resolved)
                    ? DDAImages.getCardImageUrl(resolved)
                    : resolved;
            }
            img.src = imgSrc;
            img.alt = p.title || '';
            img.loading = 'lazy';
            img.decoding = 'async';
            img.onerror = function () { this.src = '/portfolio/sections/obras/MG_1192.jpg'; };
            imgDiv.appendChild(img);

            var titleEl = document.createElement('p');
            titleEl.className = 'related-card-title';
            titleEl.textContent = p.title || '';

            card.appendChild(imgDiv);
            card.appendChild(titleEl);

            if (!p.sold) {
                var priceEl = document.createElement('p');
                priceEl.className = 'related-card-price';
                priceEl.textContent = p.price || 'Consultar';
                card.appendChild(priceEl);
            }
            track.appendChild(card);
        });

        if (typeof window.updatePageTranslations === 'function') {
            window.updatePageTranslations();
        }
    }

    // Auth header
    function renderAuthHeader() {
        var authBtns = document.getElementById('authHeaderBtns');
        if (!authBtns || typeof DDAAuth === 'undefined') return;

        var cartBtnHtml = '<a href="cart.html" class="auth-header-link cart-header-link" aria-label="Carrito">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>' +
            '<span class="cart-badge" style="display:none">0</span></a>';

        if (DDAAuth.isAuthenticated()) {
            var user = DDAAuth.getUser();
            var isAdmin = user && user.role === 'ADMIN';
            authBtns.innerHTML = cartBtnHtml +
                '<a href="mi-cuenta.html" class="auth-header-link">' +
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ' +
                    'MI CUENTA' +
                '</a>' +
                (isAdmin ? '<a href="admin.html" class="auth-header-link">PANEL</a>' : '') +
                '<a href="#" class="auth-header-link" id="headerLogout">SALIR</a>';
            var logoutLink = document.getElementById('headerLogout');
            if (logoutLink) {
                logoutLink.addEventListener('click', function (e) {
                    e.preventDefault();
                    DDAAuth.logout();
                });
            }
        } else {
            authBtns.innerHTML = cartBtnHtml +
                '<a href="user-login.html#register" class="auth-header-link">CREAR CUENTA</a>' +
                '<a href="user-login.html" class="auth-header-link">INICIAR SESIÓN</a>';
        }

        if (typeof DDACart !== 'undefined') DDACart.updateBadge();
    }

    function showNotFound() {
        var loading = document.getElementById('obraLoading');
        var notFound = document.getElementById('obraNotFound');
        if (loading) loading.style.display = 'none';
        if (notFound) notFound.style.display = 'block';
    }

    // Init
    function init() {
        setupObraLightbox();
        renderAuthHeader();

        var id = getProductId();
        if (!id) {
            showNotFound();
            return;
        }

        var product = findProduct(id);
        if (product) {
            renderProduct(product);
        } else {
            fetchFromApi(id)
                .then(function (apiProduct) {
                    renderProduct(apiProduct);
                })
                .catch(function () {
                    showNotFound();
                });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.addEventListener('languageChanged', function () {
        applyPageTranslations();
        if (!_loadedProduct) return;
        var cartBtn = document.getElementById('obraAddCart');
        var wishBtn = document.getElementById('obraWishlist');
        var wishText = document.getElementById('wishlistText');
        if (cartBtn) updateCartButton(cartBtn, _loadedProduct);
        if (wishBtn && wishText) {
            updateWishlistButton(wishBtn, wishText, _loadedProduct.id || _loadedProduct.title);
        }
    });
})();
