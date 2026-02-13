// Immersive Gallery Logic

// Image Database (Restricted to Ilustrates folder)
const artImages = [
    './Ilustrates/aaaa.jpg',
    './Ilustrates/aaaaa.jpg',
    './Ilustrates/aaaaaa.jpg',
    './Ilustrates/aaaaaaa.jpg',
    './Ilustrates/aaaaaaaa.jpg',
    './Ilustrates/aaaaaaaaa.jpg',
    './Ilustrates/b.jpg',
    './Ilustrates/bb.jpg',
    './Ilustrates/bbb.jpg',
    './Ilustrates/bbbb.jpg',
    './Ilustrates/bbbbb.jpg',
    './Ilustrates/bbbbbbb.jpg',
    './Ilustrates/bbbbbbbb.jpg',
    './Ilustrates/bbbbbbbbbb.jpg',
    './Ilustrates/c.jpg',
    './Ilustrates/cc.jpg',
    './Ilustrates/ccc.jpg',
    './Ilustrates/cccc.jpg',
    './Ilustrates/ccccc.jpg',
    './Ilustrates/dibu1.jpg',
    './Ilustrates/dibu10.jpg',
    './Ilustrates/dibu11.jpg',
    './Ilustrates/dibu12.jpg',
    './Ilustrates/dibu13.jpg',
    './Ilustrates/dibu14.jpg',
    './Ilustrates/dibu15.jpg',
    './Ilustrates/dibu16.jpg',
    './Ilustrates/dibu17.jpg',
    './Ilustrates/dibu18.jpg',
    './Ilustrates/dibu19.jpg',
    './Ilustrates/dibu2.jpg',
    './Ilustrates/dibu3.jpg',
    './Ilustrates/dibu4.jpg',
    './Ilustrates/dibu5.jpg',
    './Ilustrates/dibu6.jpg',
    './Ilustrates/dibu7.jpg',
    './Ilustrates/dibu8.jpg',
    './Ilustrates/dibu9.jpg'
];

const canvas = document.getElementById('art-canvas');
const isMobile = window.innerWidth <= 768;

// --- UTILS ---
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Check if a new rect intersects with any in the existing list
function checkCollision(newRect, existingRects) {
    for (let rect of existingRects) {
        if (newRect.left < rect.right &&
            newRect.right > rect.left &&
            newRect.top < rect.bottom &&
            newRect.bottom > rect.top) {
            return true;
        }
    }
    return false;
}

function getSafePosition(width, height, existingRects, maxAttempts = 50) {
    for (let i = 0; i < maxAttempts; i++) {
        const left = getRandomInt(5, 95 - width); // vw
        const top = getRandomInt(5, 95 - height); // vh

        // Convert 'vw/vh' to rough relative collision units (0-100)
        const newRect = {
            left: left,
            right: left + width,
            top: top,
            bottom: top + height
        };

        if (!checkCollision(newRect, existingRects)) {
            return { left, top, rect: newRect };
        }
    }
    return null; // Failed to find spot
}


// --- LOGIC ---

// Maintain strict list of active elements
const activeElements = [];
const maxActive = isMobile ? 6 : 12;

function cycle() {
    // 1. Despawn random if too many
    if (activeElements.length >= maxActive) {
        const el = activeElements.shift(); // Remove oldest
        el.img.style.opacity = 0;

        setTimeout(() => {
            if (el.img.parentNode) el.img.parentNode.removeChild(el.img);
        }, 1000);
    }

    // 2. Spawn New
    if (artImages.length === 0) return;
    const src = artImages[getRandomInt(0, artImages.length - 1)];
    const img = document.createElement('img');
    img.src = src;
    img.classList.add('gallery-image');

    const sizeVW = getRandomInt(20, 30);
    const sizeVH = sizeVW * 1.4;

    // Get Rects of currently Active
    const currentRects = activeElements.map(e => e.rect);

    const pos = getSafePosition(sizeVW, sizeVH, currentRects, 10);

    if (pos) {
        img.style.left = pos.left + 'vw';
        img.style.top = pos.top + 'vh';
        img.style.width = sizeVW + 'vw';
        img.style.zIndex = getRandomInt(1, 20);

        canvas.appendChild(img);

        // Track
        activeElements.push({ img: img, rect: pos.rect });

        setTimeout(() => img.style.opacity = 1, 50);
    }
}

// Start Output
setInterval(cycle, 1500);

// Initial Burst
cycle();
setTimeout(cycle, 500); // Stagger second image
