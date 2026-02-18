// Immersive Gallery Logic

// Image Database (Combined sources)
const artImages = [
    // --- ILUSTRATES ---
    './Ilustrates/dibu1.jpg',
    './Ilustrates/dibu2.jpg',
    './Ilustrates/dibu3.jpg',
    './Ilustrates/dibu4.jpg',
    './Ilustrates/dibu5.jpg',
    './Ilustrates/dibu6.jpg',
    './Ilustrates/dibu7.jpg',
    './Ilustrates/dibu8.jpg',
    './Ilustrates/dibu9.jpg',
    './Ilustrates/dibu10.jpg',
    './Ilustrates/dibu11.jpg',
    './Ilustrates/dibu12.jpg',
    './Ilustrates/dibu14.jpg',
    './Ilustrates/dibu15.jpg',
    './Ilustrates/dibu16.jpg',
    './Ilustrates/dibu19.jpg',
    './Ilustrates/dibu20.jpg',

    // --- OBRAS (Local) ---
    './portfolio/sections/obras/micuerpo.jpg',
    './portfolio/sections/obras/Diego+de+Aduriz+-+Abecedario+-+150+x+100+cm+-+Pastel+y+acrilico+sobre+tela+-+2021.jpg',
    './portfolio/sections/obras/Diego+de+Aduriz+-+Autoretrato+-+110+x+150+cm+-+Marcadores+sobre+papel+-+2007.jpg',
    './portfolio/sections/obras/Diego+de+Aduriz+-+Gato+arcoiris+-+100+x+65+cm+-++pastel+sobre+papel+-+2020.jpg',
    './portfolio/sections/obras/Diego+de+Aduriz+-+Gato+con+flor+de+loto+-+Pastel+tiza+sobre+papel+-+25+x+18+cm+-+2018.jpeg',
    './portfolio/sections/obras/Diego+de+Aduriz+-+Gato+cosmico+-+Pastel+tiza+-+80+x+110+cm+2013.jpeg',
    './portfolio/sections/obras/Diego+de+Aduriz+-+Mi+cuerpo+electrico+29+160+x+200+-+Pastel+y+acrilico+sobre+tela+-+2021.jpg',
    './portfolio/sections/obras/Diego+de+Aduriz+-+Paisaje+teorico+-+Tecnica+mixta+sobre+papel+-+24+x+34+cm+-+2009.jpeg',
    './portfolio/sections/obras/Diego+de+Aduriz+-+Piasaje+con+monstruo+amistoso+-+Lapiz+sobre+papel+-+24+x+34+cm+-+2011.jpeg',
    './portfolio/sections/obras/Diego+de+Aduriz+-+Puerta+Azul+-+210+x+92+cm+-+Pintura+y+pastel+tiza+sobre+madera+-+2015_2017.jpeg',
    './portfolio/sections/obras/Diego+de+Aduriz+-+Sin+titulo+-+Tecnica+mixta+sobre+papel+-+34+x+24+cm+-+2012.jpg',
    './portfolio/sections/obras/Diego+de+Aduriz+-+The+future+is+stupid+-+tecnica+mixta+sobre+papel+-+50+x+35+cm+-+2015.jpeg',
    './portfolio/sections/obras/luz_azul.jpg',
    './portfolio/sections/obras/IMG_0402+copia.jpg',
    './portfolio/sections/obras/MG_0307.jpg',
    './portfolio/sections/obras/MG_0312_1.jpg',
    './portfolio/sections/obras/MG_0327.jpg',
    './portfolio/sections/obras/MG_0328.jpg',
    './portfolio/sections/obras/MG_0329.jpeg',
    './portfolio/sections/obras/MG_1192.jpg',
    './portfolio/sections/obras/mascara1.jpg',
    './portfolio/sections/obras/mascara2.jpg'
];

const canvas = document.getElementById('art-canvas');
const CELL_SIZE_TARGET = 150; // Target pixel size for cells (balancing count vs visible detail)

function initGrid() {
    if (!canvas || artImages.length === 0) return;

    // 1. Calculate Dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;

    const cols = Math.ceil(width / CELL_SIZE_TARGET);
    const rows = Math.ceil(height / CELL_SIZE_TARGET);

    // 2. Set CSS Grid
    canvas.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    canvas.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    // 3. Populate Grid
    const totalCells = cols * rows;
    canvas.innerHTML = ''; // Clear existing

    for (let i = 0; i < totalCells; i++) {
        const img = document.createElement('img');
        img.classList.add('gallery-image');

        // Random initial image
        img.src = artImages[getRandomInt(0, artImages.length - 1)];

        // Staggered fade in for initial load
        img.style.transitionDelay = `${Math.random() * 2}s`;

        // Add click listener
        img.onclick = function () {
            // Find product in data source logic
            const srcResult = img.src;
            // Decode just in case
            const decodedSrc = decodeURIComponent(srcResult);

            // Try to find matching image in products
            // Note: products.js must be loaded. window.products should exist.
            const products = window.products || [];

            // Loose match: check if product image path is contained in src
            // Because src might be full URL (http://...) and product.image is relative (../portfolio...)
            let foundProduct = products.find(p => decodedSrc.includes(p.image.replace(/^\.\//, '')));
            // Also try matching just using filename if path differs completely
            if (!foundProduct) {
                const filename = srcResult.substring(srcResult.lastIndexOf('/') + 1);
                foundProduct = products.find(p => p.image.includes(filename));
            }

            if (foundProduct) {
                openModal(foundProduct);
            } else {
                // Fallback if not found in shop (e.g. just an illustration)
                // Open just the image in modal? Or do nothing?
                // User said "add comprar", implies shop items. 
                // For now, let's open it with generic info or just log.
                // Let's open with just the image.
                openModal({
                    title: 'Diego de Aduriz',
                    image: img.src,
                    price: '',
                    dimensions: '',
                    technique: '',
                    isGeneric: true // Flag to hide buy button if needed
                });
            }
        };

        canvas.appendChild(img);

        // Trigger fade in after append
        requestAnimationFrame(() => {
            img.style.opacity = 1;
        });
    }
}

// Update a single random cell
function updateRandomCell() {
    const images = document.querySelectorAll('.gallery-image');
    if (images.length === 0) return;

    const randomIdx = getRandomInt(0, images.length - 1);
    const img = images[randomIdx];

    // Fade Out
    img.style.transitionDelay = '0s'; // Instant reaction
    img.style.opacity = 0;

    setTimeout(() => {
        // Swap Source
        img.src = artImages[getRandomInt(0, artImages.length - 1)];

        // Fade In
        img.onload = () => {
            img.style.opacity = 1;
        };
    }, 1000); // Wait for fade out (matches CSS transition time)
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Initial Setup
initGrid();

// Handle Resize (Debounced roughly)
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(initGrid, 300);
});

// Start "Living Wall" Cycle
// Update one cell every X ms
setInterval(updateRandomCell, 800); // Slower updates (was 200)

// --- Modal Logic (Ported from Shop) ---
function openModal(product) {
    const modal = document.getElementById('imageModal');
    if (!modal) return;

    const modalImg = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalPrice = document.getElementById('modalPrice');
    const modalDimensions = document.getElementById('modalDimensions');
    const modalTechnique = document.getElementById('modalTechnique');
    const modalBuyBtn = document.getElementById('modalBuyBtn');

    if (modalImg) {
        // Fix path for index page: Remove leading "../" since products.js has paths relative to shop folder
        let displayImage = product.image;
        if (displayImage.startsWith('../')) {
            displayImage = displayImage.substring(3);
        }
        modalImg.src = displayImage;
        modalImg.alt = product.title || 'Artwork';
    }
    if (modalTitle) modalTitle.textContent = product.title || '';
    if (modalPrice) modalPrice.textContent = product.price || '';
    if (modalDimensions) modalDimensions.textContent = product.dimensions ? `Dimensiones: ${product.dimensions}` : '';
    if (modalTechnique) modalTechnique.textContent = product.technique || '';

    // Buy Button Logic
    if (modalBuyBtn) {
        if (product.sold) {
            modalBuyBtn.textContent = 'VENDIDO'; // Hardcoded for now, or use i18n if available
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
        }
    });
});

function closeModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}
