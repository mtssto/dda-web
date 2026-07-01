// Filter functionality
// Products are loaded from products.js into window.products

// Performance constants used by global carousel renderer.
// Keep these outside DOMContentLoaded because renderCarouselSections() is global.
const SHOP_CAROUSEL_INITIAL_ITEMS = 6;
const SHOP_DEFER_SECTION_RENDER_MS = 120;

function getSizeBucket(dimensionsStr) {
    if (!dimensionsStr || dimensionsStr === 'Consultar medidas' ||
        dimensionsStr === 'undefined' || dimensionsStr.trim() === '') {
        return 'consult';
    }
    var nums = dimensionsStr.replace(/,/g, '.').match(/[\d.]+/g);
    if (!nums || nums.length < 2) return 'consult';
    var parse = function (v) { var n = parseFloat(v); return n < 10 ? n * 100 : n; };
    var max = Math.max(parse(nums[0]), parse(nums[1]));
    if (max <= 50) return 'small';
    if (max <= 120) return 'medium';
    return 'large';
}


// Wishlist keys must be stable across the old static shop data and the new backend catalog data.
// Static products.js IDs may not match database IDs, so shop.html stores title/slug first.
function getShopWishlistId(product) {
    if (!product) return '';
    return String(product.slug || product.title || product.id || product.image || '').trim();
}

function getObraUrl(product) {
    if (!product) return '';
    var detailId = product.slug || product.id;
    return detailId ? 'obra.html?id=' + encodeURIComponent(detailId) : '';
}

function navigateToObra(product) {
    var url = getObraUrl(product);
    if (url) {
        window.location.href = url;
        return;
    }
    openModal(product);
}

function readDdaWishlist() {
    try {
        var parsed = JSON.parse(localStorage.getItem('dda_wishlist') || '[]');
        return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch (error) {
        console.warn('Could not read wishlist:', error);
        return [];
    }
}

function saveDdaWishlist(wishlist) {
    var normalized = [];
    (wishlist || []).forEach(function (item) {
        var value = String(item || '').trim();
        if (value && normalized.indexOf(value) === -1) normalized.push(value);
    });
    localStorage.setItem('dda_wishlist', JSON.stringify(normalized));
}


function readDdaWishlistItems() {
    try {
        var parsed = JSON.parse(localStorage.getItem('dda_wishlist_items') || '{}');
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
        console.warn('Could not read wishlist item cache:', error);
        return {};
    }
}

function saveDdaWishlistItems(items) {
    localStorage.setItem('dda_wishlist_items', JSON.stringify(items || {}));
}

function getShopFavoriteSnapshot(product) {
    var id = getShopWishlistId(product);
    var images = [];

    if (Array.isArray(product && product.images)) {
        images = product.images;
    } else if (product && product.image) {
        images = [product.image];
    }

    return {
        id: id,
        backendId: product && product.backendId ? product.backendId : null,
        slug: product && product.slug ? product.slug : '',
        title: product && product.title ? product.title : 'Obra sin título',
        image: product && product.image ? product.image : '',
        images: images,
        price: product && product.price ? product.price : 'Consultar',
        technique: product && product.technique ? product.technique : '',
        dimensions: product && product.dimensions ? product.dimensions : '',
        year: product && product.year ? product.year : '',
        category: product && product.category ? product.category : '',
        sold: product && product.sold === true,
        cachedAt: new Date().toISOString(),
        source: 'shop'
    };
}

function isShopProductWished(product) {
    var id = getShopWishlistId(product);
    return id && readDdaWishlist().indexOf(id) !== -1;
}

function toggleShopWishlist(product, button) {
    var id = getShopWishlistId(product);
    if (!id) return;

    var wishlist = readDdaWishlist();
    var wishlistItems = readDdaWishlistItems();
    var index = wishlist.indexOf(id);

    if (index === -1) {
        wishlist.push(id);
        wishlistItems[id] = getShopFavoriteSnapshot(product);
        if (button) button.classList.add('active');
    } else {
        wishlist.splice(index, 1);
        delete wishlistItems[id];
        if (button) button.classList.remove('active');
    }

    saveDdaWishlist(wishlist);
    saveDdaWishlistItems(wishlistItems);

    // Keep duplicated carousel cards visually synced.
    document.querySelectorAll('.btn-wishlist[data-product-id="' + cssEscapeSafe(id) + '"]').forEach(function (btn) {
        btn.classList.toggle('active', wishlist.indexOf(id) !== -1);
    });
}

function escapeAttributeValue(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function cssEscapeSafe(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') {
        return window.CSS.escape(String(value));
    }
    return String(value).replace(/"/g, '\\"');
}

function resetShopCarouselContainer() {
    var container = document.getElementById('carouselSectionsContainer');
    var featured = document.getElementById('shopHeroFeatured');
    if (container) {
        delete container.dataset.rendered;
        container.innerHTML = '';
    }
    if (featured) {
        delete featured.dataset.rendered;
        featured.innerHTML = '';
        delete featured.dataset.skeleton;
    }
}

function renderShopCarouselSkeletons() {
    var featured = document.getElementById('shopHeroFeatured');
    if (!featured || featured.dataset.skeleton === 'true') return;

    featured.dataset.skeleton = 'true';
    featured.setAttribute('aria-busy', 'true');
    featured.innerHTML =
        '<div class="carousel-skeleton" aria-hidden="true">' +
            '<div class="carousel-skeleton__label"></div>' +
            '<div class="carousel-skeleton__track">' +
                '<div class="carousel-skeleton__card"></div>'.repeat(4) +
            '</div>' +
        '</div>';
}

function updateShopCategoryCounts() {
    if (!window.products || !window.products.length) return;
    var counts = {};
    window.products.forEach(function (p) {
        var cat = p.category || 'other';
        counts[cat] = (counts[cat] || 0) + 1;
    });
    document.querySelectorAll('.cd-option').forEach(function (opt) {
        var val = opt.getAttribute('data-value');
        if (!val || val === 'all') {
            opt.innerHTML = opt.textContent.trim() + ' <span class="cd-count">(' + window.products.length + ')</span>';
        } else if (counts[val]) {
            opt.innerHTML = opt.textContent.trim() + ' <span class="cd-count">(' + counts[val] + ')</span>';
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    // Re-apply translations on load to catch page-specific ones
    const savedLang = localStorage.getItem('preferredLanguage') || 'es';
    const isCatalogPage = document.body.classList.contains('catalog-page') || window.location.pathname.includes('catalog');

    if (window.changeLanguage) {
        window.changeLanguage(savedLang);
    }

    function initShopContent() {
        // Dynamic product count on hero + "See All" button
        const btnSeeAll = document.getElementById('btnSeeAll');
        const heroCount = document.getElementById('heroObraCount');
        const catalogFloatCount = document.getElementById('catalogFloatCount');
        if (window.products && window.products.length > 0) {
            const totalCount = window.products.length;
            const availableCount = window.products.filter(function (p) { return !p.sold; }).length;
            const lang = localStorage.getItem('preferredLanguage') || 'es';
            const countLabel = lang === 'en'
                ? availableCount + ' works available'
                : availableCount + ' obras disponibles';
            if (btnSeeAll) {
                btnSeeAll.textContent = lang === 'en'
                    ? `VIEW ALL ${totalCount} WORKS`
                    : `VER LAS ${totalCount} OBRAS DEL CATÁLOGO`;
            }
            if (heroCount) {
                heroCount.textContent = countLabel;
            }
            if (catalogFloatCount) {
                catalogFloatCount.textContent = '(' + totalCount + ')';
            }
        }

        // catalog.html is rendered by catalog-api.js. Keep shop.js loaded there only
        // for shared behavior: modal, lightbox, auth header, PDF, etc.
        if (isCatalogPage) {
            return;
        }

        renderCarouselSections();

        scheduleShopSectionNavUpdate();

        const gridParams = document.getElementById('productsGrid');
        if (gridParams) {
            renderGrid(window.products || []);
        }

        updateShopCategoryCounts();
    }

    function bootstrapShopPage() {
        if (isCatalogPage) return;

        resetShopCarouselContainer();
        initShopContent();

        if (window.changeLanguage) {
            window.changeLanguage(savedLang);
        }
    }

    if (!isCatalogPage) {
        renderShopCarouselSkeletons();
    }

    // Load live catalog from API, then render (products.js is fallback only).
    if (isCatalogPage) {
        initShopContent();
    } else if (typeof DDAApi !== 'undefined' && DDAApi.loadProducts) {
        DDAApi.loadProducts().then(bootstrapShopPage).catch(bootstrapShopPage);
    } else {
        bootstrapShopPage();
    }

    // Filter Logic
    const categoryFilter = document.getElementById('categoryFilter');
    const sizeFilter    = document.getElementById('sizeFilter');
    const searchInput   = document.getElementById('shopSearchInput');
    const searchClear   = document.getElementById('shopSearchClear');
    const searchCount   = document.getElementById('shopSearchCount');
    let   searchQuery   = '';

    function applyFilters() {
        const selectedCategory = categoryFilter ? categoryFilter.value : 'all';
        const selectedSize     = sizeFilter     ? sizeFilter.value     : 'all';
        // Normalize: remove accents, special chars, lowercase
        const normalize = str => str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')  // strip accent marks
            .replace(/[^a-z0-9 ]/g, ' ')        // non-alphanumeric → space
            .replace(/\s+/g, ' ')               // collapse spaces
            .trim();

        const q            = normalize(searchQuery);
        const qWords       = q.split(' ').filter(Boolean); // split into words
        const productCards = document.querySelectorAll('.product-card');
        let   visibleCount = 0;

        productCards.forEach(card => {
            const category   = card.getAttribute('data-category') || '';
            const dimsRaw    = card.getAttribute('data-dimensions') || '';
            const sizeBucket = getSizeBucket(dimsRaw);

            const titleEl    = card.querySelector('.product-title');
            const searchable = normalize([
                titleEl ? titleEl.textContent : '',
                card.getAttribute('data-technique') || '',
                dimsRaw,
                card.getAttribute('data-year') || '',
                category
            ].join(' '));

            const categoryMatch = (selectedCategory === 'all' || category === selectedCategory);
            const sizeMatch     = (selectedSize === 'all'     || sizeBucket === selectedSize);
            // Every word in the query must appear somewhere in searchable
            const searchMatch   = !q || qWords.every(word => searchable.includes(word));

            if (categoryMatch && sizeMatch && searchMatch) {
                card.style.display = '';
                card.classList.remove('stagger-in');
                card.style.animationDelay = (visibleCount * 0.04) + 's';
                void card.offsetWidth;
                card.classList.add('stagger-in');
                visibleCount++;
            } else {
                card.style.display = 'none';
                card.classList.remove('stagger-in');
            }
        });

        // Count label
        if (searchCount) {
            searchCount.textContent = q
                ? (visibleCount === 1 ? '1 obra encontrada' : visibleCount + ' obras encontradas')
                : '';
        }

        // No-results message
        const grid = document.getElementById('productsGrid');
        if (grid) {
            let noRes = grid.querySelector('.search-no-results');
            if (visibleCount === 0 && q) {
                if (!noRes) {
                    noRes = document.createElement('p');
                    noRes.className = 'search-no-results';
                    grid.appendChild(noRes);
                }
                noRes.textContent = 'No se encontraron obras para "' + searchQuery + '"';
            } else if (noRes) {
                noRes.remove();
            }
        }
    }

    if (!isCatalogPage && categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }
    if (!isCatalogPage && sizeFilter) {
        sizeFilter.addEventListener('change', applyFilters);
    }



    // ── Search input ──────────────────────────────────────
    if (searchInput && !isCatalogPage) {
        const isCatalogSearchPage = window.location.pathname.includes('catalog');

        searchInput.addEventListener('input', () => {
            searchQuery = searchInput.value;
            if (searchClear) {
                searchClear.classList.toggle('visible', searchQuery.length > 0);
            }

            if (isCatalogSearchPage) {
                applyFilters();
            }
            // Shop page uses live dropdown (handled separately)
        });

        // Clear on X click
        if (searchClear) {
            searchClear.addEventListener('click', () => {
                searchInput.value = '';
                searchQuery = '';
                searchClear.classList.remove('visible');
                if (searchCount) searchCount.textContent = '';
                applyFilters();
                searchInput.focus();
            });
        }

        searchInput.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                searchQuery = '';
                if (searchClear) searchClear.classList.remove('visible');
                if (searchCount) searchCount.textContent = '';
                applyFilters();
            }
            if (e.key === 'Enter' && !isCatalogSearchPage && searchInput.value.trim()) {
                window.location.href = 'catalog.html?q=' + encodeURIComponent(searchInput.value.trim());
            }
        });
    }

    // ── Custom dropdown wiring ────────────────────────────
    function initCustomDropdowns() {
        document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
            const trigger = dropdown.querySelector('.cd-trigger');
            const label = dropdown.querySelector('.cd-label');
            const list = dropdown.querySelector('.cd-list');
            const options = dropdown.querySelectorAll('.cd-option');
            // Find the hidden <select> sibling
            const selectEl = dropdown.previousElementSibling;

            if (!trigger || !list) return;

            // Toggle open/close
            trigger.addEventListener('click', e => {
                e.stopPropagation();
                const isOpen = dropdown.classList.contains('open');
                // Close all others
                document.querySelectorAll('.custom-dropdown.open').forEach(d => d.classList.remove('open'));
                if (!isOpen) dropdown.classList.add('open');
            });

            // Select option
            options.forEach(opt => {
                opt.addEventListener('click', () => {
                    const val = opt.dataset.value;
                    const text = opt.querySelector('.cd-hint')
                        ? opt.childNodes[0].textContent.trim()
                        : opt.textContent.trim();

                    // Update label
                    label.textContent = text;

                    // Update active state
                    options.forEach(o => o.classList.remove('active'));
                    opt.classList.add('active');

                    // Sync hidden select
                    if (selectEl && selectEl.tagName === 'SELECT') {
                        selectEl.value = val;
                        selectEl.dispatchEvent(new Event('change'));
                    }

                    dropdown.classList.remove('open');
                });
            });
        });

        // Close on outside click
        document.addEventListener('click', () => {
            document.querySelectorAll('.custom-dropdown.open').forEach(d => d.classList.remove('open'));
        });
    }

    if (!isCatalogPage) {
        initCustomDropdowns();
    }

    // Modal Injection Logic (as raw string to avoid CORS on file:/// protocol)
    const modalHTML = `
        <!-- Modal for Info View -->
        <div id="imageModal" class="image-modal" role="dialog" aria-modal="true" aria-label="Detalle de obra">
            <button class="modal-close" aria-label="Cerrar modal">&times;</button>
            <div class="modal-container">
                <div class="modal-image-wrapper">
                    <button class="modal-prev" id="modalPrev" aria-label="Imagen anterior">&#10094;</button>
                    <button class="modal-next" id="modalNext" aria-label="Imagen siguiente">&#10095;</button>
                    <img class="modal-image" id="modalImage" alt="Artwork">
                </div>
                <div class="modal-info-wrapper">
                    <div class="modal-info-scroll">
                        <h2 id="modalTitle" class="modal-title"></h2>
                        <p id="modalDescription" class="modal-description" style="font-size: 0.9rem; color: #444; line-height: 1.7; margin: 10px 0 16px; font-style: italic;"></p>
                        <p id="modalTechnique" class="modal-technique"></p>
                        <p id="modalDimensions" class="modal-dimensions"></p>
                        <p id="modalYear" class="modal-year" style="color: #666; font-size: 0.9rem; margin-top: 5px;"></p>
                        <p id="modalPrice" class="modal-price"></p>
                    </div>
                    <div class="modal-btn-footer">
                        <button id="modalBuyBtn" class="btn-modal-buy" data-i18n="modal.consult">CONSULTAR / COMPRAR</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal for pure Image Zoom -->
        <div id="lightBoxModal" class="lightbox-modal" role="dialog" aria-modal="true" aria-label="Zoom de imagen">
            <button class="lightbox-close" aria-label="Cerrar zoom">&times;</button>
            <button class="lightbox-prev" id="lightBoxPrev" aria-label="Imagen anterior">&#10094;</button>
            <button class="lightbox-next" id="lightBoxNext" aria-label="Imagen siguiente">&#10095;</button>
            <img class="lightbox-image" id="lightBoxImage" alt="Artwork Zoom">
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Inject modal fix styles directly — guaranteed to override any CSS conflicts
    const modalFixStyle = document.createElement('style');
    modalFixStyle.textContent = `
        /* ── Modal layout fix ───────────────────────── */
        .modal-container {
            display: flex !important;
            height: 80vh !important;
            max-height: 80vh !important;
            overflow: hidden !important;
        }
        .modal-info-wrapper {
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
            overflow: hidden !important;
            min-height: 0 !important;
            height: 100% !important;
        }
        .modal-info-scroll {
            flex: 1 1 auto !important;
            overflow-y: auto !important;
            min-height: 0 !important;
            -webkit-overflow-scrolling: touch !important;
        }
        .modal-btn-footer {
            flex-shrink: 0 !important;
            padding-top: 16px !important;
        }
        .modal-btn-footer .btn-modal-buy {
            width: 100% !important;
            box-sizing: border-box !important;
            display: block !important;
        }
        /* ── Mobile stacked layout ──────────────────── */
        @media (max-width: 768px) {
            .modal-container {
                flex-direction: column !important;
                height: 88vh !important;
                max-height: 88vh !important;
                width: 94% !important;
                border-radius: 12px !important;
                overflow: hidden !important;
            }
            .modal-image-wrapper {
                flex: 0 0 38vh !important;
                height: 38vh !important;
                min-height: 0 !important;
                overflow: hidden !important;
            }
            .modal-info-wrapper {
                flex: 1 1 auto !important;
                padding: 18px 20px 12px !important;
                overflow: hidden !important;
                min-height: 0 !important;
            }
            .modal-info-scroll {
                padding-right: 0 !important;
            }
            .modal-title {
                font-size: 1.4rem !important;
                margin-bottom: 10px !important;
            }
            .modal-btn-footer {
                padding-top: 10px !important;
                padding-bottom: 6px !important;
            }
        }
        /* ── Hide WhatsApp float when modal is open ─── */
        .image-modal.active ~ .whatsapp-float,
        body.modal-open .whatsapp-float {
            display: none !important;
        }
        /* ── Force modal above everything (close-container is z-index:9999) ── */
        .image-modal {
            z-index: 99999 !important;
        }
        /* ── Disable close-container and lang switcher while modal is open ── */
        body.modal-open .close-container {
            z-index: 1 !important;
            pointer-events: none !important;
        }
        body.modal-open .lang-switcher,
        body.modal-open [class*="lang-"] {
            z-index: 1 !important;
            pointer-events: none !important;
        }
    `;
    document.head.appendChild(modalFixStyle);

    // Re-apply translations for the newly injected modal
    if (window.changeLanguage) {
        window.changeLanguage(savedLang);
    }

    // Bind modal event listeners now that it's in the DOM
    const modal = document.getElementById('imageModal');
    const modalClose = document.querySelector('.modal-close');

    const lightBoxModal = document.getElementById('lightBoxModal');
    const lightBoxClose = document.querySelector('#lightBoxModal .lightbox-close');

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    if (lightBoxClose) {
        lightBoxClose.addEventListener('click', closeLightBox);
    }

    // LightBox Image Zoom Logic
    const lightBoxImg = document.getElementById('lightBoxImage');
    if (lightBoxImg) {
        lightBoxImg.addEventListener('click', function (e) {
            e.stopPropagation(); // prevent modal from closing when clicking image

            let currentZoom = parseInt(this.dataset.zoomLevel || '0');
            currentZoom = (currentZoom + 1) % 3;
            this.dataset.zoomLevel = currentZoom;

            if (currentZoom === 0) {
                this.style.transform = 'scale(1)';
                setTimeout(() => {
                    if (this.dataset.zoomLevel === '0') {
                        this.style.transformOrigin = 'center center';
                    }
                }, 300); // reset origin after animation completes
            } else {
                if (currentZoom === 1) {
                    // Calculate click position relative to the image
                    const rect = this.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                    // Convert to percentages
                    const xPercent = (x / rect.width) * 100;
                    const yPercent = (y / rect.height) * 100;

                    this.style.transformOrigin = `${xPercent}% ${yPercent}%`;
                    this.style.transform = 'scale(2)';
                } else if (currentZoom === 2) {
                    // Zoom deeper into the already established origin
                    this.style.transform = 'scale(4)';
                }
            }

            this.style.cursor = currentZoom === 2 ? 'zoom-out' : 'zoom-in';
        });

        // dynamic cursor hinting
        lightBoxImg.addEventListener('mousemove', function (e) {
            let currentZoom = parseInt(this.dataset.zoomLevel || '0');
            this.style.cursor = currentZoom === 2 ? 'zoom-out' : 'zoom-in';
        });
    }

    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // LightBox Carousel Logic
    const lightBoxPrev = document.getElementById('lightBoxPrev');
    const lightBoxNext = document.getElementById('lightBoxNext');
    // Info Modal Carousel Logic
    const modalPrev = document.getElementById('modalPrev');
    const modalNext = document.getElementById('modalNext');

    if (modalPrev) {
        modalPrev.addEventListener('click', function (e) {
            e.stopPropagation();
            if (window.modalImages && window.modalImages.length > 1) {
                window.modalCurrentIndex = (window.modalCurrentIndex - 1 + window.modalImages.length) % window.modalImages.length;
                const modalImg = document.getElementById('modalImage');
                if (modalImg) modalImg.src = window.modalImages[window.modalCurrentIndex];
            }
        });
    }

    if (modalNext) {
        modalNext.addEventListener('click', function (e) {
            e.stopPropagation();
            if (window.modalImages && window.modalImages.length > 1) {
                window.modalCurrentIndex = (window.modalCurrentIndex + 1) % window.modalImages.length;
                const modalImg = document.getElementById('modalImage');
                if (modalImg) modalImg.src = window.modalImages[window.modalCurrentIndex];
            }
        });
    }

    if (lightBoxPrev) {
        lightBoxPrev.addEventListener('click', function (e) {
            e.stopPropagation();
            if (window.lightBoxImages && window.lightBoxImages.length > 1) {
                window.lightBoxCurrentIndex = (window.lightBoxCurrentIndex - 1 + window.lightBoxImages.length) % window.lightBoxImages.length;
                updateLightBoxImage();
            }
        });
    }

    if (lightBoxNext) {
        lightBoxNext.addEventListener('click', function (e) {
            e.stopPropagation();
            if (window.lightBoxImages && window.lightBoxImages.length > 1) {
                window.lightBoxCurrentIndex = (window.lightBoxCurrentIndex + 1) % window.lightBoxImages.length;
                updateLightBoxImage();
            }
        });
    }

    if (lightBoxModal) {
        lightBoxModal.addEventListener('click', function (e) {
            if (e.target === lightBoxModal) {
                closeLightBox();
            }
        });
    }

    // ── Swipe Gestures for Modals ────────────────────────
    function addSwipeGesture(element, onSwipeLeft, onSwipeRight) {
        if (!element) return;
        var startX = 0, startY = 0, distX = 0;
        element.addEventListener('touchstart', function (e) {
            var t = e.changedTouches[0];
            startX = t.pageX;
            startY = t.pageY;
            distX = 0;
        }, { passive: true });
        element.addEventListener('touchmove', function (e) {
            distX = e.changedTouches[0].pageX - startX;
        }, { passive: true });
        element.addEventListener('touchend', function () {
            if (Math.abs(distX) > 50) {
                if (distX < 0) onSwipeLeft();
                else onSwipeRight();
            }
        }, { passive: true });
    }

    // Swipe on info modal image
    var modalImageWrapper = document.querySelector('.modal-image-wrapper');
    addSwipeGesture(modalImageWrapper,
        function () { var btn = document.getElementById('modalNext'); if (btn) btn.click(); },
        function () { var btn = document.getElementById('modalPrev'); if (btn) btn.click(); }
    );

    // Swipe on lightbox
    addSwipeGesture(lightBoxModal,
        function () { var btn = document.getElementById('lightBoxNext'); if (btn) btn.click(); },
        function () { var btn = document.getElementById('lightBoxPrev'); if (btn) btn.click(); }
    );

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (modal && modal.classList.contains('active')) closeModal();
            if (lightBoxModal && lightBoxModal.classList.contains('active')) closeLightBox();
        }
        // Arrow key navigation for modals
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            var dir = e.key === 'ArrowLeft' ? 'Prev' : 'Next';
            if (lightBoxModal && lightBoxModal.classList.contains('active')) {
                e.preventDefault();
                var lbBtn = document.getElementById('lightBox' + dir);
                if (lbBtn) lbBtn.click();
            } else if (modal && modal.classList.contains('active')) {
                e.preventDefault();
                var mBtn = document.getElementById('modal' + dir);
                if (mBtn) mBtn.click();
            }
        }
    });

    // Check for "item" and "q" query params
    const urlParams = new URLSearchParams(window.location.search);
    const itemParam = urlParams.get('item');
    const urlQuery  = urlParams.get('q');

    // Pre-fill search from ?q= (used when redirected from shop)
    if (urlQuery && searchInput && !isCatalogPage) {
        searchInput.value = urlQuery;
        searchQuery       = urlQuery;
        if (searchClear) searchClear.classList.add('visible');
        setTimeout(() => {
            applyFilters();
            const grid = document.getElementById('productsGrid');
            if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    }

    if (itemParam && !isCatalogPage) {
        const decodedItem = decodeURIComponent(itemParam);
        // Find product in data source logic
        const foundProduct = (window.products || []).find(p => p.image.includes(decodedItem));
        if (foundProduct) {
            openModal(foundProduct);
        }
    }

    // Carousel controls are bound when each section is rendered.

    // Global Event Delegation for LightBox (skip shop carousel — those navigate to obra detail)
    document.addEventListener('click', function (e) {
        if (e.target.tagName !== 'IMG' || !e.target.closest('.product-image')) return;
        if (document.body.classList.contains('shop-page') && e.target.closest('.carousel-card')) return;

        e.preventDefault();
        e.stopPropagation();
        const relSrc = e.target.getAttribute('data-full-src') || e.target.src;
        openLightBox(relSrc || e.target.src);
    }, true); // Use capture phase to intercept before card's onclick

    // ── Back-to-Top Button ──────────────────────────────
    (function () {
        var btn = document.createElement('button');
        btn.className = 'back-to-top';
        btn.setAttribute('data-i18n-aria', 'shop.back_to_top');
        btn.setAttribute('aria-label', 'Volver arriba');
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
        document.body.appendChild(btn);
        if (window.pageTranslations) {
            var btLang = localStorage.getItem('preferredLanguage') || 'es';
            var btLabel = window.pageTranslations[btLang] && window.pageTranslations[btLang]['shop.back_to_top'];
            if (btLabel) btn.setAttribute('aria-label', btLabel);
        }
        window.addEventListener('scroll', function () {
            btn.classList.toggle('visible', window.scrollY > 400);
        }, { passive: true });
        btn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    })();

    // ── Sort Dropdown ───────────────────────────────────
    (function () {
        var isCatalog = window.location.pathname.includes('catalog');
        if (isCatalog || !window.products) return;
        var sidebar = document.querySelector('.catalog-sidebar');
        if (!sidebar) return;

        var section = document.createElement('div');
        section.className = 'sidebar-section';
        section.innerHTML =
            '<h3 class="sidebar-heading">ORDENAR</h3>' +
            '<div class="sort-wrapper">' +
                '<select class="sort-select" id="sortSelect">' +
                    '<option value="default">Por defecto</option>' +
                    '<option value="az">A — Z</option>' +
                    '<option value="za">Z — A</option>' +
                    '<option value="newest">Más reciente</option>' +
                    '<option value="oldest">Más antiguo</option>' +
                '</select>' +
            '</div>';
        sidebar.appendChild(section);

        var sortSelect = document.getElementById('sortSelect');
        sortSelect.addEventListener('change', function () {
            var sorted = window.products.slice();
            switch (this.value) {
                case 'az':
                    sorted.sort(function (a, b) { return a.title.localeCompare(b.title); });
                    break;
                case 'za':
                    sorted.sort(function (a, b) { return b.title.localeCompare(a.title); });
                    break;
                case 'newest':
                    sorted.sort(function (a, b) {
                        var ya = parseInt(b.year) || 0, yb = parseInt(a.year) || 0;
                        return ya - yb;
                    });
                    break;
                case 'oldest':
                    sorted.sort(function (a, b) {
                        var ya = parseInt(a.year) || 9999, yb = parseInt(b.year) || 9999;
                        return ya - yb;
                    });
                    break;
            }
            renderGrid(sorted);
            if (typeof applyFilters === 'function') applyFilters();
        });
    })();

    // ── Live Search Dropdown (shop.html) ────────────────
    (function () {
        var isShop = !window.location.pathname.includes('catalog');
        if (!isShop || !window.products) return;
        var searchBar = document.querySelector('.shop-search-bar');
        var input = document.getElementById('shopSearchInput');
        if (!searchBar || !input) return;

        searchBar.style.position = 'relative';
        var dropdown = document.createElement('div');
        dropdown.className = 'search-dropdown';
        searchBar.appendChild(dropdown);

        var searchActiveIndex = -1;

        function clearSearchHighlight() {
            searchActiveIndex = -1;
            dropdown.querySelectorAll('.search-dropdown-item').forEach(function (el) {
                el.classList.remove('is-highlighted');
            });
        }

        function highlightSearchItem(index) {
            var items = dropdown.querySelectorAll('.search-dropdown-item');
            if (!items.length) return;
            searchActiveIndex = Math.max(0, Math.min(index, items.length - 1));
            items.forEach(function (el, i) {
                el.classList.toggle('is-highlighted', i === searchActiveIndex);
            });
            items[searchActiveIndex].scrollIntoView({ block: 'nearest' });
        }

        function activateSearchItem(item) {
            if (!item) return;
            dropdown.classList.remove('open');
            input.value = '';
            clearSearchHighlight();
            if (item.tagName === 'A' && item.href) {
                window.location.href = item.href;
                return;
            }
            var pid = item.getAttribute('data-id');
            var product = window.products.find(function (p) { return p.id === pid; });
            if (product) navigateToObra(product);
        }

        var normalize = function (str) {
            return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
        };

        input.addEventListener('input', function () {
            clearSearchHighlight();
            var q = normalize(input.value);
            if (!q || q.length < 2) {
                dropdown.classList.remove('open');
                dropdown.innerHTML = '';
                return;
            }
            var words = q.split(' ').filter(Boolean);
            var matches = window.products.filter(function (p) {
                var searchable = normalize([p.title, p.technique || '', p.dimensions || '', p.category || '', p.year || ''].join(' '));
                return words.every(function (w) { return searchable.includes(w); });
            }).slice(0, 5);

            var lang = localStorage.getItem('preferredLanguage') || 'es';
            var soldTag = (window.pageTranslations && window.pageTranslations[lang])
                ? window.pageTranslations[lang]['search.sold_tag']
                : 'Vendido';

            if (matches.length === 0) {
                var emptyMsg = (window.pageTranslations && window.pageTranslations[localStorage.getItem('preferredLanguage') || 'es'])
                    ? window.pageTranslations[localStorage.getItem('preferredLanguage') || 'es']['shop.search_empty']
                    : 'No se encontraron obras';
                dropdown.innerHTML = '<div class="search-dropdown-empty">' + escapeHtmlAttr(emptyMsg || 'No se encontraron obras') + '</div>';
                dropdown.classList.add('open');
                return;
            }
            dropdown.innerHTML = matches.map(function (p) {
                var thumbSrc = getSearchThumbUrl(p.image);
                var obraUrl = getObraUrl(p);
                var tag = obraUrl ? 'a' : 'div';
                var hrefAttr = obraUrl ? ' href="' + escapeHtmlAttr(obraUrl) + '"' : '';
                return '<' + tag + ' class="search-dropdown-item"' + hrefAttr + ' data-id="' + escapeAttributeValue(p.id) + '">' +
                    '<img src="' + escapeHtmlAttr(thumbSrc) + '" alt="" loading="lazy" decoding="async">' +
                    '<div class="search-item-info">' +
                        '<div class="search-item-title">' + escapeHtmlAttr(p.title) + '</div>' +
                        '<div class="search-item-meta">' + escapeHtmlAttr(p.technique || '') +
                            (p.year && p.year !== 'Consultar año' && p.year !== 'a confirmar' ? ' · ' + p.year : '') +
                            (p.sold ? ' · ' + (soldTag || 'Vendido') : '') +
                        '</div>' +
                    '</div>' +
                '</' + tag + '>';
            }).join('') +
            '<div class="search-dropdown-footer" data-i18n="shop.ver_todo">Ver catálogo completo →</div>';

            dropdown.classList.add('open');
            if (window.updatePageTranslations) window.updatePageTranslations();
        });

        input.addEventListener('keydown', function (e) {
            var items = dropdown.querySelectorAll('.search-dropdown-item');
            if (!dropdown.classList.contains('open') || !items.length) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                highlightSearchItem(searchActiveIndex + 1);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                highlightSearchItem(searchActiveIndex <= 0 ? 0 : searchActiveIndex - 1);
            } else if (e.key === 'Enter' && searchActiveIndex >= 0) {
                e.preventDefault();
                activateSearchItem(items[searchActiveIndex]);
            } else if (e.key === 'Escape') {
                dropdown.classList.remove('open');
                clearSearchHighlight();
            }
        });

        dropdown.addEventListener('click', function (e) {
            var item = e.target.closest('.search-dropdown-item');
            if (item) {
                activateSearchItem(item);
                return;
            }
            var footer = e.target.closest('.search-dropdown-footer');
            if (footer) {
                window.location.href = 'catalog.html';
            }
        });

        document.addEventListener('click', function (e) {
            if (!searchBar.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });
    })();

    window.renderRecentlyViewed = function () {
        var rv = JSON.parse(localStorage.getItem('dda_recently_viewed') || '[]');
        var target = document.getElementById('recentlyViewedContainer');
        if (!target) return;
        if (!rv.length) { target.innerHTML = ''; target.className = ''; return; }
        target.className = 'recently-viewed-section recently-viewed-section--top';
        target.innerHTML =
            '<h2 class="featured-label rv-heading" data-i18n="shop.recently_viewed">Vistos recientemente</h2>' +
            '<div class="rv-track"></div>';
        var track = target.querySelector('.rv-track');
        rv.forEach(function (item) {
            var el = document.createElement('a');
            el.className = 'rv-card';
            el.href = 'obra.html?id=' + encodeURIComponent(item.id);
            var imgSrc = item.image || '';
            if (typeof DDAImages !== 'undefined' && imgSrc) {
                var resolvedRv = DDAImages.resolveImageUrl(imgSrc, window.location.href);
                imgSrc = DDAImages.isCloudinaryUrl(resolvedRv)
                    ? DDAImages.getThumbImageUrl(resolvedRv)
                    : resolvedRv;
            }
            var titleHtml = escapeHtmlAttr(item.title || '');
            var yearHtml = item.year && item.year !== 'Consultar año' && item.year !== 'a confirmar'
                ? '<div class="rv-year">' + escapeHtmlAttr(item.year) + '</div>'
                : '';
            el.innerHTML =
                '<div class="rv-img"><img src="' + escapeHtmlAttr(imgSrc) + '" alt="' + titleHtml + '" loading="lazy" decoding="async"></div>' +
                '<div class="rv-title">' + titleHtml + '</div>' +
                yearHtml;
            track.appendChild(el);
        });
        if (window.updatePageTranslations) window.updatePageTranslations();
    };
    window.renderRecentlyViewed();

    // ── Floating CTAs: catalog on scroll; WhatsApp visible on load ──
    (function initShopFloatingActions() {
        if (isCatalogPage) return;

        var catalogFloat = document.getElementById('catalogFloat');
        var whatsappFloat = document.getElementById('whatsappFloat');

        if (whatsappFloat) {
            whatsappFloat.classList.add('is-ready');
        }

        function updateFloatState() {
            var isMobile = window.matchMedia('(max-width: 768px)').matches;
            var catalogThreshold = isMobile ? 280 : 360;
            var catalogVisible = window.scrollY > catalogThreshold;
            if (catalogFloat) {
                catalogFloat.classList.toggle('visible', catalogVisible);
            }
            if (whatsappFloat) {
                whatsappFloat.classList.toggle('is-shifted', catalogVisible);
            }
        }

        window.addEventListener('scroll', updateFloatState, { passive: true });
        updateFloatState();
    })();

    // ── Dynamic JSON-LD Structured Data ─────────────────
    (function () {
        if (!window.products || !window.products.length) return;
        var baseUrl = 'https://diegodeaduriz.art';
        var artworks = window.products.map(function (p) {
            var item = {
                '@type': 'VisualArtwork',
                'name': p.title,
                'creator': { '@id': baseUrl + '/#artist' },
                'image': baseUrl + '/shop/' + p.image
            };
            if (p.technique) item.artMedium = p.technique;
            if (p.dimensions) item.description = (p.technique || '') + ', ' + p.dimensions + (p.year ? ', ' + p.year : '');
            if (p.year && p.year !== 'Consultar año' && p.year !== 'a confirmar') item.dateCreated = p.year;
            item.offers = {
                '@type': 'Offer',
                'availability': p.sold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
                'seller': { '@id': baseUrl + '/#artist' }
            };
            return item;
        });
        var ld = {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            'name': 'Obras de Diego De Aduriz',
            'numberOfItems': artworks.length,
            'itemListElement': artworks.map(function (a, i) {
                return { '@type': 'ListItem', 'position': i + 1, 'item': a };
            })
        };
        var script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(ld);
        document.head.appendChild(script);
    })();

});

function toWebP(src) {
    return src.replace(/\.(png|jpe?g)$/i, '.webp');
}

function escapeHtmlAttr(value) {
    if (typeof DDAImages !== 'undefined' && DDAImages.escapeHtmlAttr) {
        return DDAImages.escapeHtmlAttr(value);
    }
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function formatShopPriceHtml(price) {
    var value = String(price || '').trim();
    if (!value || value.toLowerCase() === 'consultar') {
        return '<span class="product-price product-price--consult">Consultar</span>' +
            '<span class="product-price-hint" data-i18n="card.price_hint">Consultá precio y envío</span>';
    }
    return '<span class="product-price">' + escapeHtmlAttr(value) + '</span>';
}

function formatCarouselPriceHtml(price) {
    var value = String(price || '').trim();
    var consult = !value || value.toLowerCase() === 'consultar';
    return '<p class="product-price catalog-card-price' + (consult ? ' catalog-card-price--consult' : '') + '">' +
        escapeHtmlAttr(consult ? 'Consultar' : value) + '</p>';
}

function formatCarouselStatusHtml() {
    return '<span class="product-status-badge product-status-badge--sold" data-i18n="card.sold">VENDIDO</span>';
}

function getSearchThumbUrl(image) {
    if (typeof DDAImages !== 'undefined') {
        var resolved = DDAImages.resolveImageUrl(image, window.location.href);
        if (DDAImages.isCloudinaryUrl(resolved)) {
            return DDAImages.getThumbImageUrl(resolved);
        }
        return resolved;
    }
    return image || '';
}

var _shopSectionNavTimer = null;
var _shopSectionNavObserver = null;

function updateShopSectionNav() {
    var nav = document.getElementById('shopSectionNav');
    var inner = document.getElementById('shopSectionNavInner');
    if (!nav || !inner) return;

    var sections = document.querySelectorAll('.shop-carousel-section[id^="shop-section-"]');
    inner.innerHTML = '';

    if (!sections.length) {
        nav.hidden = true;
        return;
    }

    sections.forEach(function (sectionEl) {
        if (sectionEl.getAttribute('data-sticky-nav') === 'false') return;
        var label = sectionEl.querySelector('.featured-label');
        if (!label) return;
        var link = document.createElement('a');
        link.className = 'shop-section-nav__link';
        link.href = '#' + sectionEl.id;
        link.textContent = label.textContent.trim();
        link.addEventListener('click', function (e) {
            e.preventDefault();
            scrollToShopSection(sectionEl);
        });
        inner.appendChild(link);
    });

    if (!inner.children.length) {
        nav.hidden = true;
        return;
    }

    nav.hidden = false;

    if (window.updatePageTranslations) {
        window.updatePageTranslations();
    }

    initShopSectionNavSpy();
}

function getShopScrollOffset() {
    var siteHeader = document.querySelector('.site-header') || document.querySelector('header');
    var sectionNav = document.getElementById('shopSectionNav');
    var headerH = siteHeader ? siteHeader.offsetHeight : 72;
    var navH = (sectionNav && !sectionNav.hidden) ? sectionNav.offsetHeight : 0;
    return headerH + navH + 12;
}

function scrollToShopSection(sectionEl) {
    if (!sectionEl) return;
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var top = sectionEl.getBoundingClientRect().top + window.scrollY - getShopScrollOffset();
    window.scrollTo({ top: Math.max(0, top), behavior: prefersReduced ? 'auto' : 'smooth' });
}

function initShopSectionNavSpy() {
    if (!('IntersectionObserver' in window)) return;

    if (_shopSectionNavObserver) {
        _shopSectionNavObserver.disconnect();
        _shopSectionNavObserver = null;
    }

    var links = document.querySelectorAll('.shop-section-nav__link[href^="#"]');
    if (!links.length) return;

    _shopSectionNavObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var id = entry.target.id;
            document.querySelectorAll('.shop-section-nav__link[href^="#"]').forEach(function (link) {
                link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
            });
        });
    }, {
        rootMargin: '-40% 0px -45% 0px',
        threshold: 0
    });

    document.querySelectorAll('.shop-carousel-section[id^="shop-section-"]').forEach(function (section) {
        _shopSectionNavObserver.observe(section);
    });
}

function scheduleShopSectionNavUpdate() {
    if (_shopSectionNavTimer) {
        window.clearTimeout(_shopSectionNavTimer);
    }
    _shopSectionNavTimer = window.setTimeout(updateShopSectionNav, 80);
}

function encodeSrcset(url) {
    if (typeof DDAImages !== 'undefined' && DDAImages.encodeUrlSpaces) {
        return DDAImages.encodeUrlSpaces(url);
    }
    return String(url || '').replace(/ /g, '%20');
}

function escapeHtmlAttr(value) {
    if (typeof DDAImages !== 'undefined' && DDAImages.escapeHtmlAttr) {
        return DDAImages.escapeHtmlAttr(value);
    }
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/** Carousel / grid cards: single optimized Cloudinary URL (no srcset). */
function carouselImageHtml(src, alt, extra) {
    if (typeof DDAImages !== 'undefined' && DDAImages.cardImageHtml) {
        return DDAImages.cardImageHtml(src, alt, extra);
    }
    return pictureTag(src, alt, extra);
}

function getShopCardImageHtml(product, richAlt) {
    if (typeof DDAImages !== 'undefined' && DDAImages.cardImageHtml) {
        return DDAImages.cardImageHtml(
            product.image,
            richAlt,
            ' loading="lazy" decoding="async"'
        );
    }
    return '<picture>' +
        '<source srcset="' + escapeHtmlAttr(encodeSrcset(toWebP(product.image))) + '" type="image/webp">' +
        '<img src="' + escapeHtmlAttr(encodeSrcset(product.image || '')) + '" alt="' + escapeHtmlAttr(richAlt) + '" loading="lazy" decoding="async">' +
    '</picture>';
}

function repairShopImages(root) {
    if (typeof DDAImages !== 'undefined' && DDAImages.repairBrokenImages) {
        DDAImages.repairBrokenImages(root);
    }
}

function pictureTag(src, alt, extra) {
    if (typeof DDAImages !== 'undefined') {
        return DDAImages.pictureHtml(src, alt, extra);
    }

    var webpSrc = toWebP(src || '');
    var attrs = extra || '';

    if (!/\bloading=/.test(attrs)) attrs += ' loading="lazy"';
    if (!/\bdecoding=/.test(attrs)) attrs += ' decoding="async"';
    if (!/\bfetchpriority=/.test(attrs)) attrs += ' fetchpriority="low"';

    return '<picture>' +
        '<source srcset="' + escapeHtmlAttr(encodeSrcset(webpSrc)) + '" type="image/webp">' +
        '<img src="' + escapeHtmlAttr(encodeSrcset(src || '')) + '" alt="' + escapeHtmlAttr(alt) + '"' + attrs + '>' +
    '</picture>';
}

function normalizeShopCategory(value) {
    return String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function getImageFilename(value) {
    if (!value) return '';
    try {
        var path = String(value).indexOf('://') !== -1
            ? new URL(value).pathname
            : String(value).split('?')[0];
        return decodeURIComponent(path.split('/').pop() || '').toLowerCase();
    } catch (e) {
        return String(value).split('/').pop().split('?')[0].toLowerCase();
    }
}

function buildProductLookupMaps(products) {
    var byImage = {};
    var byFilename = {};
    var bySlug = {};

    (products || []).forEach(function (p) {
        if (p.image) byImage[p.image] = p;
        if (p.slug) bySlug[p.slug] = p;
        if (p.id) bySlug[p.id] = p;

        var filenames = [getImageFilename(p.image)];
        (p.images || []).forEach(function (img) {
            filenames.push(getImageFilename(img));
            if (img) byImage[img] = p;
        });

        filenames.forEach(function (fn) {
            if (fn) byFilename[fn] = p;
        });
    });

    return { byImage: byImage, byFilename: byFilename, bySlug: bySlug };
}

function findProductByImageRef(ref, lookup) {
    if (!ref || !lookup) return null;
    if (lookup.byImage[ref]) return lookup.byImage[ref];

    var fn = getImageFilename(ref);
    if (fn && lookup.byFilename[fn]) return lookup.byFilename[fn];

    var slugKey = String(ref).replace(/^\/+/, '');
    if (lookup.bySlug[slugKey]) return lookup.bySlug[slugKey];

    return null;
}

function sortProductsAvailableFirst(products) {
    return products.filter(function (p) { return !p.sold; })
        .concat(products.filter(function (p) { return p.sold; }));
}

function resolveCarouselSectionProducts(section) {
    var products = window.products || [];
    var limit = section.limit || SHOP_CAROUSEL_INITIAL_ITEMS;
    var lookup = buildProductLookupMaps(products);

    if (section.dynamic === 'newest') {
        var newest = products.slice().sort(function (a, b) {
            var ta = Date.parse(a.createdAt || '') || 0;
            var tb = Date.parse(b.createdAt || '') || 0;
            if (tb !== ta) return tb - ta;
            return (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0);
        });
        return sortProductsAvailableFirst(newest).slice(0, limit);
    }

    if (section.dynamic === 'category' && section.categories && section.categories.length) {
        var wanted = section.categories.map(normalizeShopCategory);
        var matched = products.filter(function (p) {
            var category = normalizeShopCategory(p.category);
            if (wanted.indexOf(category) !== -1) return true;

            var title = normalizeShopCategory(p.title);
            return wanted.some(function (cat) {
                var stem = cat.replace(/s$/, '');
                return title.indexOf(stem) !== -1;
            });
        });
        return sortProductsAvailableFirst(matched).slice(0, limit);
    }

    if (section.dynamic === 'featured') {
        var picked = [];
        var seenCategories = {};
        var ranked = sortProductsAvailableFirst(products.slice().sort(function (a, b) {
            var tb = Date.parse(b.createdAt || '') || parseInt(b.year, 10) || 0;
            var ta = Date.parse(a.createdAt || '') || parseInt(a.year, 10) || 0;
            return tb - ta;
        }));

        ranked.forEach(function (p) {
            if (picked.length >= limit) return;
            var cat = normalizeShopCategory(p.category) || 'other';
            if (!seenCategories[cat]) {
                seenCategories[cat] = true;
                picked.push(p);
            }
        });

        ranked.forEach(function (p) {
            if (picked.length >= limit) return;
            if (picked.indexOf(p) === -1) picked.push(p);
        });

        return picked;
    }

    var fromImages = [];
    (section.images || []).forEach(function (ref) {
        var product = findProductByImageRef(ref, lookup);
        if (product && fromImages.indexOf(product) === -1) {
            fromImages.push(product);
        }
    });
    return fromImages.slice(0, limit);
}

function renderCarouselSections() {
    var container = document.getElementById('carouselSectionsContainer');
    var featuredSlot = document.getElementById('shopHeroFeatured');
    if (!container || !window.carouselSections || !window.products || !window.products.length) {
        if (featuredSlot) {
            featuredSlot.innerHTML = '';
            featuredSlot.removeAttribute('aria-busy');
        }
        return;
    }

    if (container.dataset.rendered === 'true') return;
    container.dataset.rendered = 'true';
    container.innerHTML = '';

    if (featuredSlot) {
        featuredSlot.innerHTML = '';
        featuredSlot.removeAttribute('aria-busy');
        delete featuredSlot.dataset.skeleton;
        featuredSlot.dataset.rendered = 'true';
    }

    var eyeSvg = '<svg viewBox="0 0 24 24" class="icon-eye" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
    var heartSvgCarousel = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';

    function renderOneSection(section, sIdx, parentEl, options) {
        var opts = options || {};
        var isHeroFeatured = opts.isHeroFeatured === true;
        var displayIdx = typeof opts.displayIdx === 'number' ? opts.displayIdx : sIdx;
        parentEl = parentEl || container;

        var sectionEl = document.createElement('section');
        sectionEl.className = 'shop-hero-vertical shop-carousel-section';
        sectionEl.id = 'shop-section-' + (section.id || String(sIdx));
        if (section.stickyNav === false) {
            sectionEl.setAttribute('data-sticky-nav', 'false');
        }
        if (isHeroFeatured) {
            sectionEl.classList.add('shop-carousel-section--hero');
        } else if (sIdx > 0) {
            sectionEl.style.padding = '20px 0 60px';
        }

        var wrapper = document.createElement('div');
        wrapper.className = 'hero-featured';
        var carouselWrapper = document.createElement('div');
        carouselWrapper.className = 'featured-carousel-wrapper';

        var label = document.createElement('h2');
        label.className = 'featured-label';
        if (section.labelKey) label.setAttribute('data-i18n', section.labelKey);
        label.textContent = section.labelDefault;
        label.id = 'carousel-label-' + (section.id || sIdx);
        carouselWrapper.appendChild(label);

        var miniContainer = document.createElement('div');
        miniContainer.className = 'carousel-container-mini';
        miniContainer.setAttribute('role', 'region');
        miniContainer.setAttribute('aria-roledescription', 'carousel');
        miniContainer.setAttribute('aria-labelledby', label.id);

        var prevBtn = document.createElement('button');
        prevBtn.className = 'carousel-btn prev-btn';
        prevBtn.type = 'button';
        prevBtn.setAttribute('aria-label', 'Anterior — ' + section.labelDefault);
        prevBtn.innerHTML = '&#10094;';

        var track = document.createElement('div');
        track.className = 'carousel-track';

        var sectionProducts = resolveCarouselSectionProducts(section);

        sectionProducts.forEach(function (product, imgIdx) {
            if (!product) return;

            var card = document.createElement('article');
            card.className = 'product-card carousel-card product-card--catalog-style';
            card.setAttribute('data-category', product.category || '');
            card.setAttribute('data-dimensions', product.dimensions || '');
            card.setAttribute('data-technique', product.technique || '');
            if (product.sold) card.classList.add('sold');

            var soldBtnHtml = '';
            var actionsGridClass = 'product-actions-grid';
            if (!product.sold) {
                soldBtnHtml = '<button type="button" class="btn-grid-action btn-grid-buy">' +
                    '<span class="btn-icon" aria-hidden="true">' +
                    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
                    '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>' +
                    '<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>' +
                    '</span> <span data-i18n="card.buy">COMPRAR</span></button>';
            } else {
                actionsGridClass += ' product-actions-grid--solo';
            }

            var carouselAltParts = [product.title];
            if (product.technique) carouselAltParts.push(product.technique);
            if (product.dimensions) carouselAltParts.push(product.dimensions);
            var carouselAlt = carouselAltParts.join(' — ') + ' — Diego De Aduriz';

            var carouselWishlistId = getShopWishlistId(product);
            var carouselIsWished = isShopProductWished(product);

            var imageAttrs = ' class="carousel-img"';
            if (displayIdx === 0 && imgIdx === 0) {
                imageAttrs += ' loading="eager" fetchpriority="high" decoding="async"';
            }

            card.innerHTML =
                '<div class="product-image">' +
                    '<button type="button" class="btn-wishlist' + (carouselIsWished ? ' active' : '') + '" data-product-id="' + escapeAttributeValue(carouselWishlistId) + '" aria-label="Agregar a favoritos">' + heartSvgCarousel + '</button>' +
                    carouselImageHtml(product.image, carouselAlt, imageAttrs) +
                '</div>' +
                    '<div class="product-info">' +
                    (product.sold ? '<div class="product-card-status">' + formatCarouselStatusHtml() + '</div>' : '') +
                    '<h3 class="product-title">' + escapeHtmlAttr(product.title) + '</h3>' +
                    formatCarouselPriceHtml(product.price) +
                    '<div class="' + actionsGridClass + '">' +
                        '<button type="button" class="btn-grid-action btn-grid-details">' +
                            '<span class="btn-icon" aria-hidden="true">' + eyeSvg + '</span>' +
                            '<span data-i18n="card.details">DETALLES</span>' +
                        '</button>' +
                        soldBtnHtml +
                    '</div>' +
                '</div>';

            card.addEventListener('click', function (e) {
                if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
                navigateToObra(product);
            });

            var detailsBtn = card.querySelector('.btn-grid-details');
            if (detailsBtn) {
                detailsBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    navigateToObra(product);
                });
            }

            var buyBtn = card.querySelector('.btn-grid-buy');
            if (buyBtn) {
                buyBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    buyProduct(product);
                });
            }

            var wishBtn = card.querySelector('.btn-wishlist');
            if (wishBtn) {
                wishBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    toggleShopWishlist(product, this);
                });
            }

            track.appendChild(card);
        });

        if (!track.children.length) return;

        var nextBtn = document.createElement('button');
        nextBtn.className = 'carousel-btn next-btn';
        nextBtn.type = 'button';
        nextBtn.setAttribute('aria-label', 'Siguiente — ' + section.labelDefault);
        nextBtn.innerHTML = '&#10095;';

        miniContainer.appendChild(prevBtn);
        miniContainer.appendChild(track);
        miniContainer.appendChild(nextBtn);
        carouselWrapper.appendChild(miniContainer);
        wrapper.appendChild(carouselWrapper);
        sectionEl.appendChild(wrapper);
        parentEl.appendChild(sectionEl);

        bindMiniCarouselControls(miniContainer);

        if (window.updatePageTranslations) window.updatePageTranslations();
        scheduleShopSectionNavUpdate();
        repairShopImages(sectionEl);
    }

    window.carouselSections.forEach(function (section, sIdx) {
        var isFeatured = sIdx === 0 && featuredSlot;
        var parentEl = isFeatured ? featuredSlot : container;
        var renderOptions = {
            isHeroFeatured: isFeatured,
            displayIdx: isFeatured ? 0 : sIdx
        };

        var renderSection = function () {
            renderOneSection(section, sIdx, parentEl, renderOptions);
        };

        if (sIdx <= 1) {
            renderSection();
            return;
        }

        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(renderSection, { timeout: 900 + (sIdx * 250) });
        } else {
            window.setTimeout(renderSection, SHOP_DEFER_SECTION_RENDER_MS * sIdx);
        }
    });

    window.setTimeout(function () {
        repairShopImages(document.getElementById('shopHeroFeatured'));
        repairShopImages(document.getElementById('carouselSectionsContainer'));
    }, 2000);
}

function bindMiniCarouselControls(container) {
    var track = container.querySelector('.carousel-track');
    var prevBtn = container.querySelector('.prev-btn');
    var nextBtn = container.querySelector('.next-btn');

    if (!track) return;

    var cardWidth = function () {
        var card = track.querySelector('.carousel-card');
        return card ? card.offsetWidth + 20 : 320;
    };

    if (prevBtn) {
        prevBtn.addEventListener('click', function () {
            track.scrollBy({ left: -cardWidth(), behavior: 'smooth' });
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function () {
            track.scrollBy({ left: cardWidth(), behavior: 'smooth' });
        });
    }

    var autoTimer = null;
    var paused = false;
    var autoInterval = window.innerWidth <= 768 ? 6000 : 5000;

    function autoAdvance() {
        if (paused || document.hidden) return;
        var maxScroll = track.scrollWidth - track.clientWidth;
        if (track.scrollLeft >= maxScroll - 4) {
            track.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
            track.scrollBy({ left: cardWidth(), behavior: 'smooth' });
        }
    }

    function startAuto() {
        if (autoTimer || track.children.length < 2) return;
        autoTimer = setInterval(autoAdvance, autoInterval);
    }

    function stopAuto() {
        clearInterval(autoTimer);
        autoTimer = null;
    }

    // Start after the page has settled, not during the critical load path.
    window.setTimeout(startAuto, 2500);

    container.addEventListener('mouseenter', function () { paused = true; stopAuto(); });
    container.addEventListener('mouseleave', function () { paused = false; startAuto(); });
    container.addEventListener('touchstart', function () { paused = true; stopAuto(); }, { passive: true });
    container.addEventListener('touchend', function () {
        paused = false;
        window.setTimeout(startAuto, 3000);
    }, { passive: true });
}

function renderGrid(items) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    grid.innerHTML = ''; // Clear existing

    const isCatalog = window.location.pathname.includes('catalog');

    items.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.setAttribute('data-category', product.category);
        card.setAttribute('data-dimensions', product.dimensions || '');
        if (product.sold) card.classList.add('sold');

        const overlayHTML = isCatalog ? '' : `
                <div class="masonry-overlay">
                    <div class="overlay-content">
                        <h3 class="overlay-title">${product.title}</h3>
                        <p class="overlay-details">
                            ${product.dimensions ? product.dimensions + '<br>' : ''}
                            ${product.technique ? product.technique + '<br>' : ''}
                            ${(!product.year || product.year === 'Consultar año') ? '' : product.year}
                        </p>
                        <button class="btn-grid-details-overlay" style="pointer-events: auto; margin-top: 15px; background: transparent; border: 1px solid #111; color: #111; padding: 10px 20px; font-family: var(--font-body); font-size: 0.8rem; letter-spacing: 0.1em; cursor: pointer; transition: all 0.3s ease;">DETALLES</button>
                    </div>
                </div>`;

        const priceHTML = isCatalog ? '' : `<p class="product-price">${product.price}</p>`;
        const yearHTML = (product.year && product.year !== 'Consultar año' && product.year !== 'a confirmar') ? `<p class="product-year">${product.year}</p>` : '';
        const productWishlistId = getShopWishlistId(product);
        const isWished = isShopProductWished(product);
        const heartSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';

        const altParts = [product.title];
        if (product.technique) altParts.push(product.technique);
        if (product.dimensions) altParts.push(product.dimensions);
        if (product.year && product.year !== 'Consultar año' && product.year !== 'a confirmar') altParts.push(product.year);
        const richAlt = altParts.join(' — ');

        card.innerHTML = `
            <div class="product-image loading">
                <div class="skeleton-shimmer"></div>
                <button class="btn-wishlist${isWished ? ' active' : ''}" data-product-id="${escapeAttributeValue(productWishlistId)}" aria-label="Agregar a favoritos">${heartSvg}</button>
                ${getShopCardImageHtml(product, richAlt)}
                ${overlayHTML}
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                ${yearHTML}
                ${priceHTML}
                <div class="product-actions-grid">
                    <button class="btn-grid-action btn-grid-details">
                        <span class="btn-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" class="icon-eye" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                        </span>
                        <span data-i18n="card.details">DETALLES</span>
                    </button>
                    ${product.sold ? `<button class="btn-grid-action btn-grid-sold" disabled aria-disabled="true" style="opacity:0.4;cursor:not-allowed">\u2717 <span data-i18n="card.sold">VENDIDO</span></button>` : `<button class="btn-grid-action btn-grid-buy"><span class="btn-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></span> <span data-i18n="card.buy">COMPRAR</span></button>`}
                </div>
            </div>
        `;

        // Attach click to card
        card.onclick = (e) => {
            // Check if button clicked
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;

            openModal(product);
        };

        // Button actions
        const btnDetails = card.querySelector('.btn-grid-details');
        const btnDetailsOverlay = card.querySelector('.btn-grid-details-overlay');
        const btnBuy = card.querySelector('.btn-grid-buy');

        if (btnDetails) {
            btnDetails.onclick = (e) => {
                e.stopPropagation();
                var detailId = product.slug || product.id;
                if (detailId) {
                    window.location.href = 'obra.html?id=' + encodeURIComponent(detailId);
                } else {
                    openModal(product);
                }
            };
        }

        if (btnDetailsOverlay) {
            btnDetailsOverlay.onclick = (e) => {
                e.stopPropagation();
                var detailId = product.slug || product.id;
                if (detailId) {
                    window.location.href = 'obra.html?id=' + encodeURIComponent(detailId);
                } else {
                    openModal(product);
                }
            };
        }

        if (btnBuy) {
            btnBuy.onclick = (e) => {
                e.stopPropagation();
                buyProduct(product);
            };
        }

        const btnWishlist = card.querySelector('.btn-wishlist');
        if (btnWishlist) {
            btnWishlist.onclick = (e) => {
                e.stopPropagation();
                toggleShopWishlist(product, btnWishlist);
            };
        }

        // Skeleton loader: hide shimmer when image loads; fallback on error
        const imgEl = card.querySelector('.product-image img');
        const imageDiv = card.querySelector('.product-image');
        if (imgEl && imageDiv) {
            imgEl.addEventListener('load', () => { imageDiv.classList.remove('loading'); });
            imgEl.addEventListener('error', () => {
                imgEl.src = '/portfolio/sections/obras/MG_1192.jpg';
                imageDiv.classList.remove('loading');
            });
            if (imgEl.complete) imageDiv.classList.remove('loading');
        }

        grid.appendChild(card);
    });

    // Refresh translations for new elements
    if (window.updatePageTranslations) window.updatePageTranslations();
}

function openModal(productOrElement) {
    const modal = document.getElementById('imageModal');
    if (!modal) return;

    let product = productOrElement;

    // Check if input is a DOM element (from static carousel)
    if (productOrElement instanceof Element) {
        const el = productOrElement;
        const img = el.querySelector('img');
        const title = el.querySelector('.product-title');
        const price = el.querySelector('.product-price');

        // Look up original product to fetch its full `images` array if available
        let fullImages = [];
        let srcToMatch = '';
        if (img) {
            srcToMatch = img.src || img.getAttribute('src');
        }

        let foundP = null;
        if (srcToMatch && window.products) {
            // Find product by matching the filename
            foundP = window.products.find(p => {
                const imgFileName = p.image ? p.image.split('/').pop() : '';
                const matchMain = imgFileName && srcToMatch.includes(imgFileName);
                const matchArray = p.images && p.images.some(imgUrl => imgUrl && srcToMatch.includes(imgUrl.split('/').pop()));
                return matchMain || matchArray;
            });

            if (foundP && foundP.images) {
                fullImages = foundP.images;
            } else {
                fullImages = [srcToMatch];
            }
        } else if (srcToMatch) {
            fullImages = [srcToMatch];
        }

        product = {
            image: img ? img.src : '',
            images: fullImages,
            title: title ? title.innerText : '',
            price: price ? price.innerText : '',
            description: (foundP && foundP.description) ? foundP.description : '',
            dimensions: (foundP && foundP.dimensions) ? foundP.dimensions : (el.dataset.dimensions || ''),
            technique: (foundP && foundP.technique) ? foundP.technique : (el.dataset.technique || ''),
            year: (foundP && foundP.year) ? foundP.year : (el.dataset.year || ''),
            category: (foundP && foundP.category) ? foundP.category : (el.dataset.category || ''),
            sold: foundP ? foundP.sold : el.classList.contains('sold')
        };
    } else {
        if (!product.images) {
            product.images = [product.image];
        }
    }

    // Track recently viewed and refresh the carousel
    if (product.id || product.title) {
        var rvKey = 'dda_recently_viewed';
        var rv = JSON.parse(localStorage.getItem(rvKey) || '[]');
        var rvId = getShopWishlistId(product);
        rv = rv.filter(function (item) { return String(item.id) !== rvId; });
        rv.unshift({ id: rvId, title: product.title, image: product.image, year: product.year || '' });
        if (rv.length > 8) rv = rv.slice(0, 8);
        localStorage.setItem(rvKey, JSON.stringify(rv));
        if (typeof window.renderRecentlyViewed === 'function') window.renderRecentlyViewed();
    }

    const modalImg = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalPrice = document.getElementById('modalPrice');
    const modalDimensions = document.getElementById('modalDimensions');
    const modalTechnique = document.getElementById('modalTechnique');
    const modalYear = document.getElementById('modalYear');
    const modalBuyBtn = document.getElementById('modalBuyBtn');

    // Image Carousel Logic for Info Modal
    window.modalImages = product.images;
    window.modalCurrentIndex = 0;

    const prevBtn = document.getElementById('modalPrev');
    const nextBtn = document.getElementById('modalNext');
    if (prevBtn && nextBtn) {
        if (window.modalImages && window.modalImages.length > 1) {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
        } else {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        }
    }

    if (modalImg) {
        modalImg.src = window.modalImages ? window.modalImages[window.modalCurrentIndex] : product.image;
        modalImg.alt = product.title;
    }
    if (modalTitle) modalTitle.textContent = product.title;

    const modalDescription = document.getElementById('modalDescription');
    if (modalDescription) {
        if (product.description) {
            modalDescription.innerHTML = product.description;
            modalDescription.style.display = 'block';
        } else {
            modalDescription.style.display = 'none';
        }
    }

    const isCatalogModal = window.location.pathname.includes('catalog');
    if (modalPrice) modalPrice.textContent = isCatalogModal ? '' : product.price;

    const lang = localStorage.getItem('preferredLanguage') || 'es';
    // Access translations safely
    const translations = (window.pageTranslations && window.pageTranslations[lang]) ? window.pageTranslations[lang] : (window.pageTranslations ? window.pageTranslations['es'] : {});
    const dimLabel = translations['modal.dimensions'] || 'Dimensiones';

    // Check if dimensions are valid before showing "undefined"
    if (modalDimensions) {
        if (product.dimensions && product.dimensions !== 'undefined') {
            modalDimensions.textContent = `${dimLabel}: ${product.dimensions}`;
            modalDimensions.style.display = 'block';
        } else {
            modalDimensions.style.display = 'none';
        }
    }

    if (modalTechnique) modalTechnique.textContent = product.technique || '';

    if (modalYear) {
        let yearText = product.year || '';
        if (yearText && yearText !== "Consultar año") {
            modalYear.textContent = yearText;
            modalYear.style.display = 'block';
        } else if (yearText === "Consultar año") {
            modalYear.textContent = "Consultar año";
            modalYear.style.display = 'block';
        } else {
            modalYear.style.display = 'none';
        }
    }

    if (modalBuyBtn) {
        if (product.sold) {
            modalBuyBtn.style.display = 'none';
        } else {
            modalBuyBtn.style.display = 'inline-block';
            modalBuyBtn.textContent = translations['modal.consult'] || 'CONSULTAR / COMPRAR';
            modalBuyBtn.onclick = (e) => {
                e.preventDefault();
                const waNumber = '5491160139563';
                const message = `Hola, me interesa comprar: ${product.title}`;
                window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
            };
        }
    }

    modal.classList.add('active');
    // Save scroll position and lock body (works on iOS Safari too)
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.dataset.scrollY = scrollY;
    document.body.classList.add('no-scroll');
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('no-scroll');
}

function addToCartWithFeedback(product) {
    if (typeof DDACart !== 'undefined') {
        var added = DDACart.addItem(product);
        showCartToast(added ? 'Agregado a tu selección' : 'Ya está en tu selección');
    }
}

function showCartToast(msg) {
    var existing = document.querySelector('.cart-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> ' + msg;
    document.body.appendChild(toast);
    requestAnimationFrame(function () { toast.classList.add('show'); });
    setTimeout(function () {
        toast.classList.remove('show');
        setTimeout(function () { toast.remove(); }, 300);
    }, 2000);
}

function buyProduct(product) {
    if (typeof trackGenerateLead === 'function') {
        trackGenerateLead(product, 'shop_buy');
    }
    if (typeof openInquiry === 'function') {
        openInquiry(product, product.price);
        return;
    }
    if (typeof DDACart !== 'undefined') {
        addToCartWithFeedback(product);
        return;
    } else {
        const waNumber = '5491160139563';
        const message = `Hola, me interesa comprar: ${product.title}`;
        window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
    }
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.remove('active');
        // Restore scroll position
        const scrollY = parseInt(document.body.dataset.scrollY || '0');
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.classList.remove('no-scroll');
        document.body.classList.remove('modal-open');
        document.documentElement.classList.remove('no-scroll');
        window.scrollTo(0, scrollY);
    }
}

function getLightBoxImageUrl(src) {
    if (!src) return '';
    if (typeof DDAImages !== 'undefined') {
        return DDAImages.getPdfImageUrl(DDAImages.resolveImageUrl(src, window.location.href));
    }
    return src;
}

function openLightBox(imageSrc) {
    const lightBox = document.getElementById('lightBoxModal');

    if (lightBox) {
        // Extract src regardless of parameter type
        let src = typeof imageSrc === 'string' ? imageSrc : (imageSrc.src || '');
        src = getLightBoxImageUrl(src);

        // Check if there are multiple images for this product
        window.lightBoxImages = [src];
        window.lightBoxCurrentIndex = 0;

        if (window.products) {
            const product = window.products.find(p => p.image === src || (p.images && p.images.includes(src)));
            if (product && product.images && product.images.length > 1) {
                window.lightBoxImages = product.images;
                window.lightBoxCurrentIndex = product.images.indexOf(src);
                if (window.lightBoxCurrentIndex === -1) window.lightBoxCurrentIndex = 0;
            }
        }

        const prevBtn = document.getElementById('lightBoxPrev');
        const nextBtn = document.getElementById('lightBoxNext');
        if (prevBtn && nextBtn) {
            if (window.lightBoxImages.length > 1) {
                prevBtn.style.display = 'block';
                nextBtn.style.display = 'block';
            } else {
                prevBtn.style.display = 'none';
                nextBtn.style.display = 'none';
            }
        }

        updateLightBoxImage();
        lightBox.classList.add('active');
        const lbScrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${lbScrollY}px`;
        document.body.style.width = '100%';
        document.body.dataset.lbScrollY = lbScrollY;
        document.body.classList.add('no-scroll');
        document.documentElement.classList.add('no-scroll');
    }
}

function updateLightBoxImage() {
    const lightBoxImg = document.getElementById('lightBoxImage');
    if (lightBoxImg && window.lightBoxImages && window.lightBoxImages.length > 0) {
        lightBoxImg.src = getLightBoxImageUrl(window.lightBoxImages[window.lightBoxCurrentIndex]);
        lightBoxImg.dataset.zoomLevel = '0';
        lightBoxImg.style.transform = 'scale(1)';
        lightBoxImg.style.transformOrigin = 'center center';
        lightBoxImg.style.cursor = 'zoom-in';
    }
}

function closeLightBox() {
    const lightBox = document.getElementById('lightBoxModal');
    const lightBoxImg = document.getElementById('lightBoxImage');

    if (lightBox) {
        lightBox.classList.remove('active');
        const lbScrollY = parseInt(document.body.dataset.lbScrollY || '0');
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.classList.remove('no-scroll');
        document.documentElement.classList.remove('no-scroll');
        window.scrollTo(0, lbScrollY);
    }
    if (lightBoxImg) {
        lightBoxImg.dataset.zoomLevel = '0';
        lightBoxImg.style.transform = 'scale(1)';
        lightBoxImg.style.transformOrigin = 'center center';
    }
}

// PDF Generation Logic
(function () {
    const PDF_MARGIN = 12;
    const PDF_META_RESERVE = 58;
    const PDF_COL_GAP = 8;

    function resolvePdfImageUrl(url) {
        if (!url) return '';
        if (typeof DDAImages !== 'undefined') {
            const resolved = DDAImages.resolveImageUrl(url, window.location.href);
            return DDAImages.getPdfImageUrl(resolved);
        }
        return url;
    }

    function imageFormatFromDataUrl(dataUrl) {
        if (String(dataUrl).startsWith('data:image/png')) return 'PNG';
        return 'JPEG';
    }

    async function fetchBase64(src) {
        try {
            const response = await fetch(src);
            const blob = await response.blob();
            return await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (fetchErr) {
            return await new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth || img.width || 800;
                    canvas.height = img.naturalHeight || img.height || 800;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    try { resolve(canvas.toDataURL('image/jpeg', 0.92)); }
                    catch (e) { reject(e); }
                };
                img.onerror = () => reject(new Error('Image load error'));
                img.src = src;
            });
        }
    }

    async function getImgDims(base64) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({
                w: img.naturalWidth || 800,
                h: img.naturalHeight || 800
            });
            img.src = base64;
        });
    }

    function fitInBox(imgW, imgH, boxW, boxH) {
        const scale = Math.min(boxW / imgW, boxH / imgH);
        return { w: imgW * scale, h: imgH * scale };
    }

    function getArtworkDataFromCard(card) {
        const key = card.dataset.artworkKey;
        if (key && window.DDACatalog && typeof window.DDACatalog.getArtworkByKey === 'function') {
            const artwork = window.DDACatalog.getArtworkByKey(key);
            if (artwork) return artwork;
        }

        const imgEl = card.querySelector('img');
        const imgSrc = imgEl ? imgEl.src : '';
        const fullSrc = imgEl?.dataset?.fullSrc || imgSrc;
        return (window.products || []).find((p) => {
            const pop = String(p.image || '').split('/').pop();
            return pop && (imgSrc.includes(pop) || fullSrc.includes(pop));
        }) || null;
    }

    function getArtworkImageUrls(artwork, imgEl) {
        const toUrl = (entry) => {
            if (!entry) return '';
            const raw = typeof entry === 'string' ? entry : (entry.filePath || entry.url || entry.imageUrl || '');
            return resolvePdfImageUrl(raw);
        };

        if (artwork && Array.isArray(artwork.images) && artwork.images.length > 0) {
            const urls = artwork.images.map(toUrl).filter(Boolean);
            if (urls.length) return urls;
        }

        const fallback = imgEl?.dataset?.fullSrc || imgEl?.src || artwork?.image || '';
        return fallback ? [resolvePdfImageUrl(fallback)] : [];
    }

    function addWatermark(doc) {
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.06 }));
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(72);
        doc.setTextColor(0);
        doc.text('dda', pageW / 2, pageH / 2, { align: 'center', angle: 45 });
        doc.restoreGraphicsState();
    }

    async function addArtworkImages(doc, imageUrls, yPos, pageW, pageH) {
        const contentW = pageW - PDF_MARGIN * 2;
        const maxImgH = pageH - PDF_MARGIN * 2 - PDF_META_RESERVE;

        if (imageUrls.length >= 2) {
            const colW = (contentW - PDF_COL_GAP) / 2;
            const frontBase64 = await fetchBase64(imageUrls[0]);
            const backBase64 = await fetchBase64(imageUrls[1]);
            const frontDims = await getImgDims(frontBase64);
            const backDims = await getImgDims(backBase64);
            const frontFit = fitInBox(frontDims.w, frontDims.h, colW, maxImgH);
            const backFit = fitInBox(backDims.w, backDims.h, colW, maxImgH);
            const rowH = Math.max(frontFit.h, backFit.h);

            const frontX = PDF_MARGIN + (colW - frontFit.w) / 2;
            const frontY = yPos + (rowH - frontFit.h) / 2;
            doc.addImage(frontBase64, imageFormatFromDataUrl(frontBase64), frontX, frontY, frontFit.w, frontFit.h);

            const backX = PDF_MARGIN + colW + PDF_COL_GAP + (colW - backFit.w) / 2;
            const backY = yPos + (rowH - backFit.h) / 2;
            doc.addImage(backBase64, imageFormatFromDataUrl(backBase64), backX, backY, backFit.w, backFit.h);

            doc.setFontSize(7);
            doc.setTextColor(180);
            doc.text('FRENTE', PDF_MARGIN + colW / 2, yPos + rowH + 4, { align: 'center' });
            doc.text('REVERSO', PDF_MARGIN + colW + PDF_COL_GAP + colW / 2, yPos + rowH + 4, { align: 'center' });

            return yPos + rowH + 10;
        }

        const frontBase64 = await fetchBase64(imageUrls[0]);
        const frontDims = await getImgDims(frontBase64);
        const fit = fitInBox(frontDims.w, frontDims.h, contentW, maxImgH);
        const xOffset = PDF_MARGIN + (contentW - fit.w) / 2;
        doc.addImage(frontBase64, imageFormatFromDataUrl(frontBase64), xOffset, yPos, fit.w, fit.h);
        return yPos + fit.h + 8;
    }

    function addArtworkMeta(doc, title, price, productData, yPos, pageW) {
        const margin = PDF_MARGIN;
        const textW = pageW - margin * 2;

        doc.setFontSize(15);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);
        doc.text(title, margin, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(90);

        if (productData) {
            if (productData.technique) {
                doc.text(`Técnica: ${productData.technique}`, margin, yPos);
                yPos += 5;
            }
            if (productData.dimensions) {
                doc.text(`Dimensiones: ${productData.dimensions}`, margin, yPos);
                yPos += 5;
            }
            if (productData.year && productData.year !== 'Consultar año') {
                doc.text(String(productData.year), margin, yPos);
                yPos += 5;
            }
            if (productData.description) {
                yPos += 2;
                doc.setFontSize(9);
                doc.setTextColor(70);
                doc.setFont('helvetica', 'italic');
                const plainDesc = String(productData.description).replace(/<[^>]*>/g, '');
                const descLines = doc.splitTextToSize(plainDesc, textW);
                doc.text(descLines, margin, yPos);
                yPos += descLines.length * 4.5 + 3;
            }
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);
        doc.text(`Precio: ${price}`, margin, yPos + 2);
    }

    document.addEventListener('DOMContentLoaded', () => {
        const btnDownloadPDF = document.getElementById('btnDownloadPDF');
        if (!btnDownloadPDF) return;

        btnDownloadPDF.addEventListener('click', async (e) => {
            e.preventDefault();

            const originalText = btnDownloadPDF.innerHTML;
            btnDownloadPDF.innerHTML = 'Generando PDF...';
            btnDownloadPDF.style.opacity = '0.7';
            btnDownloadPDF.disabled = true;

            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                const pageW = doc.internal.pageSize.getWidth();
                const pageH = doc.internal.pageSize.getHeight();

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(22);
                doc.text('Catálogo - Diego De Aduriz', PDF_MARGIN, 20);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(12);
                doc.setTextColor(100);
                const date = new Date().toLocaleDateString('es-AR');
                doc.text(`Generado el ${date}`, PDF_MARGIN, 28);
                doc.setTextColor(0);
                addWatermark(doc);

                const visibleCards = Array.from(document.querySelectorAll('.product-card')).filter((card) => {
                    if (card.style.display === 'none') return false;
                    if (card.classList.contains('hidden')) return false;
                    return card.offsetParent !== null || card.classList.contains('is-visible');
                });

                if (visibleCards.length === 0) {
                    alert('No hay productos visibles para incluir en el catálogo.');
                    return;
                }

                for (let i = 0; i < visibleCards.length; i++) {
                    const card = visibleCards[i];
                    const imgEl = card.querySelector('img');
                    const title = card.querySelector('.product-title')?.innerText || 'Obra sin título';
                    const priceEl = card.querySelector('.product-price');
                    const price = priceEl ? priceEl.innerText : 'Consultar';
                    const productData = getArtworkDataFromCard(card);
                    const imageUrls = getArtworkImageUrls(productData, imgEl);

                    doc.addPage();
                    addWatermark(doc);

                    let yPos = PDF_MARGIN;

                    if (imageUrls.length > 0) {
                        try {
                            yPos = await addArtworkImages(doc, imageUrls, yPos, pageW, pageH);
                        } catch (err) {
                            console.warn('Could not add image to PDF', err);
                            doc.setDrawColor(200);
                            doc.rect(PDF_MARGIN, yPos, pageW - PDF_MARGIN * 2, 40);
                            doc.setFontSize(10);
                            doc.text('Sin imagen', pageW / 2, yPos + 22, { align: 'center' });
                            yPos += 48;
                        }
                    }

                    addArtworkMeta(doc, title, price, productData, yPos, pageW);
                }

                doc.save('Catalogo_DiegoDeAduriz.pdf');
            } catch (error) {
                console.error('PDF Generation Error:', error);
                alert('Hubo un error al generar el PDF. Por favor, intenta de nuevo.');
            } finally {
                btnDownloadPDF.innerHTML = originalText;
                btnDownloadPDF.style.opacity = '1';
                btnDownloadPDF.disabled = false;
            }
        });
    });
})();