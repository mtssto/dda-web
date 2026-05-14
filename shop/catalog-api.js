(function () {
    const PAGE_SIZE = 12;

    let currentPage = 0;
    let isLoading = false;
    let hasMore = true;
    let observer = null;
    let activeRequestController = null;
    let gridEventsBound = false;

    const artworkByKey = new Map();


    function getWishlistId(artwork) {
        if (!artwork) return '';
        return String(artwork.id ?? artwork.slug ?? artwork.title ?? '').trim();
    }

    function readWishlist() {
        try {
            const parsed = JSON.parse(localStorage.getItem('dda_wishlist') || '[]');
            return Array.isArray(parsed) ? parsed.map(String) : [];
        } catch (error) {
            console.warn('Could not read wishlist:', error);
            return [];
        }
    }

    function saveWishlist(wishlist) {
        const normalized = [];
        (wishlist || []).forEach(item => {
            const value = String(item || '').trim();
            if (value && !normalized.includes(value)) normalized.push(value);
        });
        localStorage.setItem('dda_wishlist', JSON.stringify(normalized));
    }


    function readWishlistItems() {
        try {
            const parsed = JSON.parse(localStorage.getItem('dda_wishlist_items') || '{}');
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
        } catch (error) {
            console.warn('Could not read wishlist item cache:', error);
            return {};
        }
    }

    function saveWishlistItems(items) {
        localStorage.setItem('dda_wishlist_items', JSON.stringify(items || {}));
    }

    function getFavoriteSnapshot(artwork) {
        const id = getWishlistId(artwork);

        return {
            id: id,
            backendId: artwork.id ?? null,
            slug: artwork.slug || '',
            title: artwork.title || 'Obra sin título',
            image: artwork.image || '',
            images: Array.isArray(artwork.images) ? artwork.images : (artwork.image ? [artwork.image] : []),
            price: artwork.price || 'Consultar',
            technique: artwork.technique || '',
            dimensions: artwork.dimensions || '',
            year: artwork.year || '',
            category: artwork.category || '',
            sold: artwork.sold === true,
            cachedAt: new Date().toISOString(),
            source: 'catalog'
        };
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (!document.body.classList.contains('catalog-page')) return;

        initCatalogDropdowns();
        initCatalogEvents();
        bindCatalogGridEvents();
        setupInfiniteScroll();
        hydrateSearchFromUrl();

        loadArtworkPage({ reset: true });
    });

    function getApiBaseUrl() {
        if (window.DDA_API_BASE) {
            return normalizeApiBase(window.DDA_API_BASE);
        }

        if (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) {
            return normalizeApiBase(window.APP_CONFIG.API_BASE_URL);
        }

        if (window.API_BASE_URL) {
            return normalizeApiBase(window.API_BASE_URL);
        }

        if (typeof API_BASE_URL !== 'undefined' && API_BASE_URL) {
            return normalizeApiBase(API_BASE_URL);
        }

        console.warn('API base URL is not configured. Falling back to /api.');
        return '/api';
    }

    function normalizeApiBase(value) {
        const clean = String(value || '').replace(/\/$/, '');

        if (!clean) return '/api';
        if (clean.endsWith('/api')) return clean;

        return `${clean}/api`;
    }

    function getBackendBaseUrl() {
        return getApiBaseUrl().replace(/\/api$/, '');
    }

    function getFrontendBaseUrl() {
        return window.location.origin;
    }

    // Resolves static assets (images, portfolio files).
    // Defaults to the page origin but can be overridden by setting
    // window.DDA_STATIC_BASE to the domain that actually hosts the files
    // (e.g. 'https://whitewidow.github.io' when the catalog is served
    // from a different domain like Railway).
    function getStaticBaseUrl() {
        if (window.DDA_STATIC_BASE) {
            return String(window.DDA_STATIC_BASE).replace(/\/$/, '');
        }
        return window.location.origin;
    }

    function hasImageExtension(path) {
        return /\.(png|jpe?g|webp|gif|avif|svg)$/i.test(path.split('?')[0]);
    }

    function joinUrl(base, path) {
        return `${base.replace(/\/$/, '')}/${String(path || '').replace(/^\/+/, '')}`;
    }

    function buildCatalogUrl() {
        const baseUrl = getApiBaseUrl();

        const category = document.getElementById('categoryFilter')?.value || 'all';
        const query = document.getElementById('shopSearchInput')?.value?.trim() || '';
        const sortValue = document.getElementById('sortSelect')?.value || 'id,desc';

        let endpoint;

        if (query) {
            endpoint = `${baseUrl}/artworks/search`;
        } else if (category && category !== 'all') {
            endpoint = `${baseUrl}/artworks/category/${encodeURIComponent(category)}`;
        } else {
            endpoint = `${baseUrl}/artworks`;
        }

        const params = new URLSearchParams({
            page: String(currentPage),
            size: String(PAGE_SIZE)
        });

        if (sortValue) {
            params.set('sort', sortValue);
        }

        if (query) {
            params.set('q', query);
        }

        return `${endpoint}?${params.toString()}`;
    }

    async function loadArtworkPage({ reset = false } = {}) {
        const grid = document.getElementById('productsGrid');
        const loader = document.getElementById('catalogLoader');
        const emptyState = document.getElementById('catalogEmptyState');

        if (!grid) return;
        if (isLoading) return;
        if (!hasMore && !reset) return;

        if (reset) {
            currentPage = 0;
            hasMore = true;
            grid.innerHTML = '';
            artworkByKey.clear();

            if (emptyState) emptyState.hidden = true;

            if (activeRequestController) {
                activeRequestController.abort();
            }
        }

        isLoading = true;
        activeRequestController = new AbortController();

        if (loader) loader.hidden = false;

        try {
            const url = buildCatalogUrl();
            console.log('Loading catalog URL:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                signal: activeRequestController.signal
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                console.error('Catalog API failed:', {
                    status: response.status,
                    url,
                    body: errorText
                });

                throw new Error(`Could not load artworks. Status: ${response.status}`);
            }

            const page = await response.json();
            const artworks = Array.isArray(page.content) ? page.content : [];

            if (reset && artworks.length === 0) {
                if (emptyState) emptyState.hidden = false;
                hasMore = false;
                updateSearchCount(page);
                return;
            }

            const cardsHtml = artworks
                .map(createArtworkCard)
                .join('');

            grid.insertAdjacentHTML('beforeend', cardsHtml);

            if (window.updatePageTranslations) {
                window.updatePageTranslations();
            }

            currentPage += 1;
            hasMore = page.last === false;

            updateSearchCount(page);
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Catalog load error:', error);
            }
        } finally {
            isLoading = false;

            if (loader) {
                loader.hidden = !hasMore;
            }
        }
    }

    function createArtworkCard(artwork) {
        const modalArtwork = normalizeArtworkForModal(artwork);

        const key = modalArtwork.id
            ? `id-${modalArtwork.id}`
            : modalArtwork.slug
                ? `slug-${modalArtwork.slug}`
                : `tmp-${Math.random().toString(36).slice(2)}`;

        artworkByKey.set(key, modalArtwork);

        const title = modalArtwork.title;
        const technique = modalArtwork.technique || '';
        const dimensions = modalArtwork.dimensions || '';
        const year = modalArtwork.year || '';
        const price = modalArtwork.price || 'Consultar';
        const sold = modalArtwork.sold === true;
        const imageUrl = modalArtwork.image;
        const wishlist = readWishlist();
        const wishlistId = getWishlistId(modalArtwork);
        const isWished = wishlist.includes(wishlistId);

        const yearHtml = year
            ? `<p class="product-year">${escapeHtml(year)}</p>`
            : '';

        const soldButtonHtml = `
            <button
                type="button"
                class="btn-grid-action btn-grid-sold"
                disabled
                aria-disabled="true"
            >
                ✕ <span data-i18n="card.sold">VENDIDO</span>
            </button>
        `;

        const buyButtonHtml = `
            <button
                type="button"
                class="btn-grid-action btn-grid-buy"
                data-action="buy"
            >
                <span class="btn-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                </span>
                <span data-i18n="card.buy">COMPRAR</span>
            </button>
        `;

        return `
            <article
                class="product-card${sold ? ' sold' : ''}"
                data-artwork-key="${escapeAttribute(key)}"
                data-category="${escapeAttribute(modalArtwork.category || '')}"
                data-dimensions="${escapeAttribute(dimensions)}"
                data-technique="${escapeAttribute(technique)}"
                data-year="${escapeAttribute(year)}"
                data-price="${escapeAttribute(price)}"
            >
                <div class="product-image loading">
                    <div class="skeleton-shimmer"></div>

                    <button
                        type="button"
                        class="btn-wishlist${isWished ? ' active' : ''}"
                        aria-label="Agregar a favoritos"
                        data-action="wishlist"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>

                    <img
                        src="${escapeAttribute(imageUrl)}"
                        alt="${escapeAttribute(title)}"
                        loading="lazy"
                        decoding="async"
                        onload="this.closest('.product-image')?.classList.remove('loading')"
                    >

                    <div class="masonry-overlay">
                        <div class="overlay-content">
                            <h3 class="overlay-title">${escapeHtml(title)}</h3>
                            <p class="overlay-details">
                                ${dimensions ? `${escapeHtml(dimensions)}<br>` : ''}
                                ${technique ? `${escapeHtml(technique)}<br>` : ''}
                                ${year ? escapeHtml(year) : ''}
                            </p>
                        </div>
                    </div>
                </div>

                <div class="product-info">
                    <h3 class="product-title">${escapeHtml(title)}</h3>

                    ${yearHtml}

                    <p class="product-price catalog-card-price">${escapeHtml(price)}</p>

                    <div class="product-actions-grid">
                        <button
                            type="button"
                            class="btn-grid-action btn-grid-details"
                            data-action="details"
                        >
                            <span class="btn-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" class="icon-eye" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            </span>
                            <span data-i18n="card.details">DETALLES</span>
                        </button>

                        ${sold ? soldButtonHtml : buyButtonHtml}
                    </div>
                </div>
            </article>
        `;
    }

    function bindCatalogGridEvents() {
        const grid = document.getElementById('productsGrid');

        if (!grid || gridEventsBound) return;

        gridEventsBound = true;

        grid.addEventListener('click', event => {
            const card = event.target.closest('.product-card');
            if (!card) return;

            const artwork = artworkByKey.get(card.dataset.artworkKey);
            if (!artwork) return;

            const wishlistBtn = event.target.closest('[data-action="wishlist"]');
            if (wishlistBtn) {
                event.preventDefault();
                event.stopPropagation();

                const id = getWishlistId(artwork);
                let wishlist = readWishlist();
                let wishlistItems = readWishlistItems();
                const index = wishlist.indexOf(id);

                if (index === -1) {
                    wishlist.push(id);
                    wishlistItems[id] = getFavoriteSnapshot(artwork);
                    wishlistBtn.classList.add('active');
                } else {
                    wishlist.splice(index, 1);
                    delete wishlistItems[id];
                    wishlistBtn.classList.remove('active');
                }

                saveWishlist(wishlist);
                saveWishlistItems(wishlistItems);
                return;
            }

            const detailsBtn = event.target.closest('[data-action="details"]');
            if (detailsBtn) {
                event.preventDefault();
                event.stopPropagation();

                if (typeof openModal === 'function') {
                    openModal(artwork);
                } else {
                    console.error('openModal is not available. Check that shop.js loads before catalog-api.js.');
                }

                return;
            }

            const buyBtn = event.target.closest('[data-action="buy"]');
            if (buyBtn) {
                event.preventDefault();
                event.stopPropagation();

                if (typeof openInquiry === 'function') {
                    openInquiry(artwork.title, artwork.price);
                }

                return;
            }

            const imageArea = event.target.closest('.product-image');
            if (imageArea) {
                event.preventDefault();
                event.stopPropagation();

                if (typeof openLightBox === 'function') {
                    openLightBox(artwork.image);
                }

                return;
            }

            if (typeof openModal === 'function') {
                openModal(artwork);
            }
        });
    }

    function getPrimaryImageUrl(artwork) {
        const images = Array.isArray(artwork.images) ? artwork.images : [];

        const primaryImage =
            images.find(img => img && img.isPrimary === true) ||
            images.find(img => img && img.primary === true) ||
            images[0];

        const primaryUrl = normalizeImageUrl(primaryImage);
        if (primaryUrl) return primaryUrl;

        const rawPath =
            artwork.imageUrl ||
            artwork.image ||
            '';

        if (!rawPath) {
            return '../placeholder-artwork.jpg';
        }

        return normalizeImageUrl(rawPath) || '../placeholder-artwork.jpg';
    }

    function normalizeArtworkForModal(artwork) {
        const imageUrl = getPrimaryImageUrl(artwork);

        const images = Array.isArray(artwork.images)
            ? artwork.images
                .map(image => normalizeImageUrl(image))
                .filter(Boolean)
            : [];

        return {
            id: artwork.id,
            slug: artwork.slug,
            title: artwork.title || 'Obra sin título',
            description: artwork.description || '',
            image: imageUrl,
            images: images.length ? images : [imageUrl],
            price: artwork.price || 'Consultar',
            dimensions: artwork.dimensions || '',
            technique: artwork.technique || '',
            year: artwork.year || '',
            category: getCategoryValue(artwork),
            sold: artwork.sold === true
        };
    }

    function normalizeImageUrl(image) {
        if (!image) return '';

        const rawPath = typeof image === 'string'
            ? image
            : (
                image.filePath ||
                image.url ||
                image.imageUrl ||
                ''
            );

        if (!rawPath) return '';

        const path = String(rawPath).trim();
        if (!path) return '';

        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }

        // Images uploaded through the Spring/Railway backend.
        // Example: /uploads/uuid.jpg or uploads/uuid.jpg
        if (
            path.startsWith('/uploads/') ||
            path.startsWith('uploads/') ||
            path.startsWith('/upload/') ||
            path.startsWith('upload/')
        ) {
            return joinUrl(getBackendBaseUrl(), path);
        }

        // Static portfolio/shop assets live with the frontend on GitHub Pages.
        // Example: /portfolio/sections/obras/dibu9.jpg
        if (
            path.startsWith('/portfolio/') ||
            path.startsWith('portfolio/') ||
            path.startsWith('../portfolio/') ||
            path.startsWith('/shop/') ||
            path.startsWith('shop/') ||
            path.startsWith('../shop/')
        ) {
            return new URL(path, getStaticBaseUrl() + '/shop/catalog.html').href;
        }

        // Root-relative static files should also resolve to the frontend domain,
        // not to Railway. This avoids 403s for GitHub Pages-hosted assets.
        if (path.startsWith('/')) {
            return joinUrl(getStaticBaseUrl(), path);
        }

        // If the API only returns a filename, most of your legacy artwork files
        // are stored in /portfolio/sections/obras on the frontend.
        if (!path.includes('/') && hasImageExtension(path)) {
            return joinUrl(getStaticBaseUrl(), `/portfolio/sections/obras/${path}`);
        }

        // Final fallback: resolve relative to catalog.html on the frontend.
        return new URL(path, getStaticBaseUrl() + '/shop/catalog.html').href;
    }

    function getCategoryValue(artwork) {
        if (!artwork.category) return '';

        if (typeof artwork.category === 'string') {
            return artwork.category;
        }

        return artwork.category.name || '';
    }

    function initCatalogEvents() {
        const searchInput = document.getElementById('shopSearchInput');
        const searchClear = document.getElementById('shopSearchClear');
        const categoryFilter = document.getElementById('categoryFilter');
        const sortSelect = document.getElementById('sortSelect');

        searchInput?.addEventListener('input', debounce(() => {
            loadArtworkPage({ reset: true });
        }, 350));

        searchClear?.addEventListener('click', () => {
            if (!searchInput) return;

            searchInput.value = '';
            searchClear.classList.remove('visible');

            loadArtworkPage({ reset: true });
        });

        searchInput?.addEventListener('input', () => {
            if (!searchClear) return;
            searchClear.classList.toggle('visible', searchInput.value.trim().length > 0);
        });

        categoryFilter?.addEventListener('change', () => {
            loadArtworkPage({ reset: true });
        });

        sortSelect?.addEventListener('change', () => {
            loadArtworkPage({ reset: true });
        });
    }

    function setupInfiniteScroll() {
        const sentinel = document.getElementById('catalogSentinel');

        if (!sentinel) return;

        if (observer) {
            observer.disconnect();
        }

        observer = new IntersectionObserver(entries => {
            const firstEntry = entries[0];

            if (firstEntry.isIntersecting) {
                loadArtworkPage();
            }
        }, {
            root: null,
            rootMargin: '700px',
            threshold: 0
        });

        observer.observe(sentinel);
    }

    function updateSearchCount(page) {
        const countEl = document.getElementById('shopSearchCount');

        if (!countEl || !page) return;

        const total = typeof page.totalElements === 'number'
            ? page.totalElements
            : null;

        if (total === null) {
            countEl.textContent = '';
            return;
        }

        countEl.textContent = total === 1
            ? '1 obra encontrada'
            : `${total} obras encontradas`;
    }

    function hydrateSearchFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const query = params.get('q');
        const searchInput = document.getElementById('shopSearchInput');
        const searchClear = document.getElementById('shopSearchClear');

        if (!query || !searchInput) return;

        searchInput.value = query;
        searchClear?.classList.add('visible');
    }

    function initCatalogDropdowns() {
        setupDropdown({
            dropdownId: 'categoryDropdown',
            selectId: 'categoryFilter'
        });

        setupDropdown({
            dropdownId: 'sizeDropdown',
            selectId: 'sizeFilter',
            onChange: () => {
                console.warn('Size filter is not connected to the backend yet.');
            }
        });
    }

    function setupDropdown({ dropdownId, selectId, onChange }) {
        const dropdown = document.getElementById(dropdownId);
        const select = document.getElementById(selectId);

        if (!dropdown || !select || dropdown.dataset.catalogDropdownReady === 'true') return;
        dropdown.dataset.catalogDropdownReady = 'true';

        const trigger = dropdown.querySelector('.cd-trigger');
        const label = dropdown.querySelector('.cd-label');
        const options = Array.from(dropdown.querySelectorAll('.cd-option'));

        trigger?.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();

            closeOtherDropdowns(dropdown);
            dropdown.classList.toggle('open');
        });

        options.forEach(option => {
            option.addEventListener('click', event => {
                event.preventDefault();

                const value = option.dataset.value;
                const text = option.childNodes[0]?.textContent?.trim() || option.textContent.trim();

                select.value = value;

                if (label) {
                    label.textContent = text;
                }

                options.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');

                dropdown.classList.remove('open');

                select.dispatchEvent(new Event('change', { bubbles: true }));

                dropdown.closest('.sidebar-section')?.classList.toggle('is-active', value !== 'all');

                if (typeof onChange === 'function') {
                    onChange(value);
                }
            });
        });

        document.addEventListener('click', () => {
            dropdown.classList.remove('open');
        });
    }

    function closeOtherDropdowns(currentDropdown) {
        document.querySelectorAll('.custom-dropdown.open').forEach(dropdown => {
            if (dropdown !== currentDropdown) {
                dropdown.classList.remove('open');
            }
        });
    }

    function debounce(fn, delay) {
        let timeoutId;

        return function (...args) {
            clearTimeout(timeoutId);

            timeoutId = setTimeout(() => {
                fn.apply(this, args);
            }, delay);
        };
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function escapeAttribute(value) {
        return escapeHtml(value);
    }
})();
