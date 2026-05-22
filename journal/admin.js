(function () {
    'use strict';

    if (typeof DDAAuth === 'undefined' || !DDAAuth.isAdmin()) {
        window.location.href = '../shop/login.html';
        return;
    }

    var API = window.DDA_API_BASE || '/api';
    var LOCAL_POSTS = 'dda_journal_admin_posts';
    var LOCAL_CAMPAIGNS = 'dda_journal_campaigns';

    document.getElementById('adminLogout').addEventListener('click', function (e) {
        e.preventDefault();
        DDAAuth.logout();
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
            .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
            .then(function (d) { return d.content || d; })
            .catch(function () { return readLocal(LOCAL_POSTS); });
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
            var title = (p.title && p.title.es) || p.title || p.slug;
            return '<tr><td>' + escapeHtml(title) + '</td><td>' + p.status + '</td><td>' + (p.publishedAt || p.scheduledAt || '-') + '</td>' +
                '<td><a href="post.html?slug=' + encodeURIComponent(p.slug) + '" target="_blank">Ver</a></td></tr>';
        }).join('');
    }

    function loadCampaigns() {
        return DDAAuth.apiFetch('/newsletter/admin/campaigns')
            .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
            .catch(function () { return readLocal(LOCAL_CAMPAIGNS); });
    }

    function renderCampaigns(campaigns) {
        var subs = campaigns.reduce(function (a, c) { return a + (c.sent || 0); }, 0);
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

    document.getElementById('btnPreview').addEventListener('click', function () {
        var preview = document.getElementById('postPreview');
        preview.hidden = false;
        preview.innerHTML = document.getElementById('postContentEs').value || '<p>(vacío)</p>';
    });

    document.getElementById('btnSavePost').addEventListener('click', function () {
        var payload = {
            slug: document.getElementById('postSlug').value.trim(),
            title: { es: document.getElementById('postTitleEs').value, en: document.getElementById('postTitleEn').value },
            excerpt: { es: document.getElementById('postExcerptEs').value },
            content: { es: document.getElementById('postContentEs').value },
            tags: document.getElementById('postTags').value.split(',').map(function (t) { return t.trim(); }).filter(Boolean),
            coverImage: document.getElementById('postCover').value,
            status: document.getElementById('postStatus').value,
            scheduledAt: document.getElementById('postSchedule').value || null,
            sendNewsletter: document.getElementById('postSendNewsletter').checked
        };

        DDAAuth.apiFetch('/journal/admin/posts', {
            method: 'POST',
            body: JSON.stringify(payload)
        }).then(function (r) {
            if (r.ok) return r.json();
            throw new Error('API');
        }).then(refresh).catch(function () {
            var posts = readLocal(LOCAL_POSTS);
            payload.id = String(Date.now());
            payload.publishedAt = payload.status === 'PUBLISHED' ? new Date().toISOString() : null;
            posts.unshift(payload);
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
            refresh();
            alert('Guardado localmente (conectá el backend para envío real).');
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
