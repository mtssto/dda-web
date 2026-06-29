document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('imageModal');
  const modalImage = document.getElementById('modalImage');
  const modalTitle = document.getElementById('modalTitle');
  const modalTechnique = document.getElementById('modalTechnique');
  const modalDimensions = document.getElementById('modalDimensions');
  const modalBuyBtn = document.getElementById('modalBuyBtn');
  const modalClose = document.querySelector('.modal-close');

  // Load artworks from API (fallback to products.js)
  let obrasDataset = [];
  loadObrasDataset().then((items) => {
    obrasDataset = items;
    renderPortfolio(obrasDataset);
    initModalTriggers(obrasDataset);
    setupCategoryNavObserver();
    initObrasVideos();
  });

  // Share buttons in modal
  const shareWrap = document.getElementById('obrasShare');
  const shareWhatsApp = document.getElementById('obrasShareWhatsApp');
  const shareTwitter = document.getElementById('obrasShareTwitter');
  const shareFacebook = document.getElementById('obrasShareFacebook');
  const shareCopy = document.getElementById('obrasShareCopy');
  let currentShareUrl = '';
  let currentShareTitle = '';

  // Shop-only categories map to the nearest portfolio section.
  const PORTFOLIO_CATEGORY_ALIASES = {
    paisaje: 'paisajes',
    simbolico: 'pasteles',
    texto: 'ilustraciones',
    obras: 'pasteles',
    retrato: 'Autorretratos',
    abstracto: 'digital',
    figurativo: 'pasteles',
    paisajes: 'paisajes',
    pasteles: 'pasteles',
    gatos: 'gatos',
    digital: 'digital',
    ilustraciones: 'ilustraciones',
    autorretratos: 'Autorretratos'
  };

  function resolvePortfolioCategory(category) {
    const raw = String(category || '').trim();
    if (!raw) return 'pasteles';
    if (PORTFOLIO_CATEGORY_ALIASES[raw]) return PORTFOLIO_CATEGORY_ALIASES[raw];
    const lower = raw.toLowerCase();
    if (PORTFOLIO_CATEGORY_ALIASES[lower]) return PORTFOLIO_CATEGORY_ALIASES[lower];
    return raw;
  }

  function normalizeProduct(p) {
    const images = (p.images || []).map((img) => {
      if (!img) return '';
      if (typeof img === 'string') return img;
      return img.filePath || img.url || img.imageUrl || '';
    }).filter(Boolean);

    const primaryImageObj = (p.images || []).find((img) => img && (img.isPrimary === true || img.primary === true));
    const primaryFromObj = primaryImageObj
      ? (typeof primaryImageObj === 'string' ? primaryImageObj : primaryImageObj.filePath || primaryImageObj.url || '')
      : '';
    const primary = primaryFromObj || p.image || p.imageUrl || images[0] || '';

    return {
      id: p.slug || p.id || '',
      slug: p.slug || p.id || '',
      title: p.title || '',
      technique: p.technique || 'Consultar técnica',
      dimensions: p.dimensions || 'Consultar medidas',
      year: p.year || 'Consultar año',
      category: resolvePortfolioCategory(p.category),
      image: primary,
      images: images.length ? images : (primary ? [primary] : []),
      sold: !!p.sold
    };
  }

  function resolveImagePath(path) {
    if (!path) return '';
    if (typeof DDAImages !== 'undefined' && typeof DDAImages.resolveImageUrl === 'function') {
      return DDAImages.resolveImageUrl(path, window.location.href);
    }
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const mediaBase = (window.DDA_MEDIA_BASE || '').replace(/\/$/, '');
    if (mediaBase && (path.startsWith('/uploads/') || path.startsWith('uploads/'))) {
      return mediaBase + (path.startsWith('/') ? path : '/' + path);
    }
    if (path.startsWith('/')) return path;
    return path;
  }

  async function loadObrasDataset() {
    const API = window.DDA_API_BASE || '/api';
    try {
      const res = await fetch(API + '/artworks?page=0&size=200&sort=id,desc', {
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error('api');
      const data = await res.json();
      const content = data.content || data;
      if (Array.isArray(content) && content.length) {
        return content.map(normalizeProduct);
      }
    } catch (e) {
      // fallback
    }
    if (window.products && Array.isArray(window.products)) {
      return window.products.map(normalizeProduct);
    }
    return [];
  }

  const PORTFOLIO_SECTION_ORDER = [
    'pasteles', 'gatos', 'paisajes', 'Autorretratos', 'digital', 'ilustraciones'
  ];

  function renderPortfolio(dataset) {
    if (!dataset || !dataset.length) return;

    const grid = document.getElementById('obrasMasonryGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const byCategory = {};
    dataset.forEach((product) => {
      const key = resolvePortfolioCategory(product.category);
      if (!byCategory[key]) byCategory[key] = [];
      byCategory[key].push(product);
    });

    let revealIndex = 0;

    PORTFOLIO_SECTION_ORDER.forEach((sectionKey) => {
      const items = byCategory[sectionKey] || [];
      const navPill = document.querySelector('.cat-pill[data-section="' + sectionKey + '"]');
      if (!items.length) {
        if (navPill) navPill.hidden = true;
        return;
      }
      if (navPill) navPill.hidden = false;

      items.forEach((product, indexInSection) => {
        const imagePath = resolveImagePath(product.image || '');
        if (!imagePath) return;

        const item = document.createElement('div');
        item.className = 'masonry-item grid-modal-trigger reveal-item';
        item.style.setProperty('--reveal-delay', Math.min(revealIndex * 50, 400) + 'ms');
        revealIndex += 1;

        if (indexInSection === 0) {
          item.id = sectionKey;
          item.dataset.sectionAnchor = sectionKey;
        }

        item.dataset.dimensions = (product.dimensions && product.dimensions !== 'Consultar medidas')
          ? product.dimensions : 'Consultar medidas';
        item.dataset.technique = (product.technique && product.technique !== 'Consultar técnica')
          ? product.technique : 'Consultar técnica';
        item.dataset.year = (product.year && product.year !== 'Consultar año')
          ? product.year : 'Consultar año';
        item.dataset.title = product.title;
        item.dataset.slug = product.slug || product.id || '';
        item.dataset.waLink = 'https://wa.me/5491160139563?text=Hola,%20quisiera%20consultar%20por%20la%20obra:%20' + encodeURIComponent(product.title);

        if (product.images && product.images.length > 1) {
          item.dataset.images = JSON.stringify(product.images);
        }

        const soldBadge = product.sold
          ? '<span class="artwork-badge artwork-badge--sold">Vendida</span>'
          : '';

        const safeTitle = escapeHtml(product.title || '');
        const safeDims = escapeHtml(item.dataset.dimensions);
        const safeTech = escapeHtml(item.dataset.technique);
        const safeYear = escapeHtml(item.dataset.year);

        item.innerHTML =
          '<div class="artwork-card">' +
            '<div class="artwork-media artwork-media--pending">' +
              '<img alt="' + safeTitle + '" data-src="' + imagePath + '" decoding="async" />' +
              soldBadge +
            '</div>' +
            '<div class="masonry-overlay">' +
              '<div class="overlay-content">' +
                '<h3 class="overlay-title">' + safeTitle + '</h3>' +
                '<p class="overlay-details">' + safeDims + '<br>' + safeTech + '<br>' + safeYear + '</p>' +
                '<button type="button" class="btn-grid-details">DETALLES</button>' +
              '</div>' +
            '</div>' +
          '</div>';

        grid.appendChild(item);
      });
    });

    setupRevealOnScroll();
  }

  function loadLazyImage(img) {
    if (!img || img.dataset.loaded === '1') return;
    const src = img.dataset.src || img.getAttribute('data-src');
    if (!src) return;
    img.dataset.loaded = '1';

    const media = img.closest('.artwork-media');
    const onDone = () => {
      img.classList.add('is-loaded');
      if (media) media.classList.remove('artwork-media--pending');
      img.closest('.masonry-item')?.classList.add('is-loaded');
    };

    img.addEventListener('load', onDone, { once: true });
    img.addEventListener('error', onDone, { once: true });
    img.src = src;
    if (img.complete && img.naturalWidth > 0) onDone();
  }

  function setupRevealOnScroll() {
    const items = document.querySelectorAll('.masonry-item.reveal-item');
    if (!items.length) return;

    const revealItem = (el) => {
      const img = el.querySelector('img[data-src]');
      if (img) loadLazyImage(img);
      el.classList.add('is-visible');
    };

    if (!('IntersectionObserver' in window)) {
      items.forEach(revealItem);
      return;
    }

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealItem(entry.target);
        obs.unobserve(entry.target);
      });
    }, { root: null, rootMargin: '120px 0px 80px', threshold: 0.01 });

    items.forEach((el) => io.observe(el));
  }

  function setupSectionReveal() {
    const sections = document.querySelectorAll('.container > section[id]');
    if (!sections.length) return;

    if (!('IntersectionObserver' in window)) {
      sections.forEach((s) => s.classList.add('is-inview'));
      return;
    }

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-inview');
        obs.unobserve(entry.target);
      });
    }, { root: null, rootMargin: '-8% 0px -55% 0px', threshold: 0 });

    sections.forEach((s) => io.observe(s));
  }

  const OBRAS_VIDEOS = [
    { src: 'videos/ddavideo1.mp4', title: 'Proceso creativo I' },
    { src: 'videos/dda3.mp4', title: 'Proceso creativo II' },
    { src: 'videos/dda4.mp4', title: 'Proceso creativo III' },
    { src: 'videos/dda5.mp4', title: 'Proceso creativo IV' },
    { src: 'videos/dda6.mp4', title: 'Proceso creativo V' },
    { src: 'videos/dda7.mp4', title: 'Proceso creativo VI' },
    { src: 'videos/dda8.mp4', title: 'Proceso creativo VII' },
    { src: 'videos/dda9.mp4', title: 'Proceso creativo VIII' }
  ];

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function loadLazyVideo(video) {
    if (!video || video.dataset.loaded === '1') return;
    const src = video.dataset.src;
    if (!src) return;
    video.dataset.loaded = '1';
    video.src = src;
    video.preload = 'metadata';
  }

  function initObrasVideos() {
    const grid = document.getElementById('obrasVideoGrid');
    const section = document.getElementById('videos');
    if (!grid || !OBRAS_VIDEOS.length) {
      if (section) section.hidden = true;
      const pill = document.querySelector('.cat-pill[data-section="videos"]');
      if (pill) pill.hidden = true;
      return;
    }

    let playingVideo = null;

    OBRAS_VIDEOS.forEach((item, i) => {
      const card = document.createElement('article');
      card.className = 'video-card reveal-video';
      card.style.setProperty('--reveal-delay', Math.min(i * 80, 480) + 'ms');

      card.innerHTML =
        '<div class="video-card__inner">' +
          '<div class="video-card__media">' +
            '<video class="video-card__player" playsinline preload="none" data-src="' + escapeHtml(item.src) + '"></video>' +
            '<button type="button" class="video-card__play" aria-label="Reproducir ' + escapeHtml(item.title) + '">' +
              '<span class="video-card__play-icon" aria-hidden="true"></span>' +
            '</button>' +
          '</div>' +
          (item.title ? '<p class="video-card__title">' + escapeHtml(item.title) + '</p>' : '') +
        '</div>';

      const video = card.querySelector('video');
      const playBtn = card.querySelector('.video-card__play');

      const pauseOthers = () => {
        grid.querySelectorAll('.video-card.is-playing').forEach((other) => {
          if (other === card) return;
          const v = other.querySelector('video');
          if (v) {
            v.pause();
            v.controls = false;
          }
          other.classList.remove('is-playing');
        });
      };

      const startPlayback = () => {
        pauseOthers();
        card.classList.add('is-playing');
        video.controls = true;
        playingVideo = video;
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {
            card.classList.remove('is-playing');
            video.controls = false;
          });
        }
      };

      playBtn.addEventListener('click', () => {
        loadLazyVideo(video);
        if (video.readyState >= 2) {
          startPlayback();
        } else {
          video.addEventListener('loadeddata', startPlayback, { once: true });
        }
      });

      video.addEventListener('ended', () => {
        card.classList.remove('is-playing');
        video.controls = false;
        if (playingVideo === video) playingVideo = null;
      });

      grid.appendChild(card);
    });

    const cards = grid.querySelectorAll('.video-card');
    const revealCard = (card) => {
      const video = card.querySelector('video[data-src]');
      if (video) loadLazyVideo(video);
      card.classList.add('is-visible');
    };

    if (!('IntersectionObserver' in window)) {
      cards.forEach(revealCard);
      return;
    }

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealCard(entry.target);
        obs.unobserve(entry.target);
      });
    }, { root: null, rootMargin: '100px 0px', threshold: 0.08 });

    cards.forEach((card) => io.observe(card));
  }

  function getShareUrlForProduct(product) {
    const slug = product && (product.slug || product.id);
    if (!slug) return '';
    // Share the shop detail page (better for commerce) from portfolio
    return window.location.origin + '/shop/obra.html?id=' + encodeURIComponent(slug);
  }

  function showShareToast(text) {
    const el = document.createElement('div');
    el.className = 'obras-share-toast';
    el.textContent = text;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('visible'));
    setTimeout(() => {
      el.classList.remove('visible');
      setTimeout(() => el.remove(), 250);
    }, 1800);
  }

  function updateShareUI(title, url) {
    currentShareTitle = title || '';
    currentShareUrl = url || '';
    if (!shareWrap) return;
    shareWrap.hidden = !currentShareUrl;
  }

  function initModalTriggers(dataset) {
    const triggers = document.querySelectorAll('.grid-modal-trigger');
    triggers.forEach(trigger => {
      // ... existing trigger logic ...
      // Dynamically inject hover overlay inside artwork card
      const card = trigger.querySelector('.artwork-card');
      if (card && !card.querySelector('.masonry-overlay')) {
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
            <button type="button" class="btn-grid-details">DETALLES</button>
          </div>
        `;
        card.appendChild(overlay);
      }

      trigger.addEventListener('click', (e) => {
        // Find current image inside trigger
        const img = trigger.querySelector('img');
        const imgSrcToMatch = img ? (img.getAttribute('src') || img.src) : '';

        let productData = null;
        if (imgSrcToMatch && dataset && dataset.length) {
          const filename = imgSrcToMatch.split('/').pop().split('?')[0];
          const found = dataset.find(p => {
            return (p.image && p.image.includes(filename)) ||
              (p.images && p.images.some(i => i.includes(filename)));
          });

          if (found) {
            productData = {
              id: found.id,
              slug: found.slug,
              title: found.title,
              technique: found.technique,
              dimensions: found.dimensions,
              year: found.year,
              images: (found.images && found.images.length) ? found.images.map(resolveImagePath) : [resolveImagePath(found.image)]
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

        // Share links (prefer slug -> shop obra page)
        const shareUrl = getShareUrlForProduct(productData || { slug: trigger.dataset.slug });
        const shareTitle = productData ? productData.title : (trigger.dataset.title || '');
        updateShareUI(shareTitle, shareUrl);

        // Show modal
        if (modal) {
          modal.classList.add('active');
          document.body.classList.add('obras-modal-open');
          document.body.style.overflow = 'hidden';
        }
      });
    });
  }

  if (shareWhatsApp) {
    shareWhatsApp.addEventListener('click', function () {
      if (!currentShareUrl) return;
      const txt = (currentShareTitle ? currentShareTitle + '\n' : '') + currentShareUrl;
      window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank');
    });
  }
  if (shareTwitter) {
    shareTwitter.addEventListener('click', function () {
      if (!currentShareUrl) return;
      const t = currentShareTitle || 'Obra';
      window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(t) + '&url=' + encodeURIComponent(currentShareUrl), '_blank');
    });
  }
  if (shareFacebook) {
    shareFacebook.addEventListener('click', function () {
      if (!currentShareUrl) return;
      window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(currentShareUrl), '_blank');
    });
  }
  if (shareCopy) {
    shareCopy.addEventListener('click', function () {
      if (!currentShareUrl) return;
      const fallback = function () {
        showShareToast('Enlace copiado');
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(currentShareUrl).then(fallback).catch(fallback);
      } else {
        fallback();
      }
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

  function setupCategoryNavObserver() {
    const catPills = document.querySelectorAll('.cat-pill');
    if (!catPills.length || !('IntersectionObserver' in window)) return;

    const sectionIds = ['pasteles', 'gatos', 'paisajes', 'Autorretratos', 'digital', 'ilustraciones', 'videos'];
    const anchors = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
    if (!anchors.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        catPills.forEach((p) => p.classList.remove('active'));
        const activeId = entry.target.id;
        const pill = document.querySelector('.cat-pill[data-section="' + activeId + '"]');
        if (pill) {
          pill.classList.add('active');
          pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      });
    }, { rootMargin: '-72px 0px -55% 0px', threshold: 0 });

    anchors.forEach((el) => observer.observe(el));
  }

  document.querySelectorAll('.cat-pill').forEach((pill) => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      const id = pill.dataset.section;
      const target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

});