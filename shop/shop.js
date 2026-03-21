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
        'card.details': '👁 DETALLES',
        'card.buy': '🛒 COMPRAR',
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
        'card.details': '👁 DETAILS',
        'card.buy': '🛒 BUY',
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

    const gridParams = document.getElementById('productsGrid');
    if (gridParams) {
        renderGrid(window.products || []);
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
                card.style.animation = 'none';
                setTimeout(() => { card.style.animation = 'fadeIn 0.5s ease-in-out'; }, 10);
                visibleCount++;
            } else {
                card.style.display = 'none';
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

            // In shop (not catalog): redirect to catalog with query
            if (!isCatalogPage && searchQuery.trim().length > 0) {
                clearTimeout(searchInput._redirectTimer);
                searchInput._redirectTimer = setTimeout(() => {
                    const q = encodeURIComponent(searchInput.value.trim());
                    window.location.href = 'catalog.html?q=' + q;
                }, 600); // wait 600ms after user stops typing
            } else {
                clearTimeout(searchInput._redirectTimer);
                applyFilters();
            }
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

        // Clear on Escape
        searchInput.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                searchQuery = '';
                if (searchClear) searchClear.classList.remove('visible');
                if (searchCount) searchCount.textContent = '';
                applyFilters();
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
        <div id="imageModal" class="image-modal">
            <span class="modal-close">&times;</span>
            <div class="modal-container">
                <div class="modal-image-wrapper">
                    <span class="modal-prev" id="modalPrev">&#10094;</span>
                    <span class="modal-next" id="modalNext">&#10095;</span>
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
        <div id="lightBoxModal" class="lightbox-modal">
            <span class="lightbox-close">&times;</span>
            <span class="lightbox-prev" id="lightBoxPrev">&#10094;</span>
            <span class="lightbox-next" id="lightBoxNext">&#10095;</span>
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

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (modal && modal.classList.contains('active')) closeModal();
            if (lightBoxModal && lightBoxModal.classList.contains('active')) closeLightBox();
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

        function startAuto() { autoTimer = setInterval(autoAdvance, 5000); }
        function stopAuto() { clearInterval(autoTimer); }

        startAuto();

        container.addEventListener('mouseenter', () => { paused = true; stopAuto(); });
        container.addEventListener('mouseleave', () => { paused = false; startAuto(); });
        container.addEventListener('touchstart', () => { paused = true; stopAuto(); }, { passive: true });
        container.addEventListener('touchend', () => {
            paused = false;
            setTimeout(startAuto, 2000); // resume after 2s of inactivity
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

});

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

        card.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.title}">
                ${overlayHTML}
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                ${priceHTML}
                <div class="product-actions-grid">
                    <button class="btn-grid-action btn-grid-details" data-i18n="card.details">
                        <span class="btn-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" class="icon-eye" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                        </span>
                        <span>DETALLES</span>
                    </button>
                    ${product.sold ? `<button class="btn-grid-action btn-grid-sold" data-i18n="card.sold" disabled aria-disabled="true" style="opacity:0.4;cursor:not-allowed">✗ VENDIDO</button>` : `<button class="btn-grid-action btn-grid-buy" data-i18n="card.buy">🛒 COMPRAR</button>`}
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