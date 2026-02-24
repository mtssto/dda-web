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
        </div>
      `;
      trigger.appendChild(overlay);
    }

    trigger.addEventListener('click', (e) => {
      // Find current image inside trigger
      const img = trigger.querySelector('img');
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
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeModal();
    }
  });
});
