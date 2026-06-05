/**
 * Cuaderno tab — quick journal entry management inside shop admin.
 */
(function () {
    'use strict';

    var editingId = null;
    var postsCache = [];

    function slugify(text) {
        return String(text || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 80);
    }

    function escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function htmlToPlain(html) {
        if (!html) return '';
        var div = document.createElement('div');
        div.innerHTML = html;
        return (div.textContent || div.innerText || '').trim();
    }

    function formatContent(text) {
        var raw = String(text || '').trim();
        if (!raw) return '';
        if (/<[a-z][\s\S]*>/i.test(raw)) return raw;
        return raw.split(/\n\s*\n/).map(function (block) {
            var line = escapeHtml(block.trim()).replace(/\n/g, '<br>');
            return line ? '<p>' + line + '</p>' : '';
        }).filter(Boolean).join('');
    }

    function pickTitle(post) {
        if (!post.title) return post.slug || '';
        if (typeof post.title === 'string') return post.title;
        return post.title.es || post.title.en || post.slug || '';
    }

    function authUploadHeaders() {
        var headers = {};
        if (typeof DDAAuth !== 'undefined' && DDAAuth.authHeaders) {
            var h = DDAAuth.authHeaders();
            if (h.Authorization) headers.Authorization = h.Authorization;
        }
        return headers;
    }

    function setStatus(el, message, isError) {
        if (!el) return;
        el.hidden = !message;
        el.textContent = message || '';
        el.classList.toggle('is-error', !!isError);
    }

    function showCover(url) {
        var wrap = document.getElementById('journalCoverPreview');
        var img = document.getElementById('journalCoverPreviewImg');
        if (!url) {
            if (wrap) wrap.hidden = true;
            return;
        }
        img.src = url.indexOf('http') === 0 ? url : (window.DDA_MEDIA_BASE || '') + url;
        wrap.hidden = false;
    }

    function resetForm() {
        editingId = null;
        document.getElementById('journalFormTitle').textContent = 'Nueva entrada';
        document.getElementById('journalSaveBtn').textContent = 'Guardar entrada';
        document.getElementById('journalCancelEdit').hidden = true;
        document.getElementById('journalTitle').value = '';
        document.getElementById('journalContent').value = '';
        document.getElementById('journalCoverUrl').value = '';
        document.getElementById('journalCoverFile').value = '';
        document.getElementById('journalStatus').value = 'DRAFT';
        document.getElementById('journalSendNewsletter').checked = false;
        showCover('');
        setStatus(document.getElementById('journalCoverStatus'), '', false);
        document.getElementById('journalFormError').hidden = true;
        document.getElementById('journalFormSuccess').hidden = true;
    }

    function loadIntoForm(post) {
        editingId = post.id;
        document.getElementById('journalFormTitle').textContent = 'Editar entrada';
        document.getElementById('journalSaveBtn').textContent = 'Guardar cambios';
        document.getElementById('journalCancelEdit').hidden = false;
        document.getElementById('journalTitle').value = pickTitle(post);
        document.getElementById('journalContent').value = htmlToPlain((post.content && post.content.es) || post.content || '');
        document.getElementById('journalCoverUrl').value = post.coverImage || '';
        document.getElementById('journalStatus').value = post.status || 'DRAFT';
        document.getElementById('journalSendNewsletter').checked = !!post.sendNewsletter;
        showCover(post.coverImage || '');
        document.getElementById('journalComposeCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function buildPayload() {
        var title = document.getElementById('journalTitle').value.trim();
        var contentRaw = document.getElementById('journalContent').value.trim();
        return {
            slug: slugify(title),
            title: { es: title, en: '' },
            excerpt: { es: contentRaw.slice(0, 200), en: '' },
            content: { es: formatContent(contentRaw), en: '' },
            coverImage: document.getElementById('journalCoverUrl').value.trim() || null,
            tags: [],
            status: document.getElementById('journalStatus').value,
            scheduledAt: null,
            sendNewsletter: document.getElementById('journalSendNewsletter').checked
        };
    }

    function renderTable(posts) {
        var tbody = document.getElementById('journalPostsBody');
        if (!tbody) return;

        if (!posts.length) {
            tbody.innerHTML = '<tr><td colspan="4">Sin entradas — creá la primera arriba.</td></tr>';
            return;
        }

        tbody.innerHTML = posts.map(function (p) {
            var title = pickTitle(p);
            var date = (p.publishedAt || p.scheduledAt || p.createdAt || '-').toString().slice(0, 10);
            var statusLabel = p.status === 'PUBLISHED' ? 'Publicada' : (p.status === 'DRAFT' ? 'Borrador' : p.status);
            return '<tr>' +
                '<td><strong>' + escapeHtml(title) + '</strong></td>' +
                '<td>' + escapeHtml(statusLabel) + '</td>' +
                '<td>' + escapeHtml(date) + '</td>' +
                '<td class="col-actions">' +
                    '<button type="button" class="btn-secondary btn-sm journal-edit-btn" data-id="' + p.id + '">Editar</button> ' +
                    '<button type="button" class="btn-danger btn-sm journal-delete-btn" data-id="' + p.id + '">Eliminar</button> ' +
                    '<a href="../journal/post.html?slug=' + encodeURIComponent(p.slug) + '" target="_blank" rel="noopener" class="btn-secondary btn-sm" style="text-decoration:none;display:inline-block;">Ver</a>' +
                '</td></tr>';
        }).join('');

        tbody.querySelectorAll('.journal-edit-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = Number(btn.getAttribute('data-id'));
                var post = postsCache.find(function (p) { return p.id === id; });
                if (post) loadIntoForm(post);
            });
        });

        tbody.querySelectorAll('.journal-delete-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = Number(btn.getAttribute('data-id'));
                var post = postsCache.find(function (p) { return p.id === id; });
                if (!post || !confirm('¿Eliminar "' + pickTitle(post) + '"?')) return;
                DDAAuth.apiFetch('/journal/admin/posts/' + id, { method: 'DELETE' })
                    .then(function () { load(); resetForm(); })
                    .catch(function (err) { alert(err.message || 'Error al eliminar'); });
            });
        });
    }

    function load() {
        var tbody = document.getElementById('journalPostsBody');
        if (tbody) tbody.innerHTML = '<tr class="table-loading"><td colspan="4">Cargando entradas…</td></tr>';

        DDAAuth.apiFetch('/journal/admin/posts?size=50')
            .then(function (res) { return res.json(); })
            .then(function (data) {
                postsCache = data.content || data || [];
                renderTable(postsCache);
            })
            .catch(function () {
                if (tbody) tbody.innerHTML = '<tr><td colspan="4">Error al cargar entradas</td></tr>';
            });
    }

    function savePost() {
        var errorEl = document.getElementById('journalFormError');
        var successEl = document.getElementById('journalFormSuccess');
        var title = document.getElementById('journalTitle').value.trim();
        var content = document.getElementById('journalContent').value.trim();

        errorEl.hidden = true;
        successEl.hidden = true;

        if (!title) {
            errorEl.textContent = 'El título es obligatorio';
            errorEl.hidden = false;
            return;
        }
        if (!content) {
            errorEl.textContent = 'El texto es obligatorio';
            errorEl.hidden = false;
            return;
        }

        var payload = buildPayload();
        var path = editingId ? '/journal/admin/posts/' + editingId : '/journal/admin/posts';
        var method = editingId ? 'PUT' : 'POST';
        var saveBtn = document.getElementById('journalSaveBtn');
        saveBtn.disabled = true;

        DDAAuth.apiFetch(path, { method: method, body: JSON.stringify(payload) })
            .then(function (res) {
                if (!res.ok) return res.json().then(function (d) { throw new Error(d.message || 'Error al guardar'); });
                return res.json();
            })
            .then(function () {
                successEl.textContent = editingId ? 'Entrada actualizada.' : 'Entrada guardada.';
                successEl.hidden = false;
                resetForm();
                load();
            })
            .catch(function (err) {
                errorEl.textContent = err.message || 'Error al guardar';
                errorEl.hidden = false;
            })
            .finally(function () {
                saveBtn.disabled = false;
            });
    }

    function uploadCover() {
        var input = document.getElementById('journalCoverFile');
        var status = document.getElementById('journalCoverStatus');
        if (!input.files || !input.files[0]) {
            setStatus(status, 'Elegí una imagen primero.', true);
            return;
        }

        var formData = new FormData();
        formData.append('file', input.files[0]);
        setStatus(status, 'Subiendo…', false);

        var apiBase = window.DDA_API_BASE || '/api';
        fetch(apiBase + '/journal/admin/upload', {
            method: 'POST',
            credentials: 'include',
            headers: authUploadHeaders(),
            body: formData
        })
            .then(function (res) {
                if (!res.ok) return res.text().then(function (t) { throw new Error(t || 'Error al subir'); });
                return res.json();
            })
            .then(function (data) {
                document.getElementById('journalCoverUrl').value = data.url;
                showCover(data.url);
                setStatus(status, 'Imagen lista.', false);
            })
            .catch(function (err) {
                setStatus(status, err.message || 'Error al subir', true);
            });
    }

    function bindEvents() {
        document.getElementById('journalSaveBtn').addEventListener('click', savePost);
        document.getElementById('journalUploadCover').addEventListener('click', uploadCover);
        document.getElementById('journalRemoveCover').addEventListener('click', function () {
            document.getElementById('journalCoverUrl').value = '';
            document.getElementById('journalCoverFile').value = '';
            showCover('');
        });
        document.getElementById('journalCancelEdit').addEventListener('click', resetForm);
        document.getElementById('journalNewBtn').addEventListener('click', function () {
            resetForm();
            document.getElementById('journalTitle').focus();
        });
    }

    DDAAuth.init().then(function () {
        if (!DDAAuth.isAdmin()) return;
        bindEvents();
    });

    window.DDAAdminJournal = { load: load, resetForm: resetForm };
})();
