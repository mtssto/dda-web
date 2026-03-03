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

    // Now we have 4 options:
    // 0: Full-screen background image "Las naves escenografía"
    // 1: Full-screen background image "dibu24.jpg"
    // 2: Full-screen background image "Las naves escenografía (2)"
    // 3: The Collage Grabbing Logic

    const option = Math.floor(Math.random() * 4);

    if (option === 0) {
        container.style.backgroundImage = 'url("portfolio/sections/obras/Las naves escenografía.JPG")';
        container.style.backgroundSize = 'cover';
        container.style.backgroundPosition = 'center';
        container.style.backgroundRepeat = 'no-repeat';
        return;
    } else if (option === 1) {
        container.style.backgroundImage = 'url("Ilustrates/dibu24.jpg")';
        container.style.backgroundSize = 'cover';
        container.style.backgroundPosition = 'center';
        container.style.backgroundRepeat = 'no-repeat';
        return;
    } else if (option === 2) {
        container.style.backgroundImage = 'url("portfolio/sections/obras/Las naves escenografía (2).JPG")';
        container.style.backgroundSize = 'cover';
        container.style.backgroundPosition = 'center';
        container.style.backgroundRepeat = 'no-repeat';
        return;
    }

    // Option 2: The Collage Grabbing Logic

    // Load Las Naves images (1 to 11.jpg)
    const navesImages = Array.from({ length: 11 }, (_, i) => `portfolio/sections/Las Naves/${i + 1}.jpg`);

    // Load explicitly the dibu images from Ilustrates that we found via directory listing
    // Since some are jpeg and most are jpg we parse them explicitly or check arrays
    const ilusJpgs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 24, 25, 26, 27].map(i => `Ilustrates/dibu${i}.jpg`);
    const ilusJpegs = ['Ilustrates/dibu21.jpeg', 'Ilustrates/dibu22.jpeg', 'Ilustrates/dibu23.jpeg'];

    // Combine arrays ensuring 'otherIlus' (like aaaa.jpg) and oldMiscImages are excluded per user request
    const newNaves = [
        'portfolio/sections/obras/Las naves escenografía dorso.JPG',
        'portfolio/sections/obras/Las naves escenografía.JPG'
    ];
    const allImages = [...navesImages, ...newNaves, ...ilusJpgs, ...ilusJpegs];

    // --- Color Data ---
    // Precalculated HSL data for Las Naves and Ilustrates dibu*
    const colorData = {
        "portfolio/sections/Las Naves/1.jpg": { "h": 27, "s": 27, "l": 32 },
        "portfolio/sections/Las Naves/2.jpg": { "h": 195, "s": 35, "l": 63 },
        "portfolio/sections/Las Naves/3.jpg": { "h": 253, "s": 58, "l": 12 },
        "portfolio/sections/Las Naves/4.jpg": { "h": 44, "s": 38, "l": 24 },
        "portfolio/sections/Las Naves/5.jpg": { "h": 151, "s": 17, "l": 12 },
        "portfolio/sections/Las Naves/6.jpg": { "h": 141, "s": 19, "l": 14 },
        "portfolio/sections/Las Naves/7.jpg": { "h": 255, "s": 54, "l": 8 },
        "portfolio/sections/Las Naves/8.jpg": { "h": 243, "s": 21, "l": 10 },
        "portfolio/sections/Las Naves/9.jpg": { "h": 213, "s": 1, "l": 47 },
        "portfolio/sections/Las Naves/10.jpg": { "h": 18, "s": 2, "l": 42 },
        "portfolio/sections/Las Naves/11.jpg": { "h": 325, "s": 1, "l": 47 },
        "portfolio/sections/obras/Las naves escenografía dorso.JPG": { "h": 340, "s": 21, "l": 74 },
        "portfolio/sections/obras/Las naves escenografía.JPG": { "h": 0, "s": 0, "l": 0 },
        "Ilustrates/dibu1.jpg": { "h": 33, "s": 12, "l": 61 },
        "Ilustrates/dibu2.jpg": { "h": 38, "s": 12, "l": 61 },
        "Ilustrates/dibu3.jpg": { "h": 19, "s": 26, "l": 62 },
        "Ilustrates/dibu4.jpg": { "h": 38, "s": 8, "l": 66 },
        "Ilustrates/dibu5.jpg": { "h": 26, "s": 19, "l": 62 },
        "Ilustrates/dibu6.jpg": { "h": 34, "s": 28, "l": 54 },
        "Ilustrates/dibu7.jpg": { "h": 39, "s": 32, "l": 52 },
        "Ilustrates/dibu8.jpg": { "h": 349, "s": 4, "l": 63 },
        "Ilustrates/dibu9.jpg": { "h": 28, "s": 26, "l": 65 },
        "Ilustrates/dibu10.jpg": { "h": 31, "s": 33, "l": 70 },
        "Ilustrates/dibu11.jpg": { "h": 78, "s": 10, "l": 50 },
        "Ilustrates/dibu12.jpg": { "h": 36, "s": 20, "l": 68 },
        "Ilustrates/dibu13.jpg": { "h": 214, "s": 9, "l": 63 },
        "Ilustrates/dibu14.jpg": { "h": 0, "s": 5, "l": 61 },
        "Ilustrates/dibu15.jpg": { "h": 281, "s": 9, "l": 65 },
        "Ilustrates/dibu16.jpg": { "h": 338, "s": 6, "l": 51 },
        "Ilustrates/dibu17.jpg": { "h": 13, "s": 8, "l": 60 },
        "Ilustrates/dibu18.jpg": { "h": 43, "s": 4, "l": 62 },
        "Ilustrates/dibu19.jpg": { "h": 46, "s": 10, "l": 61 },
        "Ilustrates/dibu20.jpg": { "h": 216, "s": 34, "l": 61 },
        "Ilustrates/dibu21.jpeg": { "h": 342, "s": 1, "l": 73 },
        "Ilustrates/dibu22.jpeg": { "h": 298, "s": 2, "l": 82 },
        "Ilustrates/dibu23.jpeg": { "h": 108, "s": 5, "l": 58 },
        "Ilustrates/dibu24.jpg": { "h": 277, "s": 3, "l": 76 },
        "Ilustrates/dibu25.jpg": { "h": 218, "s": 7, "l": 64 },
        "Ilustrates/dibu26.jpg": { "h": 342, "s": 3, "l": 70 },
        "Ilustrates/dibu27.jpg": { "h": 70, "s": 70, "l": 59 }
    };

    // --- Color Grouping Logic ---
    // Define color families based on Hue 0-360
    const colorFamilies = [
        { name: 'Red/Warm', filter: h => (h >= 340 || h <= 25) },
        { name: 'Orange/Brown', filter: h => (h > 25 && h <= 50) },
        { name: 'Yellow/Green', filter: h => (h > 50 && h <= 170) },
        { name: 'Blue/Cool', filter: h => (h > 170 && h <= 240) },
        { name: 'Purple/Pink', filter: h => (h > 240 && h < 340) }
    ];

    // Pick a random family for this load
    const targetFamily = colorFamilies[Math.floor(Math.random() * colorFamilies.length)];

    // Separate matching images vs others
    let matchingImages = [];
    let otherImages = [];

    allImages.forEach(src => {
        const data = colorData[src];
        // If we have color data, and either saturation is super low (bw) or hue matches
        if (data) {
            // Include low-saturation neutral images in any palette to pad it out naturally
            if (data.s <= 10) {
                matchingImages.push(src);
            } else if (targetFamily.filter(data.h)) {
                matchingImages.push(src);
            } else {
                otherImages.push(src);
            }
        } else {
            otherImages.push(src);
        }
    });

    // Shuffle both sets
    matchingImages.sort(() => 0.5 - Math.random());
    otherImages.sort(() => 0.5 - Math.random());

    // Number of images to display
    const numImages = Math.floor(Math.random() * 5) + 8; // 8 to 12 images

    // If we don't have enough matching images, pad with others
    let selectedImages = matchingImages.slice(0, numImages);
    if (selectedImages.length < numImages) {
        selectedImages = selectedImages.concat(otherImages.slice(0, numImages - selectedImages.length));
    }

    // Shuffle final selection so the layout looks organic
    selectedImages.sort(() => 0.5 - Math.random());

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
