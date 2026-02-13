// Immersive Gallery Logic

// Image Database (Combined sources)
const artImages = [
    // --- ILUSTRATES (Local) ---
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
    './Ilustrates/dibu9.jpg',

    // --- OBRAS (Local) ---
    './portfolio/sections/obras/Copia2BDiego2BAduriz2BMi2Belectrico%2B24.jpg',
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
    './portfolio/sections/obras/Diego2BAduriz2BLuzazul2BAcrilico2Bpastel2Btela2B1802B2102B-%2B2015.jpg',
    './portfolio/sections/obras/IMG_0402+copia.jpg',
    './portfolio/sections/obras/MG_0307.jpg',
    './portfolio/sections/obras/MG_0312_1.jpg',
    './portfolio/sections/obras/MG_0327.jpg',
    './portfolio/sections/obras/MG_0328.jpg',
    './portfolio/sections/obras/MG_0329.jpeg',
    './portfolio/sections/obras/MG_1192.jpg',
    './portfolio/sections/obras/mascara1.jpg',
    './portfolio/sections/obras/mascara2.jpg',

    // --- DIGITAL ART (Tumblr) ---
    'https://64.media.tumblr.com/c29b535685cd870a467bdc6eb0d60ef2/tumblr_n27f1t2IvP1r74tb2o1_1280.jpg',
    'https://64.media.tumblr.com/c3123779be189a5a8737b190f595574a/tumblr_n275dsU7Xr1r74tb2o1_250.jpg',
    'https://64.media.tumblr.com/9e5c31eb51ce7e28c7982f271746f302/tumblr_n275eaKQwf1r74tb2o1_640.jpg',
    'https://64.media.tumblr.com/15528b2c6461bb6795b432f0b5a67bd3/tumblr_n2757yIlWR1r74tb2o1_540.jpg',
    'https://64.media.tumblr.com/580282830fff5598f2a6aa737655436b/tumblr_modrwpNIsq1rk6s0ao1_500.gifv',
    'https://64.media.tumblr.com/1bbdbeb27cf478c0bbe5808ccd9f5be9/tumblr_n2751mDCRn1r74tb2o1_1280.jpg',
    'https://64.media.tumblr.com/f5ed271a1d67b251893447f478373918/tumblr_n0pekqyXfc1r74tb2o1_540.jpg',
    'https://64.media.tumblr.com/a0170c683d6f30104d1617b318606594/tumblr_n1ifoet4hU1r74tb2o1_640.jpg',
    'https://64.media.tumblr.com/a424e6004e68c0c70b556d0decea4640/tumblr_mik6rjkNBd1r74tb2o1_1280.jpg',
    'https://64.media.tumblr.com/1bb25eb40d514eacedcb439a49f1e55c/tumblr_mj5u83cYvq1r74tb2o1_1280.jpg',
    'https://64.media.tumblr.com/5812366f56824bb3701380d3c0fba21a/tumblr_mj5ufsXSyK1r74tb2o1_1280.jpg',
    'https://64.media.tumblr.com/f8e1812dc614c72b60b56f89f2b127db/tumblr_mj5u8o065H1r74tb2o1_1280.jpg',
    'https://64.media.tumblr.com/5420ccb5f9c366ae72478e3ef1e9fffb/tumblr_mj5uatzwwJ1r74tb2o1_1280.jpg',
    'https://64.media.tumblr.com/24cfc6b732c92e3d7ddf8987a72eba49/tumblr_mj5ubiUNfx1r74tb2o1_1280.jpg',
    'https://64.media.tumblr.com/55dd884d09f2212a66fe20245a5349a7/tumblr_mj5uc3WbDN1r74tb2o1_1280.jpg',
    'https://64.media.tumblr.com/dd73c46d0102f8b1ffd415bd76fd19cd/tumblr_mj5uha1TC61r74tb2o1_640.jpg',
    'https://64.media.tumblr.com/9a5fcd602be749b87170a2e8619a1ea2/tumblr_mik8sejaR81r74tb2o1_500.jpg',
    'https://64.media.tumblr.com/tumblr_m9wj0scgbT1r74tb2o1_1280.jpg',
    'https://64.media.tumblr.com/tumblr_m9wh659wm21r74tb2o1_1280.jpg',
    'https://64.media.tumblr.com/tumblr_m9wgt5Tze81r74tb2o1_640.jpg',
    'https://64.media.tumblr.com/tumblr_m9wcga5hZd1r74tb2o1_400.jpg',
    'https://64.media.tumblr.com/4524db478703805e9ff5b3843e6c2941/tumblr_n6z8l6ypA11r74tb2o1_640.gifv'
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
