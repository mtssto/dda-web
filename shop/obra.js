(function () {
    'use strict';

    var WA_NUMBER = '5491160139563';

    const closeBtn = document.getElementById("closeBtn");

    if (closeBtn) {
        closeBtn.addEventListener("click", (e) => {
            e.preventDefault();

            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = "../index.html";
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
        return fetch(apiBase + '/artworks/' + encodeURIComponent(slug), {
            headers: { 'Accept': 'application/json' }
        })
        .then(function (res) {
            if (!res.ok) throw new Error('Not found');
            return res.json();
        })
        .then(function (artwork) {
            var imagePath = '';
            if (artwork.images && artwork.images.length > 0) {
                imagePath = artwork.images[0].filePath || artwork.images[0].url || '';
            }
            var allImages = (artwork.images || []).map(function (img) {
                return img.filePath || img.url || '';
            }).filter(Boolean);

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
                image: imagePath || '/portfolio/sections/obras/MG_1192.jpg',
                images: allImages.length > 0 ? allImages : [imagePath || '/portfolio/sections/obras/MG_1192.jpg'],
                sold: artwork.sold || false,
                year: artwork.year || ''
            };
        });
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

    function toggleWishlist(id) {
        var items = JSON.parse(localStorage.getItem(getWishlistKey()) || '[]');
        var idx = items.indexOf(id);
        if (idx === -1) {
            items.push(id);
        } else {
            items.splice(idx, 1);
        }
        localStorage.setItem(getWishlistKey(), JSON.stringify(items));
        return idx === -1;
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
        var loading = document.getElementById('obraLoading');
        var content = document.getElementById('obraContent');
        if (loading) loading.style.display = 'none';
        if (content) content.style.display = 'grid';

        // Update page title and meta
        document.title = product.title + ' — Diego De Aduriz';
        var breadcrumbTitle = document.getElementById('breadcrumbTitle');
        if (breadcrumbTitle) breadcrumbTitle.textContent = product.title;

        var fullUrl = 'https://diegodeaduriz.art/shop/obra.html?id=' + encodeURIComponent(product.id);
        var fullImg = product.image.startsWith('http') ? product.image : 'https://diegodeaduriz.art' + product.image;

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
            mainImg.src = images[0];
            mainImg.alt = product.title;
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
                img.src = imgSrc;
                img.alt = product.title + ' - imagen ' + (i + 1);
                thumb.appendChild(img);
                thumb.addEventListener('click', function () {
                    currentIndex = i;
                    mainImg.src = imgSrc;
                    thumbContainer.querySelectorAll('.obra-thumb').forEach(function (t) { t.classList.remove('active'); });
                    thumb.classList.add('active');
                });
                thumbContainer.appendChild(thumb);
            });
        }

        // Sold badge
        var soldBadge = document.getElementById('obraSoldBadge');
        if (soldBadge && product.sold) soldBadge.style.display = 'block';

        // Title & Price
        var titleEl = document.getElementById('obraTitle');
        var priceEl = document.getElementById('obraPrice');
        if (titleEl) titleEl.textContent = product.title;
        if (priceEl) priceEl.textContent = product.price || 'Consultar';

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
        if (waBtn) {
            var waMsg = 'Hola, me interesa la obra: ' + product.title;
            if (product.price && product.price !== 'Consultar') waMsg += ' (' + product.price + ')';
            waBtn.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(waMsg);
            if (product.sold) waBtn.style.display = 'none';
        }

        // Wishlist
        var wishBtn = document.getElementById('obraWishlist');
        var wishText = document.getElementById('wishlistText');
        if (wishBtn) {
            var wid = product.id || product.title;
            updateWishlistButton(wishBtn, wishText, wid);
            wishBtn.addEventListener('click', function () {
                var nowIn = toggleWishlist(wid);
                updateWishlistButton(wishBtn, wishText, wid);
                showToast(nowIn ? 'Agregado a favoritos' : 'Eliminado de favoritos');
            });
        }

        // Zoom / Lightbox
        var mainImageContainer = document.getElementById('obraMainImage');
        var zoomBtn = document.getElementById('obraZoomBtn');
        var lightbox = document.getElementById('obraLightbox');
        var lightboxImg = document.getElementById('lightboxImg');
        var lightboxClose = document.getElementById('lightboxClose');

        function openLightbox() {
            if (lightbox && lightboxImg && mainImg) {
                lightboxImg.src = mainImg.src;
                lightboxImg.alt = mainImg.alt;
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }

        function closeLightbox() {
            if (lightbox) {
                lightbox.classList.remove('active');
                document.body.style.overflow = '';
            }
        }

        if (mainImageContainer) mainImageContainer.addEventListener('click', openLightbox);
        if (zoomBtn) zoomBtn.addEventListener('click', function (e) { e.stopPropagation(); openLightbox(); });
        if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
        if (lightbox) lightbox.addEventListener('click', function (e) {
            if (e.target === lightbox) closeLightbox();
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeLightbox();
        });

        if (typeof DDAComments !== 'undefined') {
            var commentSlug = product.slug || product.id;
            DDAComments.mountArtworkSection(commentSlug);
        }

        // Share buttons
        setupShare(product, fullUrl, fullImg);

        // Related artworks
        renderRelated(product);
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
        var label = inCart ? 'Ya está en el carrito' : 'Agregar al carrito';
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> ' + label;
    }

    function updateWishlistButton(btn, textEl, id) {
        var inList = isInWishlist(id);
        if (inList) {
            btn.classList.add('active');
            if (textEl) textEl.textContent = 'En tus favoritos';
        } else {
            btn.classList.remove('active');
            if (textEl) textEl.textContent = 'Agregar a favoritos';
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

    function renderRelated(product) {
        if (!window.products) return;
        var related = window.products.filter(function (p) {
            return p.id !== product.id && (p.category === product.category || p.technique === product.technique);
        }).slice(0, 4);

        if (related.length === 0) {
            related = window.products.filter(function (p) { return p.id !== product.id; }).slice(0, 4);
        }

        if (related.length === 0) return;

        var section = document.getElementById('obraRelated');
        var grid = document.getElementById('relatedGrid');
        if (!section || !grid) return;

        section.style.display = 'block';

        related.forEach(function (p) {
            var card = document.createElement('a');
            card.className = 'related-card';
            card.href = 'obra.html?id=' + encodeURIComponent(p.id);

            var imgDiv = document.createElement('div');
            imgDiv.className = 'related-card-img';
            var img = document.createElement('img');
            img.src = p.image;
            img.alt = p.title;
            img.loading = 'lazy';
            img.onerror = function () { this.src = '/portfolio/sections/obras/MG_1192.jpg'; };
            imgDiv.appendChild(img);

            var titleEl = document.createElement('p');
            titleEl.className = 'related-card-title';
            titleEl.textContent = p.title;

            var priceEl = document.createElement('p');
            priceEl.className = 'related-card-price';
            priceEl.textContent = p.sold ? 'Vendida' : (p.price || 'Consultar');

            card.appendChild(imgDiv);
            card.appendChild(titleEl);
            card.appendChild(priceEl);
            grid.appendChild(card);
        });
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
})();
