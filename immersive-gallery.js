// Carousel Logic for Index Page
let artImages = [];

function loadCarouselImages() {
    artImages = [];
    if (window.products) {
        const isMobile = window.innerWidth <= 768;

        // Define desired filenames for each view
        const desktopFilenames = [
            "Diego+de+Aduriz+-+Mi+cuerpo+electrico+29+160+x+200+-+Pastel+y+acrilico+sobre+tela+-+2021",
            "luz_azul",
            "Diego+de+Aduriz+-+Autorretrato+-+110+x+150+cm+-+Marcadores+sobre+papel+-+2007",
            "Diego+de+Aduriz+-+Paisaje+teorico+-+Tecnica+mixta+sobre+papel+-+24+x+34+cm+-+2009",
            "Diego+de+Aduriz+-+Piasaje+con+monstruo+amistoso+-+Lapiz+sobre+papel+-+24+x+34+cm+-+2011"
        ];

        const mobileFilenames = [
            "puerta-1-espiritu(humite)-tecnica-pastel-sobre-puerta-tecnoca-mixta-sobre-madera",
            "payaso",
            "MG_0312_1",
            "mascara1",
            "mascara2"
        ];

        const activeFilenames = isMobile ? mobileFilenames : desktopFilenames;

        artImages = window.products
            .filter(p => {
                if (!p.image) return false;
                // Check if any of the active filenames are in the product's image path
                return activeFilenames.some(filename => p.image.includes(filename));
            })
            .map(p => {
                return {
                    ...p,
                    displayImage: p.image.startsWith('/') ? '.' + p.image : (p.image.startsWith('../') ? p.image.substring(3) : p.image)
                };
            });
    }

    // Fallback
    if (artImages.length === 0) {
        artImages = [
            { displayImage: './portfolio/sections/obras/MG_0307.jpg', title: 'Fallback 1' },
            { displayImage: './portfolio/sections/obras/IMG_0402+copia.jpg', title: 'Fallback 2' }
        ];
    }
}

// Initial load
loadCarouselImages();

const canvas = document.getElementById('art-canvas');
let currentIndex = 0;
let autoSlideInterval;

function initCarousel() {
    if (!canvas || artImages.length === 0) return;

    // Setup Canvas for Carousel
    canvas.innerHTML = '';
    canvas.className = 'carousel-container';

    const track = document.createElement('div');
    track.className = 'carousel-track';

    // Add images to track
    artImages.forEach((art, idx) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';

        const img = document.createElement('img');
        img.src = art.displayImage;
        img.alt = art.title || 'Artwork';
        img.className = 'carousel-image';

        // Click to open modal
        img.onclick = () => openModal(art);

        slide.appendChild(img);
        track.appendChild(slide);
    });

    canvas.appendChild(track);

    // Add Navigation Arrows
    const prevBtn = document.createElement('button');
    prevBtn.className = 'carousel-btn prev-btn';
    prevBtn.innerHTML = '&#10094;';
    prevBtn.onclick = () => moveSlide(-1);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'carousel-btn next-btn';
    nextBtn.innerHTML = '&#10095;';
    nextBtn.onclick = () => moveSlide(1);

    canvas.appendChild(prevBtn);
    canvas.appendChild(nextBtn);

    updateCarousel();
    startAutoSlide();

    // Pause on hover
    canvas.addEventListener('mouseenter', stopAutoSlide);
    canvas.addEventListener('mouseleave', startAutoSlide);

    // Setup Touch/Drag Support
    let startX = 0;
    let isDragging = false;
    let currentTranslate = 0;
    let prevTranslate = 0;

    track.addEventListener('mousedown', dragStart);
    track.addEventListener('mouseup', dragEnd);
    track.addEventListener('mouseleave', dragEnd);
    track.addEventListener('mousemove', drag);

    track.addEventListener('touchstart', dragStart, { passive: true });
    track.addEventListener('touchend', dragEnd);
    track.addEventListener('touchmove', drag, { passive: true });

    function dragStart(e) {
        if (e.type === 'touchstart') {
            startX = e.touches[0].clientX;
        } else {
            e.preventDefault();
            startX = e.clientX;
        }
        isDragging = true;
        stopAutoSlide();
        track.style.transition = 'none';
    }

    function drag(e) {
        if (!isDragging) return;
        const currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const diffX = currentX - startX;

        // Calculate raw translation
        const slideWidth = track.children[0].offsetWidth;
        const baseTranslate = -(currentIndex * slideWidth);
        track.style.transform = `translateX(${baseTranslate + diffX}px)`;
    }

    function dragEnd(e) {
        if (!isDragging) return;
        isDragging = false;

        const currentX = e.type === 'touchend' ? e.changedTouches[0].clientX : e.clientX;
        const diffX = currentX - startX;

        track.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

        if (Math.abs(diffX) > 50) { // Threshold for swipe
            if (diffX > 0) moveSlide(-1);
            else moveSlide(1);
        } else {
            updateCarousel(); // Snap back
        }

        startAutoSlide();
    }
}

function moveSlide(direction) {
    currentIndex += direction;
    const track = document.querySelector('.carousel-track');

    // Smooth Loop
    if (currentIndex < 0) {
        currentIndex = artImages.length - 1;
        if (track) track.style.transition = 'none'; // Instant jump
    } else if (currentIndex >= artImages.length) {
        currentIndex = 0;
        if (track) track.style.transition = 'none'; // Instant jump to start
    } else {
        if (track) track.style.transition = 'transform 1.2s cubic-bezier(0.25, 1, 0.5, 1)'; // Slow ease
    }

    // Need a tiny timeout to apply the transition change if it was 'none'
    setTimeout(updateCarousel, 50);
}

function updateCarousel() {
    const track = document.querySelector('.carousel-track');
    if (!track) return;

    // Get width of one slide
    const slide = track.children[0];
    if (!slide) return;

    const slideWidth = slide.offsetWidth;
    track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;

    // Restore transition if it was removed for looping
    setTimeout(() => {
        track.style.transition = 'transform 1.2s cubic-bezier(0.25, 1, 0.5, 1)';
    }, 50);
}

function startAutoSlide() {
    stopAutoSlide();
    autoSlideInterval = setInterval(() => {
        moveSlide(1);
    }, 2800); // Fast, continuous feeling (2.8 seconds per slide)
}

function stopAutoSlide() {
    clearInterval(autoSlideInterval);
}

// Initial Setup
initCarousel();

// Handle Resize
let resizeTimeout;
let wasMobile = window.innerWidth <= 768;

window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const isMobileNow = window.innerWidth <= 768;

        // If we crossed the breakpoint, reload images and re-init
        if (wasMobile !== isMobileNow) {
            wasMobile = isMobileNow;
            loadCarouselImages();
            currentIndex = 0; // Reset
            initCarousel();
            return;
        }

        // Just fix styles if breakpoint didn't change
        const track = document.querySelector('.carousel-track');
        if (track) track.style.transition = 'none';
        updateCarousel();
        setTimeout(() => { if (track) track.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'; }, 50);
    }, 300);
});

// --- Modal Logic (Ported from Shop) ---
function openModal(product) {
    stopAutoSlide(); // Pause carousel while modal is open
    const modal = document.getElementById('imageModal');
    if (!modal) return;

    const modalImg = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalPrice = document.getElementById('modalPrice');
    const modalDimensions = document.getElementById('modalDimensions');
    const modalTechnique = document.getElementById('modalTechnique');
    const modalBuyBtn = document.getElementById('modalBuyBtn');

    if (modalImg) {
        modalImg.src = product.displayImage;
        modalImg.alt = product.title || 'Artwork';
    }
    if (modalTitle) modalTitle.textContent = product.title || '';
    if (modalPrice) modalPrice.textContent = product.price || '';
    if (modalDimensions) modalDimensions.textContent = product.dimensions ? `Dimensiones: ${product.dimensions}` : '';
    if (modalTechnique) modalTechnique.textContent = product.technique || '';

    // Buy Button Logic
    if (modalBuyBtn) {
        if (product.sold) {
            modalBuyBtn.textContent = 'VENDIDO';
            modalBuyBtn.href = '#';
            modalBuyBtn.style.pointerEvents = 'none';
            modalBuyBtn.style.opacity = '0.5';
            modalBuyBtn.style.background = '#ccc';
        } else if (product.isGeneric) {
            modalBuyBtn.style.display = 'none';
        } else {
            modalBuyBtn.textContent = 'CONSULTAR / COMPRAR';
            modalBuyBtn.style.display = 'inline-block';
            modalBuyBtn.style.pointerEvents = 'auto';
            modalBuyBtn.style.opacity = '1';
            modalBuyBtn.style.background = '#000';

            const waNumber = '5491168750007';
            const message = `Hola, me interesa la obra: ${product.title}`;
            modalBuyBtn.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
        }
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Modal Event Listeners
document.addEventListener('DOMContentLoaded', () => {
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
        } else if (e.key === 'ArrowRight' && (!modal || !modal.classList.contains('active'))) {
            moveSlide(1);
        } else if (e.key === 'ArrowLeft' && (!modal || !modal.classList.contains('active'))) {
            moveSlide(-1);
        }
    });
});

function closeModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        startAutoSlide(); // Resume carousel
    }
}
