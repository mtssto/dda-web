(function () {
    'use strict';

    if (typeof DDAAuth === 'undefined' || !DDAAuth.isAdmin()) {
        window.location.href = '../shop/user-login.html';
        return;
    }

    var API = window.DDA_API_BASE || '/api';
    var LOCAL_POSTS = 'dda_journal_admin_posts';
    var LOCAL_CAMPAIGNS = 'dda_journal_campaigns';
    var editingId = null;
    var slugEditedManually = false;

    function slugify(text) {
        return String(text || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 80);
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

    function resolveMediaUrl(url) {
        if (!url) return '';
        if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0) return url;
        if (url.indexOf('/uploads/') === 0) return url;
        return url;
    }

    function showCoverPreview(url) {
        var wrap = document.getElementById('coverPreview');
        var img = document.getElementById('coverPreviewImg');
        if (!url) {
            wrap.hidden = true;
            return;
        }
        img.src = resolveMediaUrl(url);
        wrap.hidden = false;
    }

    function setUploadStatus(el, message, isError) {
        if (!el) return;
        el.hidden = !message;
        el.textContent = message || '';
        el.classList.toggle('is-error', !!isError);
    }

    function uploadImageFile(file) {
        var formData = new FormData();
        formData.append('file', file);
        var token = DDAAuth.getToken && DDAAuth.getToken();
        var headers = {};
        if (token) headers.Authorization = 'Bearer ' + token;

        return fetch(API + '/journal/admin/upload', {
            method: 'POST',
            headers: headers,
            body: formData
        }).then(function (res) {
            if (res.status === 401 || res.status === 403) {
                window.location.href = '../shop/user-login.html';
                throw new Error('Sesión expirada');
            }
            if (!res.ok) {
                return res.text().then(function (t) {
                    throw new Error(t || 'No se pudo subir la imagen');
                });
            }
            return res.json();
        });
    }

    function insertAtCursor(textarea, snippet) {
        var start = textarea.selectionStart;
        var end = textarea.selectionEnd;
        var before = textarea.value.substring(0, start);
        var after = textarea.value.substring(end);
        textarea.value = before + snippet + after;
        textarea.selectionStart = textarea.selectionEnd = start + snippet.length;
        textarea.focus();
    }

    document.getElementById('postTitleEs').addEventListener('input', function () {
        if (!slugEditedManually) {
            document.getElementById('postSlug').value = slugify(this.value);
        }
    });

    document.getElementById('postSlug').addEventListener('input', function () {
        slugEditedManually = this.value.trim().length > 0;
    });

    document.getElementById('btnUploadCover').addEventListener('click', function () {
        var input = document.getElementById('postCoverFile');
        var status = document.getElementById('coverUploadStatus');
        if (!input.files || !input.files[0]) {
            setUploadStatus(status, 'Elegí una imagen primero.', true);
            return;
        }
        setUploadStatus(status, 'Subiendo…', false);
        uploadImageFile(input.files[0])
            .then(function (data) {
                document.getElementById('postCover').value = data.url;
                showCoverPreview(data.url);
                setUploadStatus(status, 'Imagen lista.', false);
            })
            .catch(function (err) {
                setUploadStatus(status, err.message || 'Error al subir.', true);
            });
    });

    document.getElementById('btnRemoveCover').addEventListener('click', function () {
        document.getElementById('postCover').value = '';
        document.getElementById('postCoverFile').value = '';
        showCoverPreview('');
    });

    document.getElementById('btnInsertImage').addEventListener('click', function () {
        document.getElementById('postInlineImage').click();
    });

    document.getElementById('postInlineImage').addEventListener('change', function () {
        var file = this.files && this.files[0];
        var status = document.getElementById('inlineUploadStatus');
        if (!file) return;
        setUploadStatus(status, 'Subiendo…', false);
        uploadImageFile(file)
            .then(function (data) {
                var url = resolveMediaUrl(data.url);
                var alt = document.getElementById('postTitleEs').value.trim() || 'Imagen';
                var block = '\n\n<figure class="journal-figure"><img src="' + url + '" alt="' + escapeHtml(alt) + '" loading="lazy"><figcaption>' + escapeHtml(alt) + '</figcaption></figure>\n\n';
                insertAtCursor(document.getElementById('postContentEs'), block);
                setUploadStatus(status, 'Imagen insertada en el texto.', false);
                this.value = '';
            }.bind(this))
            .catch(function (err) {
                setUploadStatus(status, err.message || 'Error al subir.', true);
            });
    });

    document.getElementById('adminLogout').addEventListener('click', function (e) {
        e.preventDefault();
        DDAAuth.logout();
        window.location.href = '../shop/user-login.html';
    });

    document.querySelectorAll('.admin-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.admin-tab').forEach(function (t) {
                t.classList.toggle('is-active', t === tab);
            });
            var panel = tab.getAttribute('data-panel');
            document.getElementById('panelPosts').hidden = panel !== 'posts';
            document.getElementById('panelNewsletter').hidden = panel !== 'newsletter';
            document.getElementById('panelComments').hidden = panel !== 'comments';
        });
    });

    function readLocal(key) {
        try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { return []; }
    }

    function writeLocal(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    function loadPostsAdmin() {
        return DDAAuth.apiFetch('/journal/admin/posts?size=50')
            .then(function (r) {
                if (r.status === 403) {
                    window.location.href = '../shop/user-login.html';
                    return [];
                }
                return r.ok ? r.json() : Promise.reject();
            })
            .then(function (d) { return d.content || d; })
            .catch(function () { return readLocal(LOCAL_POSTS); });
    }

    function pickTitle(p) {
        if (!p.title) return p.slug || '';
        if (typeof p.title === 'string') return p.title;
        return p.title.es || p.title.en || p.slug;
    }

    function renderPostsTable(posts) {
        var tbody = document.querySelector('#postsTable tbody');
        var published = 0, draft = 0, scheduled = 0;
        posts.forEach(function (p) {
            if (p.status === 'PUBLISHED') published++;
            else if (p.status === 'SCHEDULED') scheduled++;
            else draft++;
        });
        document.getElementById('statPublished').textContent = published;
        document.getElementById('statDraft').textContent = draft;
        document.getElementById('statScheduled').textContent = scheduled;

        tbody.innerHTML = posts.map(function (p) {
            var id = p.id;
            var title = pickTitle(p);
            return '<tr data-id="' + escapeHtml(String(id)) + '">' +
                '<td>' + escapeHtml(title) + '</td>' +
                '<td>' + escapeHtml(p.status) + '</td>' +
                '<td>' + escapeHtml(p.publishedAt || p.scheduledAt || '-') + '</td>' +
                '<td class="admin-table__actions">' +
                    '<button type="button" class="admin-btn admin-btn--ghost btn-edit-post" data-id="' + id + '">Editar</button> ' +
                    '<button type="button" class="admin-btn admin-btn--danger btn-delete-post" data-id="' + id + '">Eliminar</button> ' +
                    '<a href="post.html?slug=' + encodeURIComponent(p.slug) + '" target="_blank" rel="noopener">Ver</a>' +
                '</td></tr>';
        }).join('') || '<tr><td colspan="4">Sin entradas</td></tr>';

        tbody.querySelectorAll('.btn-edit-post').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var post = posts.find(function (p) { return String(p.id) === btn.getAttribute('data-id'); });
                if (post) loadPostIntoForm(post);
            });
        });

        tbody.querySelectorAll('.btn-delete-post').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var post = posts.find(function (p) { return String(p.id) === btn.getAttribute('data-id'); });
                if (post) deletePost(post);
            });
        });
    }

    function loadPostIntoForm(post) {
        editingId = post.id;
        document.getElementById('postFormTitle').textContent = 'Editar entrada';
        document.getElementById('btnSavePost').textContent = 'Guardar cambios';
        document.getElementById('btnCancelEdit').hidden = false;
        document.getElementById('btnDeletePost').hidden = false;

        slugEditedManually = true;
        document.getElementById('postSlug').value = post.slug || '';
        document.getElementById('postTitleEs').value = (post.title && post.title.es) || post.title || '';
        document.getElementById('postTitleEn').value = (post.title && post.title.en) || '';
        document.getElementById('postExcerptEs').value = htmlToPlain((post.excerpt && post.excerpt.es) || '');
        document.getElementById('postContentEs').value = htmlToPlain((post.content && post.content.es) || '');
        document.getElementById('postTags').value = (post.tags || []).join(', ');
        document.getElementById('postCover').value = post.coverImage || '';
        showCoverPreview(post.coverImage || '');
        document.getElementById('postStatus').value = post.status || 'DRAFT';
        document.getElementById('postSendNewsletter').checked = !!post.sendNewsletter;

        var schedule = post.scheduledAt || post.publishedAt;
        if (schedule) {
            try {
                document.getElementById('postSchedule').value = schedule.slice(0, 16);
            } catch (e) {
                document.getElementById('postSchedule').value = '';
            }
        } else {
            document.getElementById('postSchedule').value = '';
        }

        document.getElementById('panelPosts').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function resetPostForm() {
        editingId = null;
        document.getElementById('postFormTitle').textContent = 'Nueva entrada';
        document.getElementById('btnSavePost').textContent = 'Guardar';
        document.getElementById('btnCancelEdit').hidden = true;
        document.getElementById('btnDeletePost').hidden = true;
        slugEditedManually = false;
        document.getElementById('postSlug').value = '';
        document.getElementById('postTitleEs').value = '';
        document.getElementById('postTitleEn').value = '';
        document.getElementById('postExcerptEs').value = '';
        document.getElementById('postContentEs').value = '';
        document.getElementById('postTags').value = '';
        document.getElementById('postCover').value = '';
        document.getElementById('postCoverFile').value = '';
        showCoverPreview('');
        setUploadStatus(document.getElementById('coverUploadStatus'), '', false);
        setUploadStatus(document.getElementById('inlineUploadStatus'), '', false);
        document.getElementById('postStatus').value = 'DRAFT';
        document.getElementById('postSchedule').value = '';
        document.getElementById('postSendNewsletter').checked = false;
        document.getElementById('postPreview').hidden = true;
    }

    function buildPayload() {
        var titleEs = document.getElementById('postTitleEs').value.trim();
        var slug = document.getElementById('postSlug').value.trim() || slugify(titleEs);
        var excerptRaw = document.getElementById('postExcerptEs').value.trim();
        var contentRaw = document.getElementById('postContentEs').value.trim();

        return {
            slug: slug,
            title: {
                es: titleEs,
                en: document.getElementById('postTitleEn').value.trim()
            },
            excerpt: { es: excerptRaw ? formatContent(excerptRaw) : '' },
            content: { es: formatContent(contentRaw) },
            tags: document.getElementById('postTags').value.split(',').map(function (t) {
                return t.trim();
            }).filter(Boolean),
            coverImage: document.getElementById('postCover').value,
            status: document.getElementById('postStatus').value,
            scheduledAt: document.getElementById('postSchedule').value || null,
            sendNewsletter: document.getElementById('postSendNewsletter').checked
        };
    }

    function savePostLocal(payload, isUpdate) {
        var posts = readLocal(LOCAL_POSTS);
        if (isUpdate) {
            posts = posts.map(function (p) {
                if (String(p.id) === String(editingId)) {
                    return Object.assign({}, p, payload, { id: editingId });
                }
                return p;
            });
        } else {
            payload.id = String(Date.now());
            payload.publishedAt = payload.status === 'PUBLISHED' ? new Date().toISOString() : null;
            posts.unshift(payload);
        }
        writeLocal(LOCAL_POSTS, posts);
        if (payload.sendNewsletter && payload.status === 'PUBLISHED') {
            var campaigns = readLocal(LOCAL_CAMPAIGNS);
            campaigns.unshift({
                name: payload.title.es,
                subject: payload.title.es,
                sent: 0,
                opens: 0,
                clicks: 0,
                sentAt: new Date().toISOString(),
                subscribers: '-'
            });
            writeLocal(LOCAL_CAMPAIGNS, campaigns);
        }
    }

    function loadCampaigns() {
        return DDAAuth.apiFetch('/newsletter/admin/campaigns')
            .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
            .catch(function () { return readLocal(LOCAL_CAMPAIGNS); });
    }

    function renderCampaigns(campaigns) {
        var opens = campaigns.reduce(function (a, c) { return a + (c.opens || 0); }, 0);
        var clicks = campaigns.reduce(function (a, c) { return a + (c.clicks || 0); }, 0);
        document.getElementById('statSubscribers').textContent = campaigns[0] && campaigns[0].subscribers ? campaigns[0].subscribers : '-';
        document.getElementById('statOpens').textContent = opens || '-';
        document.getElementById('statClicks').textContent = clicks || '-';

        document.querySelector('#campaignsTable tbody').innerHTML = campaigns.map(function (c) {
            return '<tr><td>' + escapeHtml(c.name || c.subject) + '</td><td>' + (c.sent || 0) + '</td><td>' + (c.opens || 0) + '</td><td>' + (c.clicks || 0) + '</td><td>' + (c.sentAt || '-') + '</td></tr>';
        }).join('') || '<tr><td colspan="5">Sin campañas aún</td></tr>';
    }

    function loadCommentsMod() {
        return DDAAuth.apiFetch('/journal/admin/comments?status=PENDING')
            .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
            .catch(function () {
                var all = JSON.parse(localStorage.getItem('dda_journal_comments') || '{}');
                var list = [];
                Object.keys(all).forEach(function (pid) {
                    all[pid].forEach(function (c) {
                        if (c.status === 'PENDING') list.push(Object.assign({ postId: pid }, c));
                    });
                });
                return list;
            });
    }

    function renderComments(comments) {
        document.querySelector('#commentsModTable tbody').innerHTML = comments.map(function (c) {
            return '<tr><td>' + escapeHtml(c.authorName) + '</td><td>' + escapeHtml(c.content) + '</td><td>' + c.status + '</td>' +
                '<td><button class="admin-btn admin-btn--ghost" data-approve="' + c.id + '">Aprobar</button></td></tr>';
        }).join('') || '<tr><td colspan="4">Sin comentarios pendientes</td></tr>';
    }

    function deletePost(post) {
        var title = pickTitle(post);
        if (!confirm('¿Eliminar la entrada “' + title + '”? Esta acción no se puede deshacer.')) {
            return;
        }

        var id = post.id;
        DDAAuth.apiFetch('/journal/admin/posts/' + id, { method: 'DELETE' })
            .then(function (r) {
                if (r.status === 403) {
                    window.location.href = '../shop/user-login.html';
                    return;
                }
                if (!r.ok && r.status !== 204) throw new Error('API');
                resetPostForm();
                refresh();
            })
            .catch(function () {
                var posts = readLocal(LOCAL_POSTS).filter(function (p) {
                    return String(p.id) !== String(id);
                });
                writeLocal(LOCAL_POSTS, posts);
                resetPostForm();
                refresh();
                alert('Eliminado localmente (conectá el backend para borrado real).');
            });
    }

    document.getElementById('btnPreview').addEventListener('click', function () {
        var preview = document.getElementById('postPreview');
        preview.hidden = false;
        preview.innerHTML = formatContent(document.getElementById('postContentEs').value) || '<p>(vacío)</p>';
    });

    document.getElementById('btnCancelEdit').addEventListener('click', resetPostForm);

    document.getElementById('btnDeletePost').addEventListener('click', function () {
        if (!editingId) return;
        loadPostsAdmin().then(function (posts) {
            var post = posts.find(function (p) { return String(p.id) === String(editingId); });
            if (post) deletePost(post);
        });
    });

    document.getElementById('btnSavePost').addEventListener('click', function () {
        var payload = buildPayload();
        if (!payload.title.es) {
            alert('Escribí al menos el título en español.');
            return;
        }
        if (!payload.content.es) {
            alert('Escribí el texto de la entrada.');
            return;
        }

        var url = editingId ? '/journal/admin/posts/' + editingId : '/journal/admin/posts';
        var method = editingId ? 'PUT' : 'POST';

        DDAAuth.apiFetch(url, {
            method: method,
            body: JSON.stringify(payload)
        }).then(function (r) {
            if (r.status === 403) {
                window.location.href = '../shop/user-login.html';
                return;
            }
            if (!r.ok) throw new Error('API');
            return r.json();
        }).then(function () {
            resetPostForm();
            refresh();
        }).catch(function () {
            savePostLocal(payload, !!editingId);
            resetPostForm();
            refresh();
            alert('Guardado localmente (conectá el backend para publicar en el sitio).');
        });
    });

    function escapeHtml(s) {
        return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function refresh() {
        loadPostsAdmin().then(renderPostsTable);
        loadCampaigns().then(renderCampaigns);
        loadCommentsMod().then(renderComments);
    }

    refresh();
})();
