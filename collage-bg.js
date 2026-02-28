// collage-bg.js
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('collage-bg-container');
    const navWrapper = document.querySelector('.index-nav-wrapper');
    if (!container) return;

    // Detect hover on nav wrapper links to trigger blur
    if (navWrapper) {
        // We add event listeners to actual links so hovering the empty space doesn't blur
        const links = navWrapper.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('mouseenter', () => container.style.filter = 'blur(12px)');
            link.addEventListener('mouseleave', () => container.style.filter = 'blur(0px)');

            // Focus for accessibility
            link.addEventListener('focus', () => container.style.filter = 'blur(12px)');
            link.addEventListener('blur', () => container.style.filter = 'blur(0px)');
        });
    }

    const buohImages = Array.from({ length: 15 }, (_, i) => `portfolio/sections/BUOH/${i + 1}.jpg`).concat(['portfolio/sections/BUOH/title.jpg']);
    const ilusJpgs = Array.from({ length: 20 }, (_, i) => `Ilustrates/dibu${i + 1}.jpg`);
    const ilusJpegs = ['Ilustrates/dibu21.jpeg', 'Ilustrates/dibu22.jpeg', 'Ilustrates/dibu23.jpeg'];
    const otherIlus = [
        'Ilustrates/aaaa.jpg', 'Ilustrates/aaaaaaaa.jpg',
        'Ilustrates/bbb.jpg', 'Ilustrates/bbbb.jpg', 'Ilustrates/bbbbbbbb.jpg',
        'Ilustrates/c.jpg', 'Ilustrates/ccc.jpg',
        'Ilustrates/collage_new_chars.jpg'
    ];
    const oldMiscImages = [
        'ddaImages/MACBA.jpg',
        'portfolio/sections/images/gato1.jpg',
        'portfolio/sections/images/flor.jpg'
    ];

    const images = [...buohImages, ...ilusJpgs, ...ilusJpegs, ...otherIlus, ...oldMiscImages];

    // Number of images to display
    const numImages = Math.floor(Math.random() * 6) + 12; // 12 to 17 images

    // Shuffle array
    const shuffled = images.sort(() => 0.5 - Math.random());
    const selectedImages = shuffled.slice(0, numImages);

    selectedImages.forEach((src) => {
        const item = document.createElement('div');
        item.classList.add('collage-item');

        const img = document.createElement('img');
        img.src = src;

        // set random width based on screen size
        const isMobile = window.innerWidth <= 768;
        const maxWidth = isMobile ? 180 : 350;
        const minWidth = isMobile ? 90 : 150;
        const width = Math.floor(Math.random() * (maxWidth - minWidth + 1)) + minWidth;
        img.style.width = width + 'px';

        item.appendChild(img);
        container.appendChild(item);

        img.onload = () => {
            // Position randomly within viewport, allowing slight bleed off edges
            const maxX = window.innerWidth - (width * 0.5);
            const maxY = window.innerHeight - (img.offsetHeight * 0.5);

            const x = Math.max(-width * 0.2, Math.floor(Math.random() * maxX));
            const y = Math.max(-img.offsetHeight * 0.2, Math.floor(Math.random() * maxY));

            // Random rotation between -20 and 20 degrees
            const rotation = Math.floor(Math.random() * 40) - 20;

            item.style.left = x + 'px';
            item.style.top = y + 'px';
            item.style.transform = `rotate(${rotation}deg)`;

            // Random z-index so they overlap naturally
            item.style.zIndex = Math.floor(Math.random() * 100);
        };

        // Handle error if image doesn't exist to prevent broken icons
        img.onerror = () => {
            item.remove();
        };

        // --- Drag and Drop Functionality ---
        let isDragging = false;
        let startX, startY, initialX, initialY;

        item.style.cursor = 'grab';

        item.addEventListener('mousedown', (e) => {
            isDragging = true;
            item.style.cursor = 'grabbing';
            item.style.transition = 'none'; // Disable transition for instant drag

            // Bring to front
            item.style.zIndex = 1000;

            startX = e.clientX;
            startY = e.clientY;

            // Get current transform translate values if any, else use left/top
            initialX = parseFloat(item.style.left) || 0;
            initialY = parseFloat(item.style.top) || 0;

            e.preventDefault(); // Prevent default image dragging behavior
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            item.style.left = `${initialX + dx}px`;
            item.style.top = `${initialY + dy}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                item.style.cursor = 'grab';
                // Reset to random z-index so others can be brought to front
                item.style.zIndex = Math.floor(Math.random() * 100);
            }
        });

        // Touch support for mobile dragging
        item.addEventListener('touchstart', (e) => {
            isDragging = true;
            item.style.transition = 'none';
            item.style.zIndex = 1000;

            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;

            initialX = parseFloat(item.style.left) || 0;
            initialY = parseFloat(item.style.top) || 0;

            // Do not prevent default here to allow clicking
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;

            // Prevent scrolling and pull-to-refresh while dragging an image
            e.preventDefault();

            const touch = e.touches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;

            item.style.left = `${initialX + dx}px`;
            item.style.top = `${initialY + dy}px`;
        }, { passive: false });

        document.addEventListener('touchend', () => {
            if (isDragging) {
                isDragging = false;
                item.style.zIndex = Math.floor(Math.random() * 100);
            }
        });
    });
});
