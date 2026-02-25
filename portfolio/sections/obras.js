document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('imageModal');
  const modalImage = document.getElementById('modalImage');
  const modalTitle = document.getElementById('modalTitle');
  const modalTechnique = document.getElementById('modalTechnique');
  const modalDimensions = document.getElementById('modalDimensions');
  const modalBuyBtn = document.getElementById('modalBuyBtn');
  const modalClose = document.querySelector('.modal-close');

  // Setup modal triggers
  const triggers = document.querySelectorAll('.grid-modal-trigger');
  triggers.forEach(trigger => {
    // Dynamically inject professional hover overlay
    if (!trigger.querySelector('.masonry-overlay')) {
      const overlay = document.createElement('div');
      overlay.className = 'masonry-overlay';

      const title = trigger.dataset.title || '';
      const dims = trigger.dataset.dimensions || '';
      const tech = trigger.dataset.technique || '';

      overlay.innerHTML = `
        <div class="overlay-content">
          <h3 class="overlay-title">${title}</h3>
          <p class="overlay-details">
            ${dims}<br>
            ${tech}
          </p>
          <button class="btn-grid-details" style="pointer-events: auto; margin-top: 15px; background: transparent; border: 1px solid #111; color: #111; padding: 10px 20px; font-family: var(--font-body); font-size: 0.8rem; letter-spacing: 0.1em; cursor: pointer; transition: all 0.3s ease;">DETALLES</button>
        </div>
      `;
      trigger.appendChild(overlay);
    }

    trigger.addEventListener('click', (e) => {
      // Find current image inside trigger
      const img = trigger.querySelector('img');

      // If clicking the image directly, open the Zoom Lightbox
      if (e.target.tagName === 'IMG' || !e.target.closest('.btn-grid-details')) {
        if (img) openLightBox(img.src);
        return;
      }

      // Otherwise, they clicked DETALLES -> open the info modal
      if (img && modalImage) {
        modalImage.src = img.src;
        modalImage.alt = img.alt || 'Artwork details';
      }

      // Set details
      if (modalTitle) modalTitle.textContent = trigger.dataset.title || '';
      if (modalTechnique) modalTechnique.textContent = trigger.dataset.technique || '';
      if (modalDimensions) modalDimensions.textContent = trigger.dataset.dimensions || '';

      // Set whatsapp link
      if (modalBuyBtn) {
        modalBuyBtn.href = trigger.dataset.waLink || 'https://wa.me/5491168750007';
      }

      // Show modal
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  // Lightbox Zoom functionality
  const lightBoxModal = document.getElementById('lightBoxModal');
  const lightBoxImage = document.getElementById('lightBoxImage');
  const lightBoxClose = document.querySelector('.lightbox-close');

  const openLightBox = (src) => {
    if (lightBoxModal && lightBoxImage) {
      lightBoxImage.src = src;
      lightBoxImage.dataset.zoomLevel = '0';
      lightBoxImage.style.transform = 'scale(1)';
      lightBoxImage.style.transformOrigin = 'center center';
      lightBoxModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };

  const closeLightBox = () => {
    if (lightBoxModal) {
      lightBoxModal.classList.remove('active');
      document.body.style.overflow = '';
    }
    if (lightBoxImage) {
      lightBoxImage.dataset.zoomLevel = '0';
      lightBoxImage.style.transform = 'scale(1)';
      lightBoxImage.style.transformOrigin = 'center center';
    }
  };

  if (lightBoxClose) {
    lightBoxClose.addEventListener('click', closeLightBox);
  }

  if (lightBoxModal) {
    lightBoxModal.addEventListener('click', (e) => {
      if (e.target === lightBoxModal) {
        closeLightBox();
      }
    });
  }

  if (lightBoxImage) {
    lightBoxImage.addEventListener('click', function (e) {
      e.stopPropagation();

      let currentZoom = parseInt(this.dataset.zoomLevel || '0');
      currentZoom = (currentZoom + 1) % 3;
      this.dataset.zoomLevel = currentZoom;

      if (currentZoom === 0) {
        this.style.transform = 'scale(1)';
        setTimeout(() => {
          if (this.dataset.zoomLevel === '0') {
            this.style.transformOrigin = 'center center';
          }
        }, 300);
      } else {
        if (currentZoom === 1) {
          const rect = this.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const xPercent = (x / rect.width) * 100;
          const yPercent = (y / rect.height) * 100;
          this.style.transformOrigin = `${xPercent}% ${yPercent}%`;
          this.style.transform = 'scale(2)';
        } else if (currentZoom === 2) {
          this.style.transform = 'scale(4)';
        }
      }
      this.style.cursor = currentZoom === 2 ? 'zoom-out' : 'zoom-in';
    });

    lightBoxImage.addEventListener('mousemove', function (e) {
      let currentZoom = parseInt(this.dataset.zoomLevel || '0');
      this.style.cursor = currentZoom === 2 ? 'zoom-out' : 'zoom-in';
    });
  }

  // Close modal function
  const closeModal = () => {
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // Close button click
  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  // Click outside image
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.classList.contains('modal-container')) {
        closeModal();
      }
    });
  }

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (modal && modal.classList.contains('active')) closeModal();
      if (lightBoxModal && lightBoxModal.classList.contains('active')) closeLightBox();
    }
  });
});
