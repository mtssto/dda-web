// muestras-gallery.js
document.addEventListener('DOMContentLoaded', () => {
    const prevBtn = document.querySelector('.gallery-prev');
    const nextBtn = document.querySelector('.gallery-next');
    const galleryGrid = document.querySelector('.gallery-grid');

    if (!galleryGrid) return;

    let autoScrollInterval;
    const scrollDelay = 3500; // 3.5 seconds between jumps

    // Calculate roughly how much to scroll based on screen size
    const getScrollAmount = () => {
        // Scroll about 80% of the viewport width, or a fixed amount on desktop
        return window.innerWidth > 768 ? 600 : window.innerWidth * 0.8;
    };

    const scrollNext = () => {
        // If we reached the very end, snap back to start smoothly
        if (galleryGrid.scrollLeft + galleryGrid.clientWidth >= galleryGrid.scrollWidth - 10) {
            galleryGrid.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
            galleryGrid.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
        }
    };

    const startAutoScroll = () => {
        if (!autoScrollInterval) {
            autoScrollInterval = setInterval(scrollNext, scrollDelay);
        }
    };

    const stopAutoScroll = () => {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
    };

    // --- Event Listeners ---
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            stopAutoScroll(); // Pause when user interacts manually
            galleryGrid.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
            startAutoScroll(); // Resume
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            stopAutoScroll();
            scrollNext();
            startAutoScroll();
        });
    }

    // Pause on hover or touch so users can look at an image in peace
    galleryGrid.addEventListener('mouseenter', stopAutoScroll);
    galleryGrid.addEventListener('mouseleave', startAutoScroll);
    galleryGrid.addEventListener('touchstart', stopAutoScroll, { passive: true });
    galleryGrid.addEventListener('touchend', startAutoScroll, { passive: true });

    // Start immediately
    startAutoScroll();

    // Scroll Arrow Logic
    const scrollableText = document.getElementById('scrollableText');
    const scrollArrow = document.getElementById('scrollArrow');

    if (scrollableText && scrollArrow) {
        const checkTextScroll = () => {
            // Check if scrollable at all
            if (scrollableText.scrollHeight > scrollableText.clientHeight + 10) {
                scrollArrow.style.display = 'flex';
                // If scrolled to bottom, hide it
                if (scrollableText.scrollTop + scrollableText.clientHeight >= scrollableText.scrollHeight - 20) {
                    scrollArrow.style.opacity = '0';
                } else {
                    scrollArrow.style.opacity = '1';
                }
            } else {
                scrollArrow.style.display = 'none';
            }
        };

        scrollableText.addEventListener('scroll', checkTextScroll);
        window.addEventListener('resize', checkTextScroll);

        scrollArrow.addEventListener('click', () => {
            scrollableText.scrollBy({ top: 200, behavior: 'smooth' });
        });

        // Wait a small moment for layout calculation
        setTimeout(checkTextScroll, 100);
    }
});
