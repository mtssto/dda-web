document.addEventListener('DOMContentLoaded', function () {
    var params = new URLSearchParams(window.location.search);
    var slug = params.get('slug');
    if (!slug) {
        window.location.href = 'index.html';
        return;
    }

    var postId = null;
    var loginUrl = '../shop/user-login.html?return=' + encodeURIComponent(window.location.pathname + window.location.search);

    function authorInitials(name) {
        return String(name || 'U').split(/\s+/).map(function (w) {
            return w.charAt(0);
        }).join('').slice(0, 2).toUpperCase();
    }

    DDAJournal.fetchPostBySlug(slug).then(function (post) {
        postId = post.id;
        document.title = 'Diego De Aduriz | ' + post.title;

        var meta = document.getElementById('postMeta');
        var lang = DDAJournal.getLang();
        var authorName = (post.author && post.author.displayName) || 'Diego De Aduriz';
        var authorEl = document.getElementById('postAuthor');

        if (authorEl) authorEl.textContent = authorName;
        if (meta) {
            meta.textContent = DDAJournal.formatDate(post.publishedAt, lang) + ' \u00b7 ' + post.readMinutes + ' min';
        }

        document.getElementById('postTitle').textContent = post.title;
        document.getElementById('postTags').innerHTML = JournalApp.renderTags(post.tags);

        var cover = document.getElementById('postCover');
        if (cover && post.coverImage) {
            cover.src = post.coverImage;
            cover.alt = post.title;
            cover.onerror = function () { this.style.display = 'none'; };
        } else if (cover) {
            cover.style.display = 'none';
        }

        var contentEl = document.getElementById('postContent');
        if (contentEl) {
            contentEl.innerHTML = post.content;
            contentEl.querySelectorAll('img').forEach(function (img) {
                img.addEventListener('error', function () { this.style.display = 'none'; });
            });
        }

        var likeBtn = document.getElementById('btnLike');
        var saveBtn = document.getElementById('btnSave');
        var likeCount = document.getElementById('likeCount');
        var saveLabel = document.getElementById('saveLabel');

        function syncActions() {
            likeBtn.classList.toggle('is-active', DDAJournal.isLiked(postId));
            likeBtn.setAttribute('aria-pressed', String(DDAJournal.isLiked(postId)));
            saveBtn.classList.toggle('is-active', DDAJournal.isSaved(postId));
            saveBtn.setAttribute('aria-pressed', String(DDAJournal.isSaved(postId)));
            if (saveLabel) {
                saveLabel.textContent = DDAJournal.isSaved(postId)
                    ? JournalApp.t('journal.saved')
                    : JournalApp.t('journal.save');
            }
            var baseLikes = post.likes || 0;
            var extra = DDAJournal.isLiked(postId) ? 1 : 0;
            if (likeCount) likeCount.textContent = '(' + (baseLikes + extra) + ')';
        }

        syncActions();

        likeBtn.addEventListener('click', function () {
            DDAJournal.toggleLike(postId);
            syncActions();
        });

        saveBtn.addEventListener('click', function () {
            DDAJournal.toggleSave(postId);
            syncActions();
        });

        setupComments();

        // Update OG / Twitter meta dynamically
        var fullUrl = window.location.href;
        var coverImg = post.coverImage || 'https://diegodeaduriz.art/dda.jpeg';
        var ogTitle = post.title + ' — Diego De Aduriz';
        var ogDesc = post.excerpt || 'Entrada del cuaderno del artista Diego De Aduriz.';

        var metaMap = {
            'og-url': fullUrl, 'og-title': ogTitle, 'og-description': ogDesc, 'og-image': coverImg,
            'tw-title': ogTitle, 'tw-description': ogDesc, 'tw-image': coverImg
        };
        Object.keys(metaMap).forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.setAttribute('content', metaMap[id]);
        });

        setupShareButtons(post.title, fullUrl);

        var schema = {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            image: post.coverImage,
            datePublished: post.publishedAt,
            author: { '@type': 'Person', name: authorName },
            url: window.location.href
        };
        var script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
    }).catch(function () {
        window.location.href = 'index.html';
    });

    function setupComments() {
        var form = document.getElementById('commentForm');
        var hint = document.getElementById('commentHint');
        var textarea = document.getElementById('commentText');
        var authed = typeof DDAAuth !== 'undefined' && DDAAuth.isAuthenticated();
        var submitBtn = form ? form.querySelector('button[type="submit"]') : null;

        if (textarea) textarea.disabled = !authed;
        if (submitBtn) submitBtn.disabled = !authed;

        if (!authed && hint) {
            hint.hidden = false;
            hint.innerHTML = (JournalApp.t('journal.comment_login') || 'Iniciá sesión para comentar') +
                ' <a href="' + loginUrl + '">Iniciar sesión</a> \u00b7 <a href="../shop/user-login.html#register">Crear cuenta</a>';
        }

        loadComments();
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (typeof DDAAuth === 'undefined' || !DDAAuth.isAuthenticated()) {
                window.location.href = loginUrl;
                return;
            }
            var text = textarea ? textarea.value.trim() : '';
            if (!text || !postId) return;

            DDAJournal.addComment(postId, text).then(function () {
                if (textarea) textarea.value = '';
                if (hint) {
                    hint.hidden = false;
                    hint.classList.remove('is-error');
                    hint.textContent = JournalApp.t('journal.comment_published') || 'Comentario publicado.';
                }
                loadComments();
            }).catch(function (err) {
                if (err && err.message === 'LOGIN_REQUIRED') {
                    window.location.href = loginUrl;
                    return;
                }
                if (hint) {
                    hint.hidden = false;
                    hint.classList.add('is-error');
                    hint.textContent = (err && err.message) ? err.message : 'No se pudo publicar.';
                }
            });
        });
    }

    function loadComments() {
        if (!postId) return;
        DDAJournal.getComments(postId).then(renderComments);
    }

    function renderComments(comments) {
        var list = document.getElementById('commentList');
        if (!list) return;
        if (!comments.length) {
            list.innerHTML = '<li class="diary-comment-empty">' +
                (JournalApp.t('journal.comments_empty') || 'Todavía no hay comentarios.') + '</li>';
            return;
        }
        list.innerHTML = comments.map(function (c) {
            var name = c.authorName || c.username || 'Usuario';
            var date = c.createdAt ? DDAJournal.formatDate(c.createdAt, DDAJournal.getLang()) : '';
            return (
                '<li class="diary-comment">' +
                    '<div class="diary-comment__avatar" aria-hidden="true">' +
                        JournalApp.escapeHtml(authorInitials(name)) +
                    '</div>' +
                    '<div class="diary-comment__body">' +
                        '<div class="diary-comment__head">' +
                            '<span class="diary-comment__author">' + JournalApp.escapeHtml(name) + '</span>' +
                            (date ? '<time class="diary-comment__date">' + JournalApp.escapeHtml(date) + '</time>' : '') +
                        '</div>' +
                        '<div class="diary-comment__text">' + JournalApp.escapeHtml(c.content) + '</div>' +
                    '</div>' +
                '</li>'
            );
        }).join('');
    }

    function setupShareButtons(title, url) {
        var shareTitle = title + ' — Diego De Aduriz';
        var wa = document.getElementById('shareWhatsApp');
        var tw = document.getElementById('shareTwitter');
        var fb = document.getElementById('shareFacebook');
        var cp = document.getElementById('shareCopy');

        if (wa) wa.addEventListener('click', function () {
            window.open('https://wa.me/?text=' + encodeURIComponent(shareTitle + '\n' + url), '_blank');
        });
        if (tw) tw.addEventListener('click', function () {
            window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareTitle) + '&url=' + encodeURIComponent(url), '_blank');
        });
        if (fb) fb.addEventListener('click', function () {
            window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url), '_blank');
        });
        if (cp) cp.addEventListener('click', function () {
            navigator.clipboard.writeText(url).then(function () {
                var toast = document.createElement('div');
                toast.className = 'copy-toast visible';
                toast.textContent = 'Enlace copiado';
                document.body.appendChild(toast);
                setTimeout(function () { toast.remove(); }, 2500);
            });
        });
    }

    window.addEventListener('languageChanged', function () {
        if (slug) window.location.reload();
    });
});
