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

        document.getElementById('postSlug').value = post.slug || '';
        document.getElementById('postTitleEs').value = (post.title && post.title.es) || post.title || '';
        document.getElementById('postTitleEn').value = (post.title && post.title.en) || '';
        document.getElementById('postExcerptEs').value = (post.excerpt && post.excerpt.es) || '';
        document.getElementById('postContentEs').value = (post.content && post.content.es) || '';
        document.getElementById('postTags').value = (post.tags || []).join(', ');
        document.getElementById('postCover').value = post.coverImage || '';
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
        document.getElementById('postSlug').value = '';
        document.getElementById('postTitleEs').value = '';
        document.getElementById('postTitleEn').value = '';
        document.getElementById('postExcerptEs').value = '';
        document.getElementById('postContentEs').value = '';
        document.getElementById('postTags').value = '';
        document.getElementById('postCover').value = '';
        document.getElementById('postStatus').value = 'DRAFT';
        document.getElementById('postSchedule').value = '';
        document.getElementById('postSendNewsletter').checked = false;
        document.getElementById('postPreview').hidden = true;
    }

    function buildPayload() {
        return {
            slug: document.getElementById('postSlug').value.trim(),
            title: {
                es: document.getElementById('postTitleEs').value,
                en: document.getElementById('postTitleEn').value
            },
            excerpt: { es: document.getElementById('postExcerptEs').value },
            content: { es: document.getElementById('postContentEs').value },
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
        preview.innerHTML = document.getElementById('postContentEs').value || '<p>(vacío)</p>';
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
        if (!payload.slug || !payload.title.es) {
            alert('Completá al menos título (ES) y slug.');
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
