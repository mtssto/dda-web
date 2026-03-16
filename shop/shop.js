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

    function applyFilters() {
        const selectedCategory = categoryFilter ? categoryFilter.value : 'all';
        const productCards = document.querySelectorAll('.product-card');

        productCards.forEach(card => {
            const category = card.getAttribute('data-category');
            let categoryMatch = (selectedCategory === 'all' || category === selectedCategory);

            if (categoryMatch) {
                card.style.display = '';
                card.style.animation = 'none';
                setTimeout(() => {
                    card.style.animation = 'fadeIn 0.5s ease-in-out';
                }, 10);
            } else {
                card.style.display = 'none';
            }
        });
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }

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
                    <h2 id="modalTitle" class="modal-title"></h2>
                    <p id="modalDescription" class="modal-description" style="font-size: 0.9rem; color: #444; line-height: 1.7; margin: 10px 0 16px; font-style: italic;"></p>
                    <p id="modalTechnique" class="modal-technique"></p>
                    <p id="modalDimensions" class="modal-dimensions"></p>
                    <p id="modalYear" class="modal-year" style="color: #666; font-size: 0.9rem; margin-top: 5px;"></p>
                    <p id="modalPrice" class="modal-price"></p>
                    <button id="modalBuyBtn" class="btn-modal-buy" data-i18n="modal.consult">CONSULTAR / COMPRAR</button>
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

    // Check for "item" query param to auto-open modal (now that modal exists)
    const urlParams = new URLSearchParams(window.location.search);
    const itemParam = urlParams.get('item');

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
            modalDescription.textContent = product.description;
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
                const waNumber = '5491168750007';
                const message = `Hola, me interesa comprar: ${product.title}`;
                window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
            };
        }
    }

    modal.classList.add('active');
    document.body.classList.add('no-scroll');
    document.documentElement.classList.add('no-scroll');
}

function buyProduct(product) {
    if (typeof openInquiry === 'function') {
        openInquiry(product.title, product.price);
    } else {
        const waNumber = '5491168750007';
        const message = `Hola, me interesa comprar: ${product.title}`;
        window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
    }
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.classList.remove('no-scroll');
        document.documentElement.classList.remove('no-scroll');
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
        document.body.classList.remove('no-scroll');
        document.documentElement.classList.remove('no-scroll');
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
                doc.text("Catálogo - Diego de Aduriz", 14, 20);

                // Subtitle
                doc.setFont("helvetica", "normal");
                doc.setFontSize(12);
                doc.setTextColor(100);
                const date = new Date().toLocaleDateString('es-AR');
                doc.text(`Generado el ${date}`, 14, 28);

                doc.setTextColor(0);

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
                    const price = card.querySelector('.product-price').innerText;
                    const imgSrc = card.querySelector('img').src;

                    // Find product data from global array to get dimensions/technique
                    const productData = (window.products || []).find(p => imgSrc.includes(p.image.split('/').pop()));

                    // Add Image using Promise to ensure base64 generation doesn't block or taint
                    try {
                        let base64Data;
                        const domImg = card.querySelector('img');
                        if (!domImg || !domImg.src) throw new Error('No image source');

                        // Attempt 1: Fetch as Blob and convert to Base64 (best quality, works locally if server is running without CORS headers)
                        try {
                            const response = await fetch(domImg.src);
                            const blob = await response.blob();
                            base64Data = await new Promise((resolve, reject) => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result);
                                reader.onerror = reject;
                                reader.readAsDataURL(blob);
                            });
                        } catch (fetchErr) {
                            // Attempt 2: Fallback to Canvas (works on some file:/// setups without CrossOrigin requirements)
                            base64Data = await new Promise((resolve, reject) => {
                                const img = new Image();
                                img.onload = () => {
                                    const canvas = document.createElement('canvas');
                                    canvas.width = img.width || 800;
                                    canvas.height = img.height || 800;
                                    const ctx = canvas.getContext('2d');
                                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                    try {
                                        resolve(canvas.toDataURL('image/jpeg', 0.8));
                                    } catch (e) {
                                        reject(e); // Catch canvas tainting DOMException
                                    }
                                };
                                img.onerror = () => reject('Image load error');
                                img.src = domImg.src;
                            });
                        }

                        // Calculate aspect ratio to fit within massive A4 bounds (margins 20mm)
                        const margin = 20;
                        const maxImgWidth = 170; // 210 - 40
                        const maxImgHeight = 160; // Leave room below for title and description

                        let imgWidth = domImg.naturalWidth || domImg.width || 800;
                        let imgHeight = domImg.naturalHeight || domImg.height || 800;

                        let renderWidth = maxImgWidth;
                        let renderHeight = maxImgHeight;

                        if (imgWidth / imgHeight > maxImgWidth / maxImgHeight) {
                            renderHeight = (imgHeight / imgWidth) * maxImgWidth;
                        } else {
                            renderWidth = (imgWidth / imgHeight) * maxImgHeight;
                        }

                        // Center the image horizontally
                        const xOffset = margin + (maxImgWidth - renderWidth) / 2;
                        const imgY = yPos;

                        doc.addImage(base64Data, 'JPEG', xOffset, imgY, renderWidth, renderHeight);

                        // Move cursor down below image
                        yPos += renderHeight + 15;

                    } catch (imgErr) {
                        console.warn('Could not add image to PDF', imgErr);
                        const margin = 20;
                        doc.setDrawColor(200);
                        doc.rect(margin, yPos, 170, 100);
                        doc.setFontSize(12);
                        doc.text("Sin imagen", 105, yPos + 50, { align: "center" });
                        yPos += 115;
                    }

                    // Add Text Info Below Image
                    const margin = 20;
                    doc.setFontSize(16);
                    doc.setFont("helvetica", "bold");
                    doc.text(title, margin, yPos);
                    yPos += 8;

                    doc.setFontSize(12);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(80);
                    if (productData) {
                        doc.text(`Técnica: ${productData.technique}`, margin, yPos);
                        yPos += 7;
                        doc.text(`Dimensiones: ${productData.dimensions}`, margin, yPos);
                        yPos += 7;

                        let yearText = productData.year || '';
                        let yearPrint = '';
                        if (yearText && yearText !== "Consultar año") {
                            yearPrint = yearText;
                        } else if (yearText === "Consultar año") {
                            yearPrint = `Consultar año`;
                        }
                        if (yearPrint) {
                            doc.text(yearPrint, margin, yPos);
                            yPos += 7;
                        }
                    }

                    doc.setFontSize(14);
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(0);
                    doc.text(`Precio: ${price}`, margin, yPos + 2);

                    // Ensure next item gets a new page if this was a large image
                    yPos += 200; // Force page break on next loop
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