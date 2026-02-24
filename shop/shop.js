// Filter functionality
// Products are loaded from products.js into window.products

// Language Configuration (Shop Specific)
window.pageTranslations = {
    es: {
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
        'catalog.download': 'Descargar Catálogo (PDF)'
    },
    en: {
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
        'catalog.download': 'Download Catalog (PDF)'
    }
};

document.addEventListener('DOMContentLoaded', function () {
    // Re-apply translations on load to catch page-specific ones
    const savedLang = localStorage.getItem('preferredLanguage') || 'es';
    if (window.changeLanguage) {
        window.changeLanguage(savedLang);
    }

    const gridParams = document.getElementById('productsGrid');
    if (gridParams) {
        renderGrid(window.products || []);
    }

    // Filter Logic
    const categoryFilter = document.getElementById('categoryFilter');
    const priceFilter = document.getElementById('priceFilter');

    function applyFilters() {
        const selectedCategory = categoryFilter ? categoryFilter.value : 'all';
        const selectedPriceRange = priceFilter ? priceFilter.value : 'all';

        const productCards = document.querySelectorAll('.product-card');

        productCards.forEach(card => {
            const category = card.getAttribute('data-category');
            const priceText = card.querySelector('.product-price').innerText;

            // Parse price: remove non-numeric chars except period if present, handle USD
            // Assuming format like "$2500 USD" or "$250"
            const priceValue = parseFloat(priceText.replace(/[^0-9.]/g, ''));

            let categoryMatch = (selectedCategory === 'all' || category === selectedCategory);
            let priceMatch = true;

            if (selectedPriceRange !== 'all' && !isNaN(priceValue)) {
                if (selectedPriceRange === 'under_1000') {
                    priceMatch = priceValue < 1000;
                } else if (selectedPriceRange === '1000_3000') {
                    priceMatch = priceValue >= 1000 && priceValue <= 3000;
                } else if (selectedPriceRange === 'over_3000') {
                    priceMatch = priceValue > 3000;
                }
            }

            if (categoryMatch && priceMatch) {
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

    if (priceFilter) {
        priceFilter.addEventListener('change', applyFilters);
    }

    // Modal Injection Logic (as raw string to avoid CORS on file:/// protocol)
    const modalHTML = `
        <!-- Modal for Info View -->
        <div id="imageModal" class="image-modal">
            <span class="modal-close">&times;</span>
            <div class="modal-container">
                <div class="modal-image-wrapper">
                    <img class="modal-image" id="modalImage" alt="Artwork">
                </div>
                <div class="modal-info-wrapper">
                    <h2 id="modalTitle" class="modal-title"></h2>
                    <p id="modalTechnique" class="modal-technique"></p>
                    <p id="modalDimensions" class="modal-dimensions"></p>
                    <p id="modalPrice" class="modal-price"></p>
                    <button id="modalBuyBtn" class="btn-modal-buy" data-i18n="modal.consult">CONSULTAR / COMPRAR</button>
                </div>
            </div>
        </div>

        <!-- Modal for pure Image Zoom -->
        <div id="lightBoxModal" class="lightbox-modal">
            <span class="lightbox-close">&times;</span>
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
            this.classList.toggle('zoomed');

            if (this.classList.contains('zoomed')) {
                // Calculate click position relative to the image
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                // Convert to percentages
                const xPercent = (x / rect.width) * 100;
                const yPercent = (y / rect.height) * 100;

                this.style.transformOrigin = `${xPercent}% ${yPercent}%`;
            } else {
                this.style.transformOrigin = 'center center';
            }
        });

        // Optional: dynamic cursor hinting
        lightBoxImg.addEventListener('mousemove', function (e) {
            if (!this.classList.contains('zoomed')) {
                this.style.cursor = 'zoom-in';
            } else {
                this.style.cursor = 'zoom-out';
            }
        });
    }

    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                closeModal();
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

    // Carousel Logic for multiple carousels
    const carouselContainers = document.querySelectorAll('.carousel-container-mini');
    carouselContainers.forEach(container => {
        const track = container.querySelector('.carousel-track');
        const prevBtn = container.querySelector('.prev-btn');
        const nextBtn = container.querySelector('.next-btn');

        if (track) {
            if (prevBtn) prevBtn.addEventListener('click', () => { track.scrollBy({ left: -170, behavior: 'smooth' }); });
            if (nextBtn) nextBtn.addEventListener('click', () => { track.scrollBy({ left: 170, behavior: 'smooth' }); });
        }
    });

    // (Removed duplicate itemParam check here, it runs immediately after modal injection above)
});

function renderGrid(items) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    grid.innerHTML = ''; // Clear existing

    items.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.setAttribute('data-category', product.category);
        if (product.sold) card.classList.add('sold');

        card.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.title}">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <p class="product-price">${product.price}</p>
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
                    <button class="btn-grid-action btn-grid-buy" data-i18n="card.buy">🛒 COMPRAR</button>
                </div>
            </div>
        `;

        // Attach click to card
        card.onclick = (e) => {
            // Check if button clicked
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;

            // Fast check: if they actually clicked the image directly, open lightbox instead of info modal
            if (e.target.tagName === 'IMG' && e.target.closest('.product-image')) {
                openLightBox(product.image);
                return;
            }

            openModal(product);
        };

        // Button actions
        const btnDetails = card.querySelector('.btn-grid-details');
        const btnBuy = card.querySelector('.btn-grid-buy');

        btnDetails.onclick = (e) => {
            e.stopPropagation();
            openModal(product);
        };

        btnBuy.onclick = (e) => {
            e.stopPropagation();
            buyProduct(product);
        };

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

        product = {
            image: img ? img.src : '',
            title: title ? title.innerText : '',
            price: price ? price.innerText : '',
            dimensions: el.dataset.dimensions || '',
            technique: el.dataset.technique || '',
            // If needed, we can parse category too
            category: el.dataset.category || ''
        };
    }

    const modalImg = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalPrice = document.getElementById('modalPrice');
    const modalDimensions = document.getElementById('modalDimensions');
    const modalTechnique = document.getElementById('modalTechnique');
    const modalBuyBtn = document.getElementById('modalBuyBtn');

    if (modalImg) {
        modalImg.src = product.image;
        modalImg.alt = product.title;
    }
    if (modalTitle) modalTitle.textContent = product.title;
    if (modalPrice) modalPrice.textContent = product.price;

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

    if (modalTechnique) modalTechnique.textContent = product.technique;

    if (modalBuyBtn) {
        modalBuyBtn.textContent = translations['modal.consult'] || 'CONSULTAR / COMPRAR';
        modalBuyBtn.onclick = (e) => {
            e.preventDefault();
            buyProduct(product);
        };
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function buyProduct(product) {
    const waNumber = '5491168750007';
    const message = `Hola, me interesa comprar: ${product.title}`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function openLightBox(imageSrc) {
    const lightBox = document.getElementById('lightBoxModal');
    const lightBoxImg = document.getElementById('lightBoxImage');

    if (lightBox && lightBoxImg) {
        // Extract src regardless of parameter type
        let src = typeof imageSrc === 'string' ? imageSrc : (imageSrc.src || '');

        lightBoxImg.src = src;
        lightBoxImg.classList.remove('zoomed');
        lightBoxImg.style.transformOrigin = 'center center';

        lightBox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeLightBox() {
    const lightBox = document.getElementById('lightBoxModal');
    const lightBoxImg = document.getElementById('lightBoxImage');

    if (lightBox) {
        lightBox.classList.remove('active');
        document.body.style.overflow = '';
    }
    if (lightBoxImg) {
        lightBoxImg.classList.remove('zoomed');
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
