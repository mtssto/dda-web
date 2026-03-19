document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('imageModal');
  const modalImage = document.getElementById('modalImage');
  const modalTitle = document.getElementById('modalTitle');
  const modalTechnique = document.getElementById('modalTechnique');
  const modalDimensions = document.getElementById('modalDimensions');
  const modalBuyBtn = document.getElementById('modalBuyBtn');
  const modalClose = document.querySelector('.modal-close');

  // Initialize grids from products.js
  renderPortfolio();

  // Setup modal triggers
  initModalTriggers();

  function renderPortfolio() {
    if (!window.products) return;

    // Define category to container mapping
    const sectionMap = {
      'pasteles': document.querySelector('#pasteles .masonry-grid'),
      'gatos': document.querySelector('#gatos .masonry-grid'),
      'paisajes': document.querySelector('#paisajes .masonry-grid'),
      'digital': document.querySelector('#digital .masonry-grid'),
      'ilustraciones': document.querySelector('#ilustraciones .masonry-grid'),
      'Autorretratos': document.querySelector('#Autorretratos .masonry-grid')
    };

    // Clear existing content securely
    Object.values(sectionMap).forEach(grid => {
      if (grid) grid.innerHTML = '';
    });

    window.products.forEach(product => {
      const grid = sectionMap[product.category];
      if (!grid) return;

      const item = document.createElement('div');
      item.className = 'masonry-item grid-modal-trigger';

      // Store complete dataset context
      if (product.dimensions && product.dimensions !== "Consultar medidas") {
        item.dataset.dimensions = product.dimensions;
      } else {
        item.dataset.dimensions = "Consultar medidas";
      }

      if (product.technique && product.technique !== "Consultar técnica") {
        item.dataset.technique = product.technique;
      } else {
        item.dataset.technique = "Consultar técnica";
      }

      if (product.year && product.year !== "Consultar año") {
        item.dataset.year = product.year;
      } else {
        item.dataset.year = "Consultar año";
      }

      item.dataset.title = product.title;
      // Encode whatsapp link with title
      item.dataset.waLink = `https://wa.me/5491160139563?text=Hola,%20quisiera%20consultar%20por%20la%20obra:%20${encodeURIComponent(product.title)}`;

      // Resolve images data attribute if multiple images exist
      if (product.images && product.images.length > 1) {
        // Adjust paths for portfolio context if necessary
        item.dataset.images = JSON.stringify(product.images);
      }

      // Ensure primary image path is adjusted for portfolio context
      let imagePath = product.image || '';
      if (imagePath.startsWith('../')) {
        imagePath = '../' + imagePath;
      }
      item.innerHTML = `<img alt="${product.title}" src="${imagePath}" />`;
      grid.appendChild(item);
    });
  }

  function initModalTriggers() {
    const triggers = document.querySelectorAll('.grid-modal-trigger');
    triggers.forEach(trigger => {
      // ... existing trigger logic ...
      // Dynamically inject professional hover overlay
      if (!trigger.querySelector('.masonry-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'masonry-overlay';

        const title = trigger.dataset.title || '';
        const dims = trigger.dataset.dimensions || '';
        const tech = trigger.dataset.technique || '';
        const year = trigger.dataset.year || '';

        let yearDisplay = '';
        if (year && year !== 'Consultar año') {
          yearDisplay = year;
        } else if (year === 'Consultar año') {
          yearDisplay = 'Consultar año';
        }

        overlay.innerHTML = `
          <div class="overlay-content">
            <h3 class="overlay-title">${title}</h3>
            <p class="overlay-details">
              ${dims}<br>
              ${tech}<br>
              ${yearDisplay}
            </p>
            <button class="btn-grid-details" style="pointer-events: auto; margin-top: 15px; background: transparent; border: 1px solid #111; color: #111; padding: 10px 20px; font-family: var(--font-body); font-size: 0.8rem; letter-spacing: 0.1em; cursor: pointer; transition: all 0.3s ease;">DETALLES</button>
          </div>
        `;
        trigger.appendChild(overlay);
      }

      trigger.addEventListener('click', (e) => {
        // Find current image inside trigger
        const img = trigger.querySelector('img');
        const imgSrcToMatch = img ? (img.getAttribute('src') || img.src) : '';

        let productData = null;
        if (imgSrcToMatch && window.products) {
          const filename = imgSrcToMatch.split('/').pop().split('?')[0];
          const found = window.products.find(p => {
            return (p.image && p.image.includes(filename)) ||
              (p.images && p.images.some(i => i.includes(filename)));
          });

          if (found) {
            const fixPath = (p) => {
              if (!p) return p;
              if (p.startsWith('../')) return '../' + p;
              return p.replace('../portfolio/sections/', '../sections/');
            };
            productData = {
              title: found.title,
              technique: found.technique,
              dimensions: found.dimensions,
              year: found.year,
              price: found.price,
              images: found.images ? found.images.map(fixPath) : [fixPath(found.image)]
            };
          }
        }

        // If clicking the image directly, open the Zoom Lightbox
        if (e.target.tagName === 'IMG' || !e.target.closest('.btn-grid-details')) {
          let imagesToPass = img ? [imgSrcToMatch] : [];
          if (productData && productData.images && productData.images.length > 0) {
            imagesToPass = productData.images;
          } else if (trigger.dataset.images) {
            try {
              imagesToPass = JSON.parse(trigger.dataset.images);
            } catch (error) { }
          }
          if (imagesToPass.length > 0) openLightBox(imagesToPass);
          return;
        }

        // Otherwise, they clicked DETALLES -> open the info modal
        const imagesToPass = (productData && productData.images && productData.images.length > 0)
          ? productData.images
          : (img ? [imgSrcToMatch] : []);

        window.obrasModalImages = imagesToPass;
        window.obrasModalCurrentIndex = 0;

        const modalPrev = document.getElementById('modalPrev');
        const modalNext = document.getElementById('modalNext');

        if (modalPrev && modalNext) {
          if (window.obrasModalImages.length > 1) {
            modalPrev.style.display = 'flex';
            modalNext.style.display = 'flex';
          } else {
            modalPrev.style.display = 'none';
            modalNext.style.display = 'none';
          }
        }

        if (modalImage && window.obrasModalImages.length > 0) {
          modalImage.src = window.obrasModalImages[0];
          modalImage.alt = productData ? productData.title : (img ? img.alt : 'Artwork details');
        }

        // Set details
        if (modalTitle) modalTitle.textContent = productData ? productData.title : (trigger.dataset.title || '');
        if (modalTechnique) modalTechnique.textContent = productData ? productData.technique : (trigger.dataset.technique || '');
        if (modalDimensions) modalDimensions.textContent = productData ? productData.dimensions : (trigger.dataset.dimensions || '');

        const modalYear = document.getElementById('modalYear');
        if (modalYear) {
          let yearText = productData ? productData.year : (trigger.dataset.year || '');
          if (yearText && yearText !== "Consultar año") {
            modalYear.textContent = yearText;
            modalYear.style.display = 'block';
          } else if (yearText === "Consultar año") {
            modalYear.textContent = "Consultar año";
            modalYear.style.display = 'block';
          } else {
            modalYear.style.display = 'none';
          }
        }

        // Set whatsapp link (always fallback to dataset since products.js doesn't have it)
        if (modalBuyBtn) {
          modalBuyBtn.href = trigger.dataset.waLink || 'https://wa.me/5491160139563';
        }

        // Show modal
        if (modal) {
          modal.classList.add('active');
          document.body.classList.add('obras-modal-open');
          document.body.style.overflow = 'hidden';
        }
      });
    });
  }

  const modalPrev = document.getElementById('modalPrev');
  const modalNext = document.getElementById('modalNext');

  window.obrasModalImages = [];
  window.obrasModalCurrentIndex = 0;

  if (modalPrev) {
    modalPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.obrasModalImages.length > 1) {
        window.obrasModalCurrentIndex = (window.obrasModalCurrentIndex - 1 + window.obrasModalImages.length) % window.obrasModalImages.length;
        const modalImg = document.getElementById('modalImage');
        if (modalImg) modalImg.src = window.obrasModalImages[window.obrasModalCurrentIndex];
      }
    });
  }

  if (modalNext) {
    modalNext.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.obrasModalImages.length > 1) {
        window.obrasModalCurrentIndex = (window.obrasModalCurrentIndex + 1) % window.obrasModalImages.length;
        const modalImg = document.getElementById('modalImage');
        if (modalImg) modalImg.src = window.obrasModalImages[window.obrasModalCurrentIndex];
      }
    });
  }

  // Lightbox Zoom functionality
  const lightBoxModal = document.getElementById('lightBoxModal');
  const lightBoxImage = document.getElementById('lightBoxImage');
  const lightBoxClose = document.querySelector('.lightbox-close');
  const lightBoxPrev = document.getElementById('lightBoxPrev');
  const lightBoxNext = document.getElementById('lightBoxNext');

  window.obrasLightBoxImages = [];
  window.obrasLightBoxCurrentIndex = 0;

  const updateLightBoxImage = () => {
    if (lightBoxImage && window.obrasLightBoxImages.length > 0) {
      lightBoxImage.src = window.obrasLightBoxImages[window.obrasLightBoxCurrentIndex];
      lightBoxImage.dataset.zoomLevel = '0';
      lightBoxImage.style.transform = 'scale(1)';
      lightBoxImage.style.transformOrigin = 'center center';
      lightBoxImage.style.cursor = 'zoom-in';
    }
  };

  const openLightBox = (imagesArray) => {
    if (lightBoxModal && lightBoxImage) {
      window.obrasLightBoxImages = imagesArray;
      window.obrasLightBoxCurrentIndex = 0;

      if (lightBoxPrev && lightBoxNext) {
        if (window.obrasLightBoxImages.length > 1) {
          lightBoxPrev.style.display = 'block';
          lightBoxNext.style.display = 'block';
        } else {
          lightBoxPrev.style.display = 'none';
          lightBoxNext.style.display = 'none';
        }
      }

      updateLightBoxImage();
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

  if (lightBoxPrev) {
    lightBoxPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.obrasLightBoxImages.length > 1) {
        window.obrasLightBoxCurrentIndex = (window.obrasLightBoxCurrentIndex - 1 + window.obrasLightBoxImages.length) % window.obrasLightBoxImages.length;
        updateLightBoxImage();
      }
    });
  }

  if (lightBoxNext) {
    lightBoxNext.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.obrasLightBoxImages.length > 1) {
        window.obrasLightBoxCurrentIndex = (window.obrasLightBoxCurrentIndex + 1) % window.obrasLightBoxImages.length;
        updateLightBoxImage();
      }
    });
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
      document.body.classList.remove('obras-modal-open');
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

  // ── Sticky nav: highlight active section ───────────────
  const catPills = document.querySelectorAll('.cat-pill');
  if (catPills.length && 'IntersectionObserver' in window) {
    const sectionIds = ['pasteles', 'gatos', 'paisajes', 'Autorretratos', 'digital', 'ilustraciones', 'videos'];
    const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          catPills.forEach(p => p.classList.remove('active'));
          const activeId = entry.target.id;
          const pill = document.querySelector(`.cat-pill[data-section="${activeId}"]`);
          if (pill) {
            pill.classList.add('active');
            // Scroll pill into view within nav
            pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
        }
      });
    }, { rootMargin: '-40px 0px -60% 0px', threshold: 0 });

    sections.forEach(s => observer.observe(s));
  }

  // Smooth scroll for nav pills
  document.querySelectorAll('.cat-pill').forEach(pill => {
    pill.addEventListener('click', e => {
      e.preventDefault();
      const id = pill.dataset.section;
      const target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // ── Language switching ───────────────────────────────────
  const applyLang = (lang) => {
    // 1. Save preference
    localStorage.setItem('preferredLanguage', lang);
    // 2. Call i18n.js changeLanguage if available (handles data-i18n elements)
    if (window.changeLanguage) {
      window.changeLanguage(lang);
    } else {
      // Fallback: update html lang attribute and data-i18n elements manually
      document.documentElement.lang = lang;
    }
    // 3. Update active state on our buttons
    document.querySelectorAll('.cat-lang-btn').forEach(btn => {
      btn.classList.toggle('active-lang', btn.dataset.lang === lang);
    });
    // 4. Update modal buy button text
    const buyBtn = document.getElementById('modalBuyBtn');
    if (buyBtn) {
      buyBtn.textContent = lang === 'en' ? 'INQUIRE / BUY' : 'CONSULTAR / COMPRAR';
    }
  };

  // Wire up buttons using data-lang attribute
  document.querySelectorAll('.cat-lang-btn').forEach(btn => {
    btn.addEventListener('click', () => applyLang(btn.dataset.lang));
  });

  // Apply saved language on load
  const savedLang = localStorage.getItem('preferredLanguage') || 'es';
  applyLang(savedLang);

});