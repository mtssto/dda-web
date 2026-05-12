// Filter functionality
// Products are loaded from products.js into window.products

// Language Configuration (Shop Specific)
window.pageTranslations = {
    es: {
        'hero.eyebrow': 'Arte Argentino Contemporáneo',
        'hero.subtitle': 'Obras Originales y Ediciones Limitadas',
        'hero.featured': 'Destacados',
        'filter.all': 'Todos',
        'filter.pasteles': 'Pasteles',
        'filter.digital': 'Arte Digital',
        'filter.gatos': 'Gatos',
        'filter.paisajes': 'Paisajes',
        'filter.Autorretratos': 'Autorretratos',
        'filter.ilustraciones': 'Ilustraciones',
        'card.details': 'DETALLES',
        'card.buy': 'COMPRAR',
        'card.sold': 'VENDIDO',
        'modal.dimensions': 'Dimensiones',
        'modal.technique': 'Técnica',
        'modal.consult': 'CONSULTAR / COMPRAR',
        'shop.guarantee': 'Autenticidad Garantizada',
        'shop.guarantee_desc': 'Todas las obras incluyen certificado.',
        'shop.shipping': 'Envíos Globales',
        'shop.shipping_desc': 'Enviamos a todo el mundo con embalaje seguro.',
        'shop.service': 'Atención Personalizada',
        'shop.service_desc': 'Contacto directo por WhatsApp para consultas.',
        'catalog.title': 'Catálogo',
        'catalog.download': 'Descargar Catálogo (PDF)',
        'shop.see_all': 'Ver catálogo completo',
        'shop.ver_todo': 'Ver catálogo completo',
        'shop.cta_eyebrow': 'Obras originales · Ediciones limitadas · Envíos internacionales',
        'shop.float_cta': '¿Querés ver todas las obras?',
        'shop.float_btn': 'Ver catálogo completo',
        'shop.whatsapp_float': 'Consultar por WhatsApp'
    },
    en: {
        'hero.eyebrow': 'Contemporary Argentine Art',
        'hero.subtitle': 'Original Artworks & Limited Editions',
        'hero.featured': 'Featured',
        'filter.all': 'All',
        'filter.pasteles': 'Pastels',
        'filter.digital': 'Digital Art',
        'filter.gatos': 'Cats',
        'filter.paisajes': 'Landscapes',
        'filter.Autorretratos': 'Self-portraits',
        'filter.ilustraciones': 'Illustrations',
        'card.details': 'DETAILS',
        'card.buy': 'BUY',
        'card.sold': 'SOLD',
        'modal.dimensions': 'Dimensions',
        'modal.technique': 'Technique',
        'modal.consult': 'INQUIRE / BUY',
        'shop.guarantee': 'Authenticity Guaranteed',
        'shop.guarantee_desc': 'All artworks arrive with a signed certificate.',
        'shop.shipping': 'Global Shipping',
        'shop.shipping_desc': 'We ship worldwide with secure packaging.',
        'shop.service': 'Personal Service',
        'shop.service_desc': 'Direct contact via WhatsApp for inquiries.',
        'catalog.title': 'Catalog',
        'catalog.download': 'Download Catalog (PDF)',
        'shop.see_all': 'SEE ALL PRODUCTS',
        'shop.ver_todo': 'View full catalog →',
        'shop.cta_eyebrow': 'Original artworks · Limited editions · International shipping',
        'shop.float_cta': 'Want to see all the works?',
        'shop.float_btn': 'View full catalog',
        'shop.whatsapp_float': 'Inquire via WhatsApp'
    }
};

document.addEventListener('DOMContentLoaded', function () {
    // Re-apply translations on load to catch page-specific ones
    const savedLang = localStorage.getItem('preferredLanguage') || 'es';
    if (window.changeLanguage) {
        window.changeLanguage(savedLang);
    }

    function initShopContent() {
        // Dynamic product count on hero + "See All" button
        const btnSeeAll = document.getElementById('btnSeeAll');
        const heroCount = document.getElementById('heroObraCount');
        if (window.products && window.products.length > 0) {
            const count = window.products.length;
            const lang = localStorage.getItem('preferredLanguage') || 'es';
            if (btnSeeAll) {
                btnSeeAll.textContent = lang === 'en'
                    ? `VIEW ALL ${count} WORKS`
                    : `VER LAS ${count} OBRAS DEL CATÁLOGO`;
            }
            if (heroCount) {
                heroCount.textContent = lang === 'en'
                    ? `${count} works available`
                    : `${count} obras disponibles`;
            }
        }

        renderCarouselSections();

        const gridParams = document.getElementById('productsGrid');
        if (gridParams) {
            renderGrid(window.products || []);
        }
    }

    // Try loading from the backend API; fall back to static products.js
    if (typeof DDAApi !== 'undefined') {
        DDAApi.loadProducts().then(function () { initShopContent(); });
    } else {
        initShopContent();
    }

    // Update auth header buttons based on login state
    var authBtns = document.getElementById('authHeaderBtns');
    if (authBtns && typeof DDAAuth !== 'undefined') {
        if (DDAAuth.isAuthenticated()) {
            var user = DDAAuth.getUser();
            var isAdmin = user && user.role === 'ADMIN';
            authBtns.innerHTML =
                '<a href="mi-cuenta.html" class="auth-header-link">' +
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ' +
                    (user ? user.username.toUpperCase() : 'MI CUENTA') +
                '</a>' +
                (isAdmin ? '<a href="admin.html" class="auth-header-link">ADMIN</a>' : '') +
                '<a href="#" class="auth-header-link" id="headerLogout">SALIR</a>';
            var logoutLink = document.getElementById('headerLogout');
            if (logoutLink) {
                logoutLink.addEventListener('click', function (e) {
                    e.preventDefault();
                    DDAAuth.logout();
                });
            }
        }
    }

    // Filter Logic
    const categoryFilter = document.getElementById('categoryFilter');
    const sizeFilter    = document.getElementById('sizeFilter');
    const searchInput   = document.getElementById('shopSearchInput');
    const searchClear   = document.getElementById('shopSearchClear');
    const searchCount   = document.getElementById('shopSearchCount');
    let   searchQuery   = '';

    // ── Size classification ────────────────────────────────
    // Returns 'small' (≤50cm), 'medium' (51-120cm), 'large' (>120cm), or 'consult'
    function getSizeBucket(dimensionsStr) {
        if (!dimensionsStr || dimensionsStr === 'Consultar medidas' ||
            dimensionsStr === 'undefined' || dimensionsStr.trim() === '') {
            return 'consult';
        }
        // Parse first two numbers from strings like "140 x 125 cm" or "1,70 x 50 cm"
        const nums = dimensionsStr
            .replace(/,/g, '.')           // "1,70" → "1.70"
            .match(/[\d.]+/g);
        if (!nums || nums.length < 2) return 'consult';

        // Convert values < 10 to cm (* 100) — handles "1.70 x 50" → 170 x 50
        const parse = v => {
            const n = parseFloat(v);
            return n < 10 ? n * 100 : n;
        };
        const max = Math.max(parse(nums[0]), parse(nums[1]));

        if (max <= 50) return 'small';
        if (max <= 120) return 'medium';
        return 'large';
    }

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

    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }
    if (sizeFilter) {
        sizeFilter.addEventListener('change', applyFilters);
    }



    // ── Search input ──────────────────────────────────────
    if (searchInput) {
        const isCatalogPage = window.location.pathname.includes('catalog');

        searchInput.addEventListener('input', () => {
            searchQuery = searchInput.value;
            if (searchClear) {
                searchClear.classList.toggle('visible', searchQuery.length > 0);
            }

            if (isCatalogPage) {
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
            if (e.key === 'Enter' && !isCatalogPage && searchInput.value.trim()) {
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

    initCustomDropdowns();

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
    const lightBoxClose = document.querySelector('.lightbox-close');

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
    if (urlQuery && searchInput) {
        searchInput.value = urlQuery;
        searchQuery       = urlQuery;
        if (searchClear) searchClear.classList.add('visible');
        setTimeout(() => {
            applyFilters();
            const grid = document.getElementById('productsGrid');
            if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    }

    if (itemParam) {
        const decodedItem = decodeURIComponent(itemParam);
        // Find product in data source logic
        const foundProduct = (window.products || []).find(p => p.image.includes(decodedItem));
        if (foundProduct) {
            openModal(foundProduct);
        }
    }

    // Carousel Logic — manual buttons + auto-scroll
    const carouselContainers = document.querySelectorAll('.carousel-container-mini');
    carouselContainers.forEach(container => {
        const track = container.querySelector('.carousel-track');
        const prevBtn = container.querySelector('.prev-btn');
        const nextBtn = container.querySelector('.next-btn');

        if (!track) return;

        const cardWidth = () => {
            const card = track.querySelector('.carousel-card');
            return card ? card.offsetWidth + 20 : 320;
        };

        if (prevBtn) prevBtn.addEventListener('click', () => { track.scrollBy({ left: -cardWidth(), behavior: 'smooth' }); });
        if (nextBtn) nextBtn.addEventListener('click', () => { track.scrollBy({ left: cardWidth(), behavior: 'smooth' }); });

        // Auto-scroll: advance one card every 3.5s, pause on hover/touch
        let autoTimer = null;
        let paused = false;

        function autoAdvance() {
            if (paused) return;
            const maxScroll = track.scrollWidth - track.clientWidth;
            if (track.scrollLeft >= maxScroll - 4) {
                track.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                track.scrollBy({ left: cardWidth(), behavior: 'smooth' });
            }
        }

        var autoInterval = window.innerWidth <= 768 ? 6000 : 5000;
        function startAuto() { autoTimer = setInterval(autoAdvance, autoInterval); }
        function stopAuto() { clearInterval(autoTimer); }

        startAuto();

        container.addEventListener('mouseenter', () => { paused = true; stopAuto(); });
        container.addEventListener('mouseleave', () => { paused = false; startAuto(); });
        container.addEventListener('touchstart', () => { paused = true; stopAuto(); }, { passive: true });
        container.addEventListener('touchend', () => {
            paused = false;
            setTimeout(startAuto, 3000);
        }, { passive: true });
    });

    // Global Event Delegation for LightBox (catches all .product-image img clicks including static carousels)
    document.addEventListener('click', function (e) {
        if (e.target.tagName === 'IMG' && e.target.closest('.product-image')) {
            e.preventDefault();
            e.stopPropagation();
            const relSrc = e.target.getAttribute('src');
            openLightBox(relSrc || e.target.src);
        }
    }, true); // Use capture phase to intercept before card's onclick

    // ── Back-to-Top Button ──────────────────────────────
    (function () {
        var btn = document.createElement('button');
        btn.className = 'back-to-top';
        btn.setAttribute('aria-label', 'Volver arriba');
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
        document.body.appendChild(btn);
        window.addEventListener('scroll', function () {
            btn.classList.toggle('visible', window.scrollY > 400);
        }, { passive: true });
        btn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    })();

    // ── Category Counts ─────────────────────────────────
    (function () {
        if (!window.products) return;
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
    })();

    // ── Sort Dropdown ───────────────────────────────────
    (function () {
        var isCatalog = window.location.pathname.includes('catalog');
        if (!isCatalog || !window.products) return;
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

        var normalize = function (str) {
            return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
        };

        input.addEventListener('input', function () {
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

            if (matches.length === 0) {
                dropdown.classList.remove('open');
                dropdown.innerHTML = '';
                return;
            }
            dropdown.innerHTML = matches.map(function (p) {
                var webpSrc = toWebP(p.image);
                return '<div class="search-dropdown-item" data-id="' + p.id + '">' +
                    '<img src="' + webpSrc + '" alt="' + p.title + '">' +
                    '<div class="search-item-info">' +
                        '<div class="search-item-title">' + p.title + '</div>' +
                        '<div class="search-item-meta">' + (p.technique || '') + (p.year && p.year !== 'Consultar año' && p.year !== 'a confirmar' ? ' · ' + p.year : '') + '</div>' +
                    '</div>' +
                '</div>';
            }).join('') +
            '<div class="search-dropdown-footer">Ver catálogo completo →</div>';

            dropdown.classList.add('open');
        });

        dropdown.addEventListener('click', function (e) {
            var item = e.target.closest('.search-dropdown-item');
            if (item) {
                var pid = item.getAttribute('data-id');
                var product = window.products.find(function (p) { return p.id === pid; });
                if (product) {
                    dropdown.classList.remove('open');
                    input.value = '';
                    openModal(product);
                }
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

    // ── Recently Viewed Section ──────────────────────────
    (function () {
        var rv = JSON.parse(localStorage.getItem('dda_recently_viewed') || '[]');
        if (!rv.length) return;

        var grid = document.getElementById('productsGrid');
        var target = grid ? grid.parentElement : document.querySelector('.shop-content') || document.querySelector('main');
        if (!target) return;

        var section = document.createElement('div');
        section.className = 'recently-viewed-section';
        section.innerHTML = '<h3>Vistos recientemente</h3><div class="recently-viewed-track"></div>';
        target.appendChild(section);

        var track = section.querySelector('.recently-viewed-track');
        rv.forEach(function (item) {
            var el = document.createElement('div');
            el.className = 'recently-viewed-item';
            el.innerHTML = pictureTag(item.image, item.title, ' loading="lazy" width="140" height="140"') +
                '<div class="rv-title">' + item.title + '</div>' +
                (item.year ? '<div class="rv-year">' + item.year + '</div>' : '');
            el.addEventListener('click', function () {
                if (!window.products) return;
                var p = window.products.find(function (pr) { return (pr.id || pr.title) === item.id; });
                if (p) openModal(p);
            });
            track.appendChild(el);
        });
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

function encodeSrcset(url) {
    return url.replace(/ /g, '%20');
}

function pictureTag(src, alt, extra) {
    var webpSrc = toWebP(src);
    return '<picture>' +
        '<source srcset="' + encodeSrcset(webpSrc) + '" type="image/webp">' +
        '<img src="' + src + '" alt="' + alt + '"' + (extra || '') + '>' +
    '</picture>';
}

function renderCarouselSections() {
    var container = document.getElementById('carouselSectionsContainer');
    if (!container || !window.carouselSections || !window.products) return;

    var productsByImage = {};
    window.products.forEach(function (p) {
        if (p.image) productsByImage[p.image] = p;
    });

    var eyeSvg = '<svg viewBox="0 0 24 24" class="icon-eye" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
    var heartSvgCarousel = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';

    window.carouselSections.forEach(function (section, sIdx) {
        var sectionEl = document.createElement('section');
        sectionEl.className = 'shop-hero-vertical';
        if (sIdx > 0) sectionEl.style.padding = '20px 0 60px';

        var wrapper = document.createElement('div');
        wrapper.className = 'hero-featured';
        var carouselWrapper = document.createElement('div');
        carouselWrapper.className = 'featured-carousel-wrapper';

        var label = document.createElement('h2');
        label.className = 'featured-label';
        if (section.labelKey) label.setAttribute('data-i18n', section.labelKey);
        label.textContent = section.labelDefault;
        carouselWrapper.appendChild(label);

        var miniContainer = document.createElement('div');
        miniContainer.className = 'carousel-container-mini';

        var prevBtn = document.createElement('button');
        prevBtn.className = 'carousel-btn prev-btn';
        prevBtn.setAttribute('aria-label', 'Previous');
        prevBtn.innerHTML = '&#10094;';

        var track = document.createElement('div');
        track.className = 'carousel-track';

        section.images.forEach(function (imgPath) {
            var product = productsByImage[imgPath];
            if (!product) return;

            var card = document.createElement('div');
            card.className = 'product-card carousel-card';
            card.setAttribute('data-category', product.category || '');
            card.setAttribute('data-dimensions', product.dimensions || '');
            card.setAttribute('data-technique', product.technique || '');
            if (product.sold) card.classList.add('sold');

            var soldBtnHtml;
            if (product.sold) {
                soldBtnHtml = '<button class="btn-grid-action btn-grid-sold" disabled aria-disabled="true" style="opacity:0.4;cursor:not-allowed">\u2717 <span data-i18n="card.sold">VENDIDO</span></button>';
            } else {
                soldBtnHtml = '<button class="btn-grid-action btn-grid-buy"><span class="btn-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></span> <span data-i18n="card.buy">COMPRAR</span></button>';
            }

            var carouselAltParts = [product.title];
            if (product.technique) carouselAltParts.push(product.technique);
            if (product.dimensions) carouselAltParts.push(product.dimensions);
            var carouselAlt = carouselAltParts.join(' — ') + ' — Diego De Aduriz';

            var carouselWl = JSON.parse(localStorage.getItem('dda_wishlist') || '[]');
            var carouselIsWished = carouselWl.indexOf(product.id) !== -1;

            card.innerHTML =
                '<div class="product-image">' +
                    '<button class="btn-wishlist' + (carouselIsWished ? ' active' : '') + '" data-product-id="' + product.id + '" aria-label="Agregar a favoritos">' + heartSvgCarousel + '</button>' +
                    pictureTag(product.image, carouselAlt, ' loading="lazy"') +
                '</div>' +
                '<div class="product-info">' +
                    '<h3 class="product-title">' + product.title + '</h3>' +
                    '<p class="product-price">' + product.price + '</p>' +
                    '<div class="product-actions-grid">' +
                        '<button class="btn-grid-action btn-grid-details">' +
                            '<span class="btn-icon" aria-hidden="true">' + eyeSvg + '</span>' +
                            ' <span data-i18n="card.details">DETALLES</span>' +
                        '</button>' +
                        soldBtnHtml +
                    '</div>' +
                '</div>';

            card.addEventListener('click', function (e) {
                if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
                openModal(product);
            });

            var detailsBtn = card.querySelector('.btn-grid-details');
            if (detailsBtn) {
                detailsBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    openModal(product);
                });
            }

            var buyBtn = card.querySelector('.btn-grid-buy');
            if (buyBtn) {
                buyBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    if (typeof openInquiry === 'function') {
                        openInquiry(product.title, product.price);
                    }
                });
            }

            var wishBtn = card.querySelector('.btn-wishlist');
            if (wishBtn) {
                wishBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    var wl = JSON.parse(localStorage.getItem('dda_wishlist') || '[]');
                    var idx = wl.indexOf(product.id);
                    if (idx === -1) {
                        wl.push(product.id);
                        this.classList.add('active');
                    } else {
                        wl.splice(idx, 1);
                        this.classList.remove('active');
                    }
                    localStorage.setItem('dda_wishlist', JSON.stringify(wl));
                });
            }

            track.appendChild(card);
        });

        var nextBtn = document.createElement('button');
        nextBtn.className = 'carousel-btn next-btn';
        nextBtn.setAttribute('aria-label', 'Next');
        nextBtn.innerHTML = '&#10095;';

        miniContainer.appendChild(prevBtn);
        miniContainer.appendChild(track);
        miniContainer.appendChild(nextBtn);
        carouselWrapper.appendChild(miniContainer);
        wrapper.appendChild(carouselWrapper);
        sectionEl.appendChild(wrapper);
        container.appendChild(sectionEl);
    });

    if (window.updatePageTranslations) window.updatePageTranslations();
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
        const wishlist = JSON.parse(localStorage.getItem('dda_wishlist') || '[]');
        const isWished = wishlist.indexOf(product.id) !== -1;
        const heartSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';

        const altParts = [product.title];
        if (product.technique) altParts.push(product.technique);
        if (product.dimensions) altParts.push(product.dimensions);
        if (product.year && product.year !== 'Consultar año' && product.year !== 'a confirmar') altParts.push(product.year);
        const richAlt = altParts.join(' — ');

        card.innerHTML = `
            <div class="product-image loading">
                <div class="skeleton-shimmer"></div>
                <button class="btn-wishlist${isWished ? ' active' : ''}" data-product-id="${product.id}" aria-label="Agregar a favoritos">${heartSvg}</button>
                <picture>
                    <source srcset="${encodeSrcset(toWebP(product.image))}" type="image/webp">
                    <img src="${product.image}" alt="${richAlt}" loading="lazy">
                </picture>
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
                openModal(product);
            };
        }

        if (btnDetailsOverlay) {
            btnDetailsOverlay.onclick = (e) => {
                e.stopPropagation();
                openModal(product);
            };
        }

        if (btnBuy) {
            btnBuy.onclick = (e) => {
                e.stopPropagation();
                if (typeof openInquiry === 'function') {
                    openInquiry(product.title, product.price);
                } else {
                    buyProduct(product);
                }
            };
        }

        const btnWishlist = card.querySelector('.btn-wishlist');
        if (btnWishlist) {
            btnWishlist.onclick = (e) => {
                e.stopPropagation();
                let wl = JSON.parse(localStorage.getItem('dda_wishlist') || '[]');
                const idx = wl.indexOf(product.id);
                if (idx === -1) {
                    wl.push(product.id);
                    btnWishlist.classList.add('active');
                } else {
                    wl.splice(idx, 1);
                    btnWishlist.classList.remove('active');
                }
                localStorage.setItem('dda_wishlist', JSON.stringify(wl));
            };
        }

        // Skeleton loader: hide shimmer when image loads
        const imgEl = card.querySelector('.product-image img');
        const imageDiv = card.querySelector('.product-image');
        if (imgEl && imageDiv) {
            imgEl.addEventListener('load', () => { imageDiv.classList.remove('loading'); });
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

    // Track recently viewed
    if (product.id || product.title) {
        var rvKey = 'dda_recently_viewed';
        var rv = JSON.parse(localStorage.getItem(rvKey) || '[]');
        var rvId = product.id || product.title;
        rv = rv.filter(function (item) { return item.id !== rvId; });
        rv.unshift({ id: rvId, title: product.title, image: product.image, year: product.year || '' });
        if (rv.length > 8) rv = rv.slice(0, 8);
        localStorage.setItem(rvKey, JSON.stringify(rv));
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

function buyProduct(product) {
    if (typeof openInquiry === 'function') {
        openInquiry(product.title, product.price);
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

function openLightBox(imageSrc) {
    const lightBox = document.getElementById('lightBoxModal');

    if (lightBox) {
        // Extract src regardless of parameter type
        let src = typeof imageSrc === 'string' ? imageSrc : (imageSrc.src || '');

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
        lightBoxImg.src = window.lightBoxImages[window.lightBoxCurrentIndex];
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
document.addEventListener('DOMContentLoaded', () => {
    const btnDownloadPDF = document.getElementById('btnDownloadPDF');
    if (btnDownloadPDF) {
        btnDownloadPDF.addEventListener('click', async (e) => {
            e.preventDefault();

            // Show loading state
            const originalText = btnDownloadPDF.innerHTML;
            btnDownloadPDF.innerHTML = 'Generando PDF...';
            btnDownloadPDF.style.opacity = '0.7';
            btnDownloadPDF.disabled = true;

            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();

                // Title
                doc.setFont("helvetica", "bold");
                doc.setFontSize(22);
                doc.text("Catálogo - Diego De Aduriz", 14, 20);

                // Subtitle
                doc.setFont("helvetica", "normal");
                doc.setFontSize(12);
                doc.setTextColor(100);
                const date = new Date().toLocaleDateString('es-AR');
                doc.text(`Generado el ${date}`, 14, 28);

                doc.setTextColor(0);

                // Watermark function
                function addWatermark(doc) {
                    const pageW = doc.internal.pageSize.getWidth();
                    const pageH = doc.internal.pageSize.getHeight();
                    doc.saveGraphicsState();
                    doc.setGState(new doc.GState({ opacity: 0.06 }));
                    doc.setFont("helvetica", "bold");
                    doc.setFontSize(72);
                    doc.setTextColor(0);
                    doc.text("dda", pageW / 2, pageH / 2, { align: "center", angle: 45 });
                    doc.restoreGraphicsState();
                }

                // Apply watermark to first page
                addWatermark(doc);

                // Get visible products
                const visibleCards = Array.from(document.querySelectorAll('.product-card')).filter(card => card.style.display !== 'none');

                if (visibleCards.length === 0) {
                    alert("No hay productos visibles para incluir en el catálogo.");
                    return;
                }

                let yPos = 40;
                const pageHeight = doc.internal.pageSize.getHeight();

                for (let i = 0; i < visibleCards.length; i++) {
                    const card = visibleCards[i];

                    // Check if we need a new page
                    if (yPos > pageHeight - 60) {
                        doc.addPage();
                        yPos = 20;
                    }

                    const title = card.querySelector('.product-title').innerText;
                    const priceEl = card.querySelector('.product-price');
                    const price = priceEl ? priceEl.innerText : 'Consultar';
                    const imgSrc = card.querySelector('img').src;

                    // Find product data from global array
                    const productData = (window.products || []).find(p => imgSrc.includes(p.image.split('/').pop()));

                    // Helper: fetch image as base64
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
                                img.onload = () => {
                                    const canvas = document.createElement('canvas');
                                    canvas.width = img.width || 800;
                                    canvas.height = img.height || 800;
                                    const ctx = canvas.getContext('2d');
                                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                    try { resolve(canvas.toDataURL('image/jpeg', 0.8)); }
                                    catch (e) { reject(e); }
                                };
                                img.onerror = () => reject('Image load error');
                                img.src = src;
                            });
                        }
                    }

                    // Helper: get image natural dimensions from base64
                    async function getImgDims(base64) {
                        return new Promise(r => {
                            const img = new Image();
                            img.onload = () => r({ w: img.naturalWidth || 800, h: img.naturalHeight || 800 });
                            img.src = base64;
                        });
                    }

                    // Helper: fit image into a box preserving aspect ratio, returns {w, h}
                    function fitInBox(imgW, imgH, boxW, boxH) {
                        if (imgW / imgH > boxW / boxH) {
                            return { w: boxW, h: (imgH / imgW) * boxW };
                        } else {
                            return { w: (imgW / imgH) * boxH, h: boxH };
                        }
                    }

                    const hasBack = productData && productData.images && productData.images.length > 1;
                    const margin = 20;
                    const pageW = 210;
                    const maxImgH = 150;

                    if (hasBack) {
                        // Side by side: each image gets half the page width minus margins
                        const colW = (pageW - margin * 2 - 8) / 2; // 8px gap between
                        try {
                            const frontBase64 = await fetchBase64(productData.images[0]);
                            const backBase64 = await fetchBase64(productData.images[1]);
                            const frontDims = await getImgDims(frontBase64);
                            const backDims = await getImgDims(backBase64);
                            const frontFit = fitInBox(frontDims.w, frontDims.h, colW, maxImgH);
                            const backFit = fitInBox(backDims.w, backDims.h, colW, maxImgH);
                            const rowH = Math.max(frontFit.h, backFit.h);

                            // Front image — left column, centered vertically
                            const frontX = margin + (colW - frontFit.w) / 2;
                            const frontY = yPos + (rowH - frontFit.h) / 2;
                            doc.addImage(frontBase64, 'JPEG', frontX, frontY, frontFit.w, frontFit.h);

                            // Back image — right column, centered vertically
                            const backX = margin + colW + 8 + (colW - backFit.w) / 2;
                            const backY = yPos + (rowH - backFit.h) / 2;
                            doc.addImage(backBase64, 'JPEG', backX, backY, backFit.w, backFit.h);

                            // Labels below images
                            doc.setFontSize(7);
                            doc.setTextColor(180);
                            doc.text('FRENTE', margin + colW / 2, yPos + rowH + 5, { align: 'center' });
                            doc.text('REVERSO', margin + colW + 8 + colW / 2, yPos + rowH + 5, { align: 'center' });

                            yPos += rowH + 10;
                        } catch (e) {
                            console.warn('Error adding side-by-side images', e);
                            yPos += 10;
                        }
                    } else {
                        // Single image centered
                        try {
                            const frontBase64 = await fetchBase64(imgSrc);
                            const frontDims = await getImgDims(frontBase64);
                            const fit = fitInBox(frontDims.w, frontDims.h, 170, maxImgH);
                            const xOffset = margin + (170 - fit.w) / 2;
                            doc.addImage(frontBase64, 'JPEG', xOffset, yPos, fit.w, fit.h);
                            yPos += fit.h + 10;
                        } catch (e) {
                            console.warn('Could not add image to PDF', e);
                            doc.setDrawColor(200);
                            doc.rect(margin, yPos, 170, 80);
                            doc.setFontSize(10);
                            doc.text("Sin imagen", 105, yPos + 40, { align: "center" });
                            yPos += 90;
                        }
                    }

                    // Text info
                    if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20; addWatermark(doc); }
                    doc.setFontSize(15);
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(0);
                    doc.text(title, margin, yPos);
                    yPos += 8;

                    doc.setFontSize(10);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(90);
                    if (productData) {
                        if (productData.technique) { doc.text(`Técnica: ${productData.technique}`, margin, yPos); yPos += 5; }
                        if (productData.dimensions) { doc.text(`Dimensiones: ${productData.dimensions}`, margin, yPos); yPos += 5; }
                        if (productData.year && productData.year !== "Consultar año") { doc.text(productData.year, margin, yPos); yPos += 5; }
                        if (productData.description) {
                            yPos += 2;
                            doc.setFontSize(9);
                            doc.setTextColor(70);
                            doc.setFont("helvetica", "italic");
                            const plainDesc = productData.description.replace(/<[^>]*>/g, ""); const descLines = doc.splitTextToSize(plainDesc, 170);
                            doc.text(descLines, margin, yPos);
                            yPos += descLines.length * 4.5 + 3;
                        }
                    }

                    doc.setFontSize(12);
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(0);
                    doc.text(`Precio: ${price}`, margin, yPos + 2);

                    // New page for next product + watermark
                    doc.addPage();
                    addWatermark(doc);
                    yPos = 20;
                }

                // Save the PDF
                doc.save("Catalogo_DiegoDeAduriz.pdf");

            } catch (error) {
                console.error("PDF Generation Error:", error);
                alert("Hubo un error al generar el PDF. Por favor, intenta de nuevo.");
            } finally {
                // Restore button
                btnDownloadPDF.innerHTML = originalText;
                btnDownloadPDF.style.opacity = '1';
                btnDownloadPDF.disabled = false;
            }
        });
    }
});