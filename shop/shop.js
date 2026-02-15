// Filter functionality
document.addEventListener('DOMContentLoaded', function () {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const modalClose = document.querySelector('.modal-close');

    // Filter products
    filterButtons.forEach(button => {
        button.addEventListener('click', function () {
            const filter = this.getAttribute('data-filter');

            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Filter products with animation
            productCards.forEach(card => {
                const category = card.getAttribute('data-category');

                if (filter === 'all' || category === filter) {
                    card.style.display = '';
                    // Add fade-in animation
                    card.style.animation = 'none';
                    setTimeout(() => {
                        card.style.animation = 'fadeIn 0.5s ease-in-out';
                    }, 10);
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // Modal close functionality
    if (modalClose) {
        modalClose.addEventListener('click', function () {
            closeModal();
        });
    }

    // Close modal when clicking outside the image
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // Close modal with escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    function closeModal() {
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling
        }
    }

    // Smooth scroll for any internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    // Carousel Logic
    const carouselTrack = document.querySelector('.carousel-track');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    if (carouselTrack) {
        // Button Listeners
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                carouselTrack.scrollBy({ left: -170, behavior: 'smooth' }); // Adjusted for mini card width
                resetAutoPlay();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                carouselTrack.scrollBy({ left: 170, behavior: 'smooth' });
                resetAutoPlay();
            });
        }

        // Auto-play Logic
        let autoPlayInterval;

        function startAutoPlay() {
            clearInterval(autoPlayInterval); // Clear existing interval if any
            autoPlayInterval = setInterval(() => {
                const maxScrollLeft = carouselTrack.scrollWidth - carouselTrack.clientWidth;
                if (carouselTrack.scrollLeft >= maxScrollLeft - 5) { // Threshold
                    carouselTrack.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    carouselTrack.scrollBy({ left: 170, behavior: 'smooth' });
                }
            }, 3000);
        }

        function resetAutoPlay() {
            clearInterval(autoPlayInterval);
            startAutoPlay();
        }

        // Start initially
        startAutoPlay();

        // Pause on hover
        carouselTrack.addEventListener('mouseenter', () => clearInterval(autoPlayInterval));
        carouselTrack.addEventListener('mouseleave', startAutoPlay);
    }

});

// Open modal function (called from HTML onclick)
// Open modal function
function openModal(element) {
    // If element is a button, use its closest card (but prevent double trigger if we handle click on button separately)
    // Actually, onclick is on the card. Buttons inside will bubble up.
    // Let's check event target if needed, but for now standard bubbling is fine.

    // Determine card
    const card = element.closest('.product-card') || element;

    const img = card.querySelector('.product-image img');
    const title = card.querySelector('.product-title').textContent;
    const price = card.querySelector('.product-price').textContent;
    const dimensions = card.getAttribute('data-dimensions') || 'Consultar medidas';
    const technique = card.getAttribute('data-technique') || 'Técnica mixta';

    // Modal Elements
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalPrice = document.getElementById('modalPrice');
    const modalDimensions = document.getElementById('modalDimensions');
    const modalTechnique = document.getElementById('modalTechnique');
    const modalBuyBtn = document.getElementById('modalBuyBtn');

    if (modal && modalImg) {
        modalImg.src = img.src;
        modalImg.alt = img.alt;

        if (modalTitle) modalTitle.textContent = title;
        if (modalPrice) modalPrice.textContent = price;
        if (modalDimensions) modalDimensions.textContent = `Dimensiones: ${dimensions}`;
        if (modalTechnique) modalTechnique.textContent = technique;

        // Buy Button Logic
        if (modalBuyBtn) {
            updateBuyButton(modalBuyBtn, card, title);
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function updateBuyButton(btn, card, title) {
    if (card.classList.contains('sold')) {
        btn.textContent = 'VENDIDO';
        btn.href = '#';
        btn.style.pointerEvents = 'none';
        btn.style.opacity = '0.5';
        btn.style.background = '#ccc';
        btn.style.borderColor = '#ccc';
    } else {
        btn.textContent = 'CONSULTAR / COMPRAR';
        btn.style.pointerEvents = 'auto';
        btn.style.opacity = '1';
        btn.style.background = '#000';
        btn.style.borderColor = '#000';

        const waNumber = '5491168750007';
        const message = `Hola, me interesa la obra: ${title}`;
        btn.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
    }
}


// Event listeners for grid buttons to prevent bubbling if we want distinct actions?
// But user said "add a button... in details you see height".
// If I click "Detalles", it just opens the modal (same as clicking card).
// If I click "Comprar", it could go straight to WhatsApp?
// Let's implement that specific logic.

document.addEventListener('DOMContentLoaded', () => {
    // Delegation for grid buttons
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-grid-details')) {
            e.stopPropagation(); // Prevent card click
            openModal(e.target.closest('.product-card'));
        }
        if (e.target.classList.contains('btn-grid-buy')) {
            e.stopPropagation();
            const card = e.target.closest('.product-card');
            const title = card.querySelector('.product-title').textContent;
            const waNumber = '5491168750007';
            const message = `Hola, me interesa comprar: ${title}`;
            window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
        }
    });
});
