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
        'catalog.title': 'Catálogo'
    },
    en: {
        'hero.subtitle': 'Original Artworks & Limited Editions',
        'hero.featured': 'Featured',
        'filter.all': 'All',
        'filter.pasteles': 'Pastels',
        'filter.digital': 'Digital Art',
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
        'catalog.title': 'Catalog'
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

    // Modal close functionality
    const modal = document.getElementById('imageModal');
    const modalClose = document.querySelector('.modal-close');

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            closeModal();
        }
    });

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

    // Check for "item" query param to auto-open modal
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
                    <button class="btn-grid-action btn-grid-details" data-i18n="card.details">DETALLES</button>
                    <button class="btn-grid-action btn-grid-buy" data-i18n="card.buy">COMPRAR</button>
                </div>
            </div>
        `;

        // Attach click to card
        card.onclick = (e) => {
            // Check if button clicked
            if (e.target.tagName === 'BUTTON') return;
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
