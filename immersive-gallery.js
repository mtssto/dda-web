// Minimal Script for Index Page (Video Only View)

document.addEventListener('DOMContentLoaded', () => {
    // --- Video Autoplay Fallback ---
    const introVideo = document.getElementById('intro-video');
    if (introVideo) {
        introVideo.play().catch(e => {
            console.log("Video auto-play blocked by browser, requires user interaction.", e);
            // Some mobile browsers strict block autoplay even when muted, 
            // but usually muted + playsinline + autoplay attribute works.
        });
    }

    // --- Welcome Shop Popup Logic ---
    const welcomeModal = document.getElementById('welcomeShopModal');
    const welcomeClose = document.getElementById('welcomeClose');
    const welcomeExploreBtn = document.getElementById('welcomeExploreBtn');

    if (welcomeModal) {
        // Check if user has seen popup this session
        if (!sessionStorage.getItem('shopWelcomeShown')) {
            // Show after a short delay for smooth loading
            setTimeout(() => {
                welcomeModal.style.display = 'block';
                // Trigger reflow
                void welcomeModal.offsetWidth;
                welcomeModal.style.opacity = '1';
                welcomeModal.style.transform = 'translateY(0)';
                sessionStorage.setItem('shopWelcomeShown', 'true');
            }, 1000);
        }

        const closeWelcome = () => {
            welcomeModal.style.opacity = '0';
            welcomeModal.style.transform = 'translateY(20px)';
            setTimeout(() => {
                welcomeModal.style.display = 'none';
            }, 500);
        };

        if (welcomeClose) welcomeClose.addEventListener('click', closeWelcome);
        if (welcomeExploreBtn) welcomeExploreBtn.addEventListener('click', closeWelcome);

        // Close on outside click
        welcomeModal.addEventListener('click', function (e) {
            if (e.target === welcomeModal) {
                closeWelcome();
            }
        });

        // Close on Escape
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && welcomeModal.style.display === 'block') {
                closeWelcome();
            }
        });
    }
});
