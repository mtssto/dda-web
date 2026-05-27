/**
 * DDA Admin — Artwork management dashboard.
 * Requires auth.js to be loaded first.
 */
(function () {
    'use strict';

    if (!DDAAuth.requireAdmin()) return;

    // ── State ────────────────────────────────────
    var state = {
        artworks: [],
        categories: [],
        page: 0,
        totalPages: 0,
        totalElements: 0,
        search: '',
        category: '',
        soldFilter: '',
        editingId: null
    };

    // ── DOM refs ─────────────────────────────────
    var tableBody = document.getElementById('artworkTableBody');
    var pagination = document.getElementById('adminPagination');
    var searchInput = document.getElementById('adminSearch');
    var categoryFilter = document.getElementById('adminCategoryFilter');
    var soldFilter = document.getElementById('adminSoldFilter');
    var addBtn = document.getElementById('addArtworkBtn');
    var logoutBtn = document.getElementById('logoutBtn');
    var usernameEl = document.getElementById('adminUsername');

    // Modal
    var modal = document.getElementById('artworkModal');
    var modalTitle = document.getElementById('modalTitle');
    var artworkForm = document.getElementById('artworkForm');
    var formError = document.getElementById('formError');
    var modalSave = document.getElementById('modalSave');
    var imageInput = document.getElementById('artImages');
    var imagePreview = document.getElementById('artImagesPreview');
    var imageUploadStatus = document.getElementById('imageUploadStatus');

    // Delete modal
    var deleteModal = document.getElementById('deleteModal');
    var deleteNameEl = document.getElementById('deleteArtworkName');
    var deleteConfirmBtn = document.getElementById('deleteConfirmBtn');
    var pendingDeleteId = null;

    // ── Init ─────────────────────────────────────
    var user = DDAAuth.getUser();
    if (usernameEl && user) usernameEl.textContent = user.username;

    logoutBtn.addEventListener('click', function () { DDAAuth.logout(); });

    loadCategories();
    loadArtworks();
    loadStats();
    loadNewsletterCount();
    initNewsletter();

    // ── Event listeners ──────────────────────────
    var searchTimer;
    searchInput.addEventListener('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
            state.search = searchInput.value.trim();
            state.page = 0;
            loadArtworks();
        }, 300);
    });

    categoryFilter.addEventListener('change', function () {
        state.category = this.value;
        state.page = 0;
        loadArtworks();
    });

    soldFilter.addEventListener('change', function () {
        state.soldFilter = this.value;
        state.page = 0;
        loadArtworks();
    });

    addBtn.addEventListener('click', function () { openModal(null); });

    // Modal close buttons
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalCancel').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
    });

    // Delete modal close buttons
    document.getElementById('deleteModalClose').addEventListener('click', closeDeleteModal);
    document.getElementById('deleteCancelBtn').addEventListener('click', closeDeleteModal);
    deleteModal.addEventListener('click', function (e) {
        if (e.target === deleteModal) closeDeleteModal();
    });

    deleteConfirmBtn.addEventListener('click', confirmDelete);

    // Form submit
    artworkForm.addEventListener('submit', function (e) {
        e.preventDefault();
        saveArtwork();
    });

    if (imageInput) {
        imageInput.addEventListener('change', function () {
            renderImagePreview(null, getSelectedImageFiles());
        });
    }

    if (imagePreview) {
        imagePreview.addEventListener('click', function (e) {
            var deleteBtn = e.target.closest('[data-delete-image]');
            if (!deleteBtn) return;
            var imageId = deleteBtn.getAttribute('data-delete-image');
            if (!imageId || !confirm('¿Eliminar esta imagen?')) return;

            deleteBtn.disabled = true;
            deleteBtn.textContent = '…';

            fetch(getApiBaseUrl() + '/images/' + imageId, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + getAuthToken() }
            }).then(function (res) {
                if (!res.ok) throw new Error('No se pudo eliminar');
                var card = deleteBtn.closest('.image-preview-card');
                if (card) card.remove();
                loadArtworks();
            }).catch(function (err) {
                alert(err.message || 'Error al eliminar imagen');
                deleteBtn.disabled = false;
                deleteBtn.textContent = '×';
            });
        });
    }

    // Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (!modal.hidden) closeModal();
            if (!deleteModal.hidden) closeDeleteModal();
        }
    });

    // ── API calls ────────────────────────────────
    function loadCategories() {
        DDAAuth.apiFetch('/categories')
            .then(function (res) { return res.json(); })
            .then(function (cats) {
                state.categories = cats;
                renderCategoryOptions();
            })
            .catch(function () { /* silently fail */ });
    }

    function loadArtworks() {
        var path;
        if (state.search) {
            path = '/artworks/search?q=' + encodeURIComponent(state.search) + '&page=' + state.page + '&size=20';
        } else if (state.category) {
            path = '/artworks/category/' + encodeURIComponent(state.category) + '?page=' + state.page + '&size=20';
        } else {
            path = '/artworks?page=' + state.page + '&size=20&sort=id,desc';
        }

        tableBody.innerHTML = '<tr class="table-loading"><td colspan="8">Cargando obras...</td></tr>';

        DDAAuth.apiFetch(path)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                state.artworks = data.content || [];
                var pm = data.page || data;
                state.totalPages = pm.totalPages || 0;
                state.totalElements = pm.totalElements || 0;
                renderTable();
                renderPagination();
            })
            .catch(function (err) {
                tableBody.innerHTML = '<tr class="table-loading"><td colspan="8">Error al cargar obras</td></tr>';
            });
    }

    function saveArtwork() {
        var title = document.getElementById('artTitle').value.trim();
        if (!title) {
            formError.textContent = 'El título es obligatorio';
            formError.hidden = false;
            return;
        }

        var body = {
            title: title,
            category: document.getElementById('artCategory').value || null,
            technique: document.getElementById('artTechnique').value.trim() || null,
            dimensions: document.getElementById('artDimensions').value.trim() || null,
            price: document.getElementById('artPrice').value.trim() || null,
            year: document.getElementById('artYear').value.trim() || null,
            description: document.getElementById('artDescription').value.trim() || null,
            sold: document.getElementById('artSold').checked
        };

        var selectedImages = getSelectedImageFiles();

        var btnText = modalSave.querySelector('.btn-text');
        var btnLoader = modalSave.querySelector('.btn-loader');
        btnText.hidden = true;
        btnLoader.hidden = false;
        modalSave.disabled = true;
        formError.hidden = true;
        setUploadStatus('', null, true);

        var isEdit = state.editingId !== null;
        var method = isEdit ? 'PUT' : 'POST';
        var path = isEdit ? '/artworks/' + state.editingId : '/artworks';

        DDAAuth.apiFetch(path, {
            method: method,
            body: JSON.stringify(body)
        })
        .then(function (res) {
            if (!res.ok) return res.json().then(function (d) { throw new Error(d.message || 'Error al guardar'); });
            return res.json();
        })
        .then(function (savedArtwork) {
            if (!selectedImages.length) return savedArtwork;

            setUploadStatus('Subiendo ' + selectedImages.length + ' imagen(es) a Cloudinary...', null, false);

            return uploadArtworkImages(savedArtwork.id, selectedImages).then(function () {
                return savedArtwork;
            });
        })
        .then(function () {
            setUploadStatus('Obra guardada correctamente.', 'success', false);
            closeModal();
            loadArtworks();
            loadCategories();
            loadStats();
        })
        .catch(function (err) {
            formError.textContent = err.message || 'Error al guardar la obra';
            formError.hidden = false;
            setUploadStatus(err.message || 'Error al subir imágenes', 'error', false);
        })
        .finally(function () {
            btnText.hidden = false;
            btnLoader.hidden = true;
            modalSave.disabled = false;
        });
    }

    function getSelectedImageFiles() {
        return imageInput ? Array.from(imageInput.files || []) : [];
    }

    function uploadArtworkImages(artworkId, files) {
        var chain = Promise.resolve();

        files.forEach(function (file, index) {
            chain = chain.then(function () {
                setUploadStatus('Subiendo imagen ' + (index + 1) + ' de ' + files.length + ': ' + file.name, null, false);

                var formData = new FormData();
                formData.append('file', file);
                formData.append('primary', String(index === 0 && state.editingId === null));

                return fetch(getApiBaseUrl() + '/artworks/' + artworkId + '/images', {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + getAuthToken() },
                    body: formData
                }).then(function (res) {
                    if (!res.ok) {
                        return res.text().then(function (message) {
                            throw new Error(message || ('Error al subir ' + file.name));
                        });
                    }
                    return res.json();
                });
            });
        });

        return chain;
    }

    function getAuthToken() {
        if (typeof DDAAuth !== 'undefined' && typeof DDAAuth.getToken === 'function') {
            return DDAAuth.getToken();
        }

        return localStorage.getItem('dda_token') ||
            localStorage.getItem('token') ||
            localStorage.getItem('authToken') ||
            localStorage.getItem('dda_auth_token') ||
            '';
    }

    function getApiBaseUrl() {
        if (window.DDA_API_BASE) return normalizeApiBase(window.DDA_API_BASE);
        if (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) return normalizeApiBase(window.APP_CONFIG.API_BASE_URL);
        if (window.API_BASE_URL) return normalizeApiBase(window.API_BASE_URL);
        return '/api';
    }

    function normalizeApiBase(value) {
        var clean = String(value || '').replace(/\/$/, '');
        if (!clean) return '/api';
        return clean.endsWith('/api') ? clean : clean + '/api';
    }

    function setUploadStatus(message, type, hidden) {
        if (!imageUploadStatus) return;

        imageUploadStatus.hidden = !!hidden || !message;
        imageUploadStatus.textContent = message || '';
        imageUploadStatus.classList.remove('is-success', 'is-error');

        if (type === 'success') imageUploadStatus.classList.add('is-success');
        if (type === 'error') imageUploadStatus.classList.add('is-error');
    }

    function deleteArtwork(id) {
        DDAAuth.apiFetch('/artworks/' + id, { method: 'DELETE' })
            .then(function (res) {
                if (!res.ok) throw new Error('Error al eliminar');
                closeDeleteModal();
                loadArtworks();
                loadCategories();
                loadStats();
            })
            .catch(function (err) {
                alert(err.message || 'Error al eliminar la obra');
                closeDeleteModal();
            });
    }

    function toggleSold(id) {
        DDAAuth.apiFetch('/artworks/' + id + '/sold', { method: 'PATCH' })
            .then(function (res) {
                if (!res.ok) throw new Error('Error');
                return res.json();
            })
            .then(function () { loadArtworks(); loadStats(); })
            .catch(function () { /* silently fail */ });
    }

    // ── Rendering ────────────────────────────────
    function renderTable() {
        var filtered = state.artworks;

        if (state.soldFilter === 'available') {
            filtered = filtered.filter(function (a) { return !a.sold; });
        } else if (state.soldFilter === 'sold') {
            filtered = filtered.filter(function (a) { return a.sold; });
        }

        if (!filtered.length) {
            tableBody.innerHTML = '<tr class="table-loading"><td colspan="8">No se encontraron obras</td></tr>';
            return;
        }

        tableBody.innerHTML = filtered.map(function (art) {
            var imgSrc = getArtworkThumbnailUrl(art);
            var imgTag = imgSrc
                ? '<img src="' + escapeHtml(imgSrc) + '" alt="' + escapeHtml(art.title) + '" class="table-thumb" loading="lazy" decoding="async">'
                : '<div class="table-thumb" style="background:#eee"></div>';

            return '<tr>' +
                '<td>' + imgTag + '</td>' +
                '<td><strong>' + escapeHtml(art.title) + '</strong>' +
                    (art.year ? '<br><small style="color:#999">' + escapeHtml(art.year) + '</small>' : '') +
                '</td>' +
                '<td>' + escapeHtml(art.category || '-') + '</td>' +
                '<td>' + escapeHtml(art.technique || '-') + '</td>' +
                '<td>' + escapeHtml(art.dimensions || '-') + '</td>' +
                '<td>' + escapeHtml(art.price || 'Consultar') + '</td>' +
                '<td><span class="badge ' + (art.sold ? 'badge-sold' : 'badge-available') + '">' +
                    (art.sold ? 'Vendida' : 'Disponible') + '</span></td>' +
                '<td><div class="action-btns">' +
                    '<button class="btn-icon" onclick="adminEditArtwork(' + art.id + ')" title="Editar">' +
                        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                        '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>' +
                        '<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
                    '</button>' +
                    '<button class="btn-icon" onclick="adminToggleSold(' + art.id + ')" title="' + (art.sold ? 'Marcar disponible' : 'Marcar vendida') + '">' +
                        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                        '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' +
                    '</button>' +
                    '<button class="btn-icon btn-icon-danger" onclick="adminDeleteArtwork(' + art.id + ',\'' + escapeHtml(art.title).replace(/'/g, "\\'") + '\')" title="Eliminar">' +
                        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                        '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
                    '</button>' +
                '</div></td>' +
            '</tr>';
        }).join('');
    }

    function renderPagination() {
        if (state.totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        var html = '<button class="page-btn" onclick="adminGoToPage(' + (state.page - 1) + ')"' +
            (state.page === 0 ? ' disabled' : '') + '>&laquo;</button>';

        for (var i = 0; i < state.totalPages; i++) {
            if (state.totalPages > 7 && Math.abs(i - state.page) > 2 && i !== 0 && i !== state.totalPages - 1) {
                if (i === 1 || i === state.totalPages - 2) html += '<span class="page-info">...</span>';
                continue;
            }
            html += '<button class="page-btn' + (i === state.page ? ' active' : '') +
                '" onclick="adminGoToPage(' + i + ')">' + (i + 1) + '</button>';
        }

        html += '<button class="page-btn" onclick="adminGoToPage(' + (state.page + 1) + ')"' +
            (state.page >= state.totalPages - 1 ? ' disabled' : '') + '>&raquo;</button>';

        pagination.innerHTML = html;
    }

    function renderCategoryOptions() {
        var html = '<option value="">Todas las categorías</option>';
        state.categories.forEach(function (cat) {
            html += '<option value="' + escapeHtml(cat.name) + '">' +
                escapeHtml(cat.name) + ' (' + cat.artworkCount + ')</option>';
        });
        categoryFilter.innerHTML = html;

        // Also update modal category select
        var modalCat = document.getElementById('artCategory');
        if (modalCat) {
            var modalHtml = '<option value="">Sin categoría</option>';
            state.categories.forEach(function (cat) {
                modalHtml += '<option value="' + escapeHtml(cat.name) + '">' + escapeHtml(cat.name) + '</option>';
            });
            modalCat.innerHTML = modalHtml;
        }
    }

    function loadStats() {
        DDAAuth.apiFetch('/admin/stats')
            .then(function (res) { return res.json(); })
            .then(function (stats) {
                document.getElementById('statTotal').textContent = stats.totalArtworks || 0;
                document.getElementById('statAvailable').textContent = stats.availableArtworks || 0;
                document.getElementById('statSold').textContent = stats.soldArtworks || 0;
                document.getElementById('statCategories').textContent = state.categories.length || 0;

                var viewsEl = document.getElementById('statViews');
                var likesEl = document.getElementById('statLikes');
                var usersEl = document.getElementById('statUsers');
                var pendingEl = document.getElementById('statPendingComments');
                if (viewsEl) viewsEl.textContent = stats.totalViews || 0;
                if (likesEl) likesEl.textContent = stats.totalLikes || 0;
                if (usersEl) usersEl.textContent = stats.totalUsers || 0;
                if (pendingEl) pendingEl.textContent = stats.pendingComments || 0;

                var popularSection = document.getElementById('adminPopular');
                var popularList = document.getElementById('popularArtworksList');
                var mostViewed = stats.mostViewed || [];
                if (popularSection && popularList && mostViewed.length > 0) {
                    popularSection.style.display = 'block';
                    popularList.innerHTML = '';
                    mostViewed.forEach(function (a) {
                        var card = document.createElement('div');
                        card.style.cssText = 'background:#f9f9f9;border:1px solid #eee;border-radius:6px;padding:12px 16px;min-width:160px;';
                        card.innerHTML = '<strong style="font-size:13px;display:block;margin-bottom:4px;">' + (a.title || '') + '</strong>'
                            + '<span style="font-size:12px;color:#888;">' + (a.viewCount || 0) + ' vistas · ' + (a.likesCount || 0) + ' likes</span>';
                        popularList.appendChild(card);
                    });
                }
            })
            .catch(function () {
                DDAAuth.apiFetch('/artworks?page=0&size=200&sort=id,desc')
                    .then(function (res) { return res.json(); })
                    .then(function (data) {
                        var all = data.content || [];
                        var soldCount = 0;
                        all.forEach(function (a) { if (a.sold) soldCount++; });
                        var pm2 = data.page || data;
                        var total = pm2.totalElements || all.length;
                        document.getElementById('statTotal').textContent = total;
                        document.getElementById('statAvailable').textContent = total - soldCount;
                        document.getElementById('statSold').textContent = soldCount;
                        document.getElementById('statCategories').textContent = state.categories.length || 0;
                    })
                    .catch(function () {});
            });
    }

    // ── Modal operations ─────────────────────────
    function openModal(artwork) {
        closeDeleteModal();
        state.editingId = artwork ? artwork.id : null;
        modalTitle.textContent = artwork ? 'Editar Obra' : 'Nueva Obra';
        formError.hidden = true;

        document.getElementById('artworkId').value = artwork ? artwork.id : '';
        document.getElementById('artTitle').value = artwork ? artwork.title : '';
        document.getElementById('artCategory').value = artwork ? (artwork.category || '') : '';
        document.getElementById('artTechnique').value = artwork ? (artwork.technique || '') : '';
        document.getElementById('artDimensions').value = artwork ? (artwork.dimensions || '') : '';
        document.getElementById('artPrice').value = artwork ? (artwork.price || '') : '';
        document.getElementById('artYear').value = artwork ? (artwork.year || '') : '';
        document.getElementById('artDescription').value = artwork ? (artwork.description || '') : '';
        document.getElementById('artSold').checked = artwork ? artwork.sold : false;

        if (imageInput) imageInput.value = '';
        setUploadStatus('', null, true);
        renderImagePreview(artwork, []);

        modal.hidden = false;
        document.body.style.overflow = 'hidden';
        document.getElementById('artTitle').focus();
    }

    function closeModal() {
        modal.hidden = true;
        document.body.style.overflow = '';
        state.editingId = null;
        artworkForm.reset();
        if (imageInput) imageInput.value = '';
        if (imagePreview) imagePreview.innerHTML = '';
        setUploadStatus('', null, true);
    }

    function closeDeleteModal() {
        deleteModal.hidden = true;
        document.body.style.overflow = '';
        pendingDeleteId = null;
    }

    function confirmDelete() {
        if (pendingDeleteId !== null) {
            deleteArtwork(pendingDeleteId);
        }
    }

    // ── Global functions for onclick ─────────────
    window.adminEditArtwork = function (id) {
        var art = state.artworks.find(function (a) { return a.id === id; });
        if (art) openModal(art);
    };

    window.adminDeleteArtwork = function (id, title) {
        closeModal();
        pendingDeleteId = id;
        deleteNameEl.textContent = title;
        deleteModal.hidden = false;
        document.body.style.overflow = 'hidden';
    };

    window.adminToggleSold = function (id) {
        toggleSold(id);
    };

    window.adminGoToPage = function (page) {
        if (page < 0 || page >= state.totalPages) return;
        state.page = page;
        loadArtworks();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ── Helpers ──────────────────────────────────
    function renderImagePreview(artwork, selectedFiles) {
        if (!imagePreview) return;

        var html = '';

        if (artwork && Array.isArray(artwork.images) && artwork.images.length > 0) {
            html += artwork.images.map(function (img, index) {
                var src = getImageUrl(img);
                if (!src) return '';
                var imgId = img.id || '';

                return '<div class="image-preview-card is-existing" data-image-id="' + imgId + '">' +
                    '<img src="' + escapeHtml(toCloudinaryThumb(src, 240)) + '" alt="Imagen actual ' + (index + 1) + '">' +
                    '<span class="preview-label">' + (img.isPrimary || img.primary ? 'Actual · Principal' : 'Actual') + '</span>' +
                    (imgId ? '<button type="button" class="preview-delete-btn" data-delete-image="' + imgId + '" title="Eliminar imagen">×</button>' : '') +
                '</div>';
            }).join('');
        }

        if (selectedFiles && selectedFiles.length > 0) {
            html += selectedFiles.map(function (file, index) {
                var url = URL.createObjectURL(file);

                return '<div class="image-preview-card">' +
                    '<img src="' + url + '" alt="' + escapeHtml(file.name) + '">' +
                    '<span class="preview-label">' + (index === 0 && state.editingId === null ? 'Nueva · Principal' : 'Nueva') + '</span>' +
                    '<span class="preview-filename">' + escapeHtml(file.name) + '</span>' +
                '</div>';
            }).join('');
        }

        imagePreview.innerHTML = html || '<p class="form-hint">No hay imágenes seleccionadas.</p>';
    }

    function getArtworkThumbnailUrl(artwork) {
        if (!artwork || !Array.isArray(artwork.images) || artwork.images.length === 0) return '';

        var primary = artwork.images.find(function (img) { return img && (img.isPrimary || img.primary); }) || artwork.images[0];
        return toCloudinaryThumb(getImageUrl(primary), 160);
    }

    function getImageUrl(image) {
        if (!image) return '';
        if (typeof image === 'string') return image;

        return image.thumbnailUrl ||
            image.previewUrl ||
            image.filePath ||
            image.url ||
            image.imageUrl ||
            '';
    }

    function toCloudinaryThumb(url, width) {
        if (!url || url.indexOf('res.cloudinary.com') === -1 || url.indexOf('/upload/') === -1) return url || '';

        if (/\/upload\/[^/]*(f_auto|q_auto|w_\d+|c_limit|c_fill)[^/]*\//.test(url)) return url;

        return url.replace('/upload/', '/upload/f_auto,q_auto,w_' + width + ',c_limit/');
    }

    function escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ── Newsletter ──────────────────────────────
    function loadNewsletterCount() {
        DDAAuth.apiFetch('/newsletter/subscribers')
            .then(function (res) { return res.json(); })
            .then(function (data) {
                var countEl = document.getElementById('newsletterCount');
                if (countEl) {
                    var n = data.count || 0;
                    countEl.textContent = n + ' suscriptor' + (n !== 1 ? 'es' : '');
                }
            })
            .catch(function () { /* silently fail */ });
    }

    // ── Stat Detail Panels ──────────────────────
    var statPanel = document.getElementById('statDetailPanel');
    var statTitle = document.getElementById('statDetailTitle');
    var statBody = document.getElementById('statDetailBody');
    var statCloseBtn = document.getElementById('statDetailClose');
    var activeStatType = null;
    var cachedStats = null;

    document.getElementById('adminStats').addEventListener('click', function (e) {
        var card = e.target.closest('.stat-clickable');
        if (!card) return;
        var type = card.dataset.stat;
        if (activeStatType === type) {
            closeStatPanel();
            return;
        }
        openStatPanel(type);
    });

    if (statCloseBtn) statCloseBtn.addEventListener('click', closeStatPanel);

    function closeStatPanel() {
        if (statPanel) statPanel.hidden = true;
        activeStatType = null;
        document.querySelectorAll('.stat-clickable.active').forEach(function (el) {
            el.classList.remove('active');
        });
    }

    function openStatPanel(type) {
        activeStatType = type;
        document.querySelectorAll('.stat-clickable.active').forEach(function (el) {
            el.classList.remove('active');
        });
        var card = document.querySelector('.stat-clickable[data-stat="' + type + '"]');
        if (card) card.classList.add('active');

        statPanel.hidden = false;
        statBody.innerHTML = '<div class="stat-detail-empty">Cargando...</div>';

        var titles = {
            total: 'Todas las Obras',
            available: 'Obras Disponibles',
            sold: 'Obras Vendidas',
            categories: 'Categorías',
            views: 'Vistas por Obra',
            likes: 'Likes por Obra',
            users: 'Usuarios Registrados',
            comments: 'Comentarios Pendientes'
        };
        statTitle.textContent = titles[type] || type;

        if (type === 'total' || type === 'available' || type === 'sold') {
            loadArtworkDetailView(type);
        } else if (type === 'categories') {
            loadCategoryDetailView();
        } else if (type === 'views' || type === 'likes') {
            loadEngagementDetailView(type);
        } else if (type === 'users') {
            loadUsersDetailView();
        } else if (type === 'comments') {
            loadCommentsDetailView();
        }
    }

    function loadArtworkDetailView(filter) {
        DDAAuth.apiFetch('/artworks?page=0&size=200&sort=id,desc')
            .then(function (res) { return res.json(); })
            .then(function (data) {
                var all = data.content || [];
                if (filter === 'available') all = all.filter(function (a) { return !a.sold; });
                if (filter === 'sold') all = all.filter(function (a) { return a.sold; });

                if (!all.length) {
                    statBody.innerHTML = '<div class="stat-detail-empty">No hay obras</div>';
                    return;
                }
                var html = '<table><thead><tr><th></th><th>Título</th><th>Categoría</th><th>Año</th><th>Estado</th></tr></thead><tbody>';
                all.forEach(function (a) {
                    var img = (a.images && a.images.length > 0) ? (a.images[0].filePath || a.images[0].url || '') : '';
                    var badge = a.sold
                        ? '<span class="stat-detail-badge stat-detail-badge--sold">Vendida</span>'
                        : '<span class="stat-detail-badge stat-detail-badge--available">Disponible</span>';
                    html += '<tr>'
                        + '<td>' + (img ? '<img src="' + img + '" class="stat-detail-thumb" alt="">' : '') + '</td>'
                        + '<td><strong>' + (a.title || '') + '</strong></td>'
                        + '<td>' + (a.category || '-') + '</td>'
                        + '<td>' + (a.year || '-') + '</td>'
                        + '<td>' + badge + '</td>'
                        + '</tr>';
                });
                html += '</tbody></table>';
                statBody.innerHTML = html;
            })
            .catch(function () {
                statBody.innerHTML = '<div class="stat-detail-empty">Error al cargar</div>';
            });
    }

    function loadCategoryDetailView() {
        DDAAuth.apiFetch('/artworks?page=0&size=200&sort=id,desc')
            .then(function (res) { return res.json(); })
            .then(function (data) {
                var all = data.content || [];
                var counts = {};
                all.forEach(function (a) {
                    var cat = a.category || 'Sin categoría';
                    counts[cat] = (counts[cat] || 0) + 1;
                });
                var entries = Object.keys(counts).map(function (k) { return { name: k, count: counts[k] }; });
                entries.sort(function (a, b) { return b.count - a.count; });
                var max = entries.length > 0 ? entries[0].count : 1;

                var html = '<table><thead><tr><th>Categoría</th><th>Obras</th><th></th></tr></thead><tbody>';
                entries.forEach(function (e) {
                    var pct = Math.round((e.count / max) * 100);
                    html += '<tr>'
                        + '<td><strong>' + e.name + '</strong></td>'
                        + '<td>' + e.count + '</td>'
                        + '<td style="width:50%"><div class="stat-detail-bar"><div class="stat-detail-bar-fill" style="width:' + pct + '%"></div></div></td>'
                        + '</tr>';
                });
                html += '</tbody></table>';
                statBody.innerHTML = html;
            })
            .catch(function () {
                statBody.innerHTML = '<div class="stat-detail-empty">Error al cargar</div>';
            });
    }

    function loadEngagementDetailView(type) {
        DDAAuth.apiFetch('/artworks?page=0&size=200&sort=id,desc')
            .then(function (res) { return res.json(); })
            .then(function (data) {
                var all = data.content || [];
                var field = type === 'views' ? 'viewCount' : 'likesCount';
                all.sort(function (a, b) { return (b[field] || 0) - (a[field] || 0); });
                var top = all.filter(function (a) { return (a[field] || 0) > 0; });
                if (!top.length) {
                    statBody.innerHTML = '<div class="stat-detail-empty">Sin datos de ' + (type === 'views' ? 'vistas' : 'likes') + ' todavía</div>';
                    return;
                }
                var max = top[0][field] || 1;
                var label = type === 'views' ? 'Vistas' : 'Likes';
                var html = '<table><thead><tr><th></th><th>Título</th><th>' + label + '</th><th></th></tr></thead><tbody>';
                top.forEach(function (a) {
                    var img = (a.images && a.images.length > 0) ? (a.images[0].filePath || a.images[0].url || '') : '';
                    var val = a[field] || 0;
                    var pct = Math.round((val / max) * 100);
                    html += '<tr>'
                        + '<td>' + (img ? '<img src="' + img + '" class="stat-detail-thumb" alt="">' : '') + '</td>'
                        + '<td><strong>' + (a.title || '') + '</strong></td>'
                        + '<td>' + val + '</td>'
                        + '<td style="width:40%"><div class="stat-detail-bar"><div class="stat-detail-bar-fill" style="width:' + pct + '%"></div></div></td>'
                        + '</tr>';
                });
                html += '</tbody></table>';
                statBody.innerHTML = html;
            })
            .catch(function () {
                statBody.innerHTML = '<div class="stat-detail-empty">Error al cargar</div>';
            });
    }

    function loadUsersDetailView() {
        var token = DDAAuth.getToken();
        var apiBase = window.DDA_API_BASE || '/api';
        fetch(apiBase + '/admin/users', {
            headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' }
        })
            .then(function (res) {
                if (!res.ok) throw new Error('not available');
                return res.json();
            })
            .then(function (users) {
                if (!users.length) {
                    statBody.innerHTML = '<div class="stat-detail-empty">No hay usuarios registrados</div>';
                    return;
                }
                var html = '<table><thead><tr><th>Usuario</th><th>Email</th><th>Rol</th><th>Email Verificado</th><th>Registrado</th></tr></thead><tbody>';
                users.forEach(function (u) {
                    var roleBadge = u.role === 'ADMIN'
                        ? '<span class="stat-detail-badge" style="background:#e3f2fd;color:#1565c0;">Admin</span>'
                        : '<span class="stat-detail-badge" style="background:#f5f5f5;color:#666;">Usuario</span>';
                    var verifiedBadge = u.emailVerified
                        ? '<span class="stat-detail-badge stat-detail-badge--available">Sí</span>'
                        : '<span class="stat-detail-badge stat-detail-badge--pending">No</span>';
                    var date = u.createdAt ? u.createdAt.substring(0, 10) : '-';
                    html += '<tr>'
                        + '<td><strong>' + (u.username || '-') + '</strong></td>'
                        + '<td>' + (u.email || '-') + '</td>'
                        + '<td>' + roleBadge + '</td>'
                        + '<td>' + verifiedBadge + '</td>'
                        + '<td>' + date + '</td>'
                        + '</tr>';
                });
                html += '</tbody></table>';
                statBody.innerHTML = html;
            })
            .catch(function () {
                var total = document.getElementById('statUsers').textContent || '0';
                statBody.innerHTML = '<div style="text-align:center;padding:24px 0;">'
                    + '<div style="font-size:48px;font-weight:600;">' + total + '</div>'
                    + '<div style="font-size:13px;color:#888;margin-top:8px;">usuarios registrados</div>'
                    + '<p style="font-size:12px;color:#aaa;margin-top:12px;">Desplegá el backend con el nuevo endpoint <code>/api/admin/users</code> para ver el detalle.</p>'
                    + '</div>';
            });
    }

    function loadCommentsDetailView() {
        DDAAuth.apiFetch('/admin/stats')
            .then(function (res) { return res.json(); })
            .then(function (stats) {
                var pending = stats.pendingComments || 0;
                if (!pending) {
                    statBody.innerHTML = '<div class="stat-detail-empty">No hay comentarios pendientes de aprobación</div>';
                    return;
                }
                statBody.innerHTML = '<div style="text-align:center;padding:20px 0;">'
                    + '<div style="font-size:48px;font-weight:600;color:#e65100;">' + pending + '</div>'
                    + '<div style="font-size:13px;color:#888;margin-top:8px;">comentarios esperando revisión</div>'
                    + '<p style="font-size:12px;color:#aaa;margin-top:12px;">Los comentarios se pueden moderar desde cada página de obra.</p>'
                    + '</div>';
            })
            .catch(function () {
                statBody.innerHTML = '<div class="stat-detail-empty">Error al cargar</div>';
            });
    }

    function initNewsletter() {
        var form = document.getElementById('newsletterForm');
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            var subjectInput = document.getElementById('nlSubject');
            var bodyInput = document.getElementById('nlBody');
            var errorEl = document.getElementById('nlError');
            var successEl = document.getElementById('nlSuccess');
            var sendBtn = document.getElementById('nlSendBtn');

            var subject = subjectInput.value.trim();
            var body = bodyInput.value.trim();

            errorEl.hidden = true;
            successEl.hidden = true;

            if (!subject || !body) {
                errorEl.textContent = 'Completá el asunto y el contenido.';
                errorEl.hidden = false;
                return;
            }

            if (!confirm('¿Enviar newsletter a todos los suscriptores?')) return;

            sendBtn.disabled = true;
            sendBtn.textContent = 'Enviando...';

            DDAAuth.apiFetch('/newsletter/send', {
                method: 'POST',
                body: JSON.stringify({ subject: subject, body: body })
            })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                successEl.textContent = data.message || 'Newsletter enviado.';
                successEl.hidden = false;
                subjectInput.value = '';
                bodyInput.value = '';
            })
            .catch(function (err) {
                errorEl.textContent = err.message || 'Error al enviar el newsletter.';
                errorEl.hidden = false;
            })
            .finally(function () {
                sendBtn.disabled = false;
                sendBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Enviar newsletter';
            });
        });
    }
})();
