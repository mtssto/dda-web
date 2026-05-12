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
            path = '/artworks?page=' + state.page + '&size=20&sort=createdAt,desc';
        }

        tableBody.innerHTML = '<tr class="table-loading"><td colspan="8">Cargando obras...</td></tr>';

        DDAAuth.apiFetch(path)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                state.artworks = data.content || [];
                state.totalPages = data.totalPages || 0;
                state.totalElements = data.totalElements || 0;
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

        var btnText = modalSave.querySelector('.btn-text');
        var btnLoader = modalSave.querySelector('.btn-loader');
        btnText.hidden = true;
        btnLoader.hidden = false;
        modalSave.disabled = true;
        formError.hidden = true;

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
        .then(function () {
            closeModal();
            loadArtworks();
            loadCategories();
            loadStats();
        })
        .catch(function (err) {
            formError.textContent = err.message || 'Error al guardar la obra';
            formError.hidden = false;
        })
        .finally(function () {
            btnText.hidden = false;
            btnLoader.hidden = true;
            modalSave.disabled = false;
        });
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
            var imgSrc = art.images && art.images.length > 0
                ? art.images[0].filePath
                : '';
            var imgTag = imgSrc
                ? '<img src="' + imgSrc + '" alt="' + escapeHtml(art.title) + '" class="table-thumb" loading="lazy">'
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
        DDAAuth.apiFetch('/artworks?page=0&size=200&sort=createdAt,desc')
            .then(function (res) { return res.json(); })
            .then(function (data) {
                var all = data.content || [];
                var soldCount = 0;
                all.forEach(function (a) { if (a.sold) soldCount++; });
                var total = data.totalElements || all.length;
                document.getElementById('statTotal').textContent = total;
                document.getElementById('statAvailable').textContent = total - soldCount;
                document.getElementById('statSold').textContent = soldCount;
                document.getElementById('statCategories').textContent = state.categories.length || 0;
            })
            .catch(function () { /* silently fail */ });
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

        modal.hidden = false;
        document.body.style.overflow = 'hidden';
        document.getElementById('artTitle').focus();
    }

    function closeModal() {
        modal.hidden = true;
        document.body.style.overflow = '';
        state.editingId = null;
        artworkForm.reset();
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
    function escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
})();
