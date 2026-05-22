document.addEventListener('DOMContentLoaded', function () {
    var params = new URLSearchParams(window.location.search);
    var slug = params.get('slug');
    if (!slug) {
        window.location.href = 'index.html';
        return;
    }

    var postId = null;

    DDAJournal.fetchPostBySlug(slug).then(function (post) {
        postId = post.id;
        document.title = 'Diego De Aduriz | ' + post.title;

        var meta = document.getElementById('postMeta');
        var lang = DDAJournal.getLang();
        if (meta) {
            meta.textContent = DDAJournal.formatDate(post.publishedAt, lang) + ' · ' + post.readMinutes + ' min';
        }

        document.getElementById('postTitle').textContent = post.title;
        document.getElementById('postTags').innerHTML = JournalApp.renderTags(post.tags);

        var cover = document.getElementById('postCover');
        if (cover && post.coverImage) {
            cover.src = post.coverImage;
            cover.alt = post.title;
        } else if (cover) {
            cover.style.display = 'none';
        }

        document.getElementById('postContent').innerHTML = post.content;

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

        loadComments();

        var schema = {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            image: post.coverImage,
            datePublished: post.publishedAt,
            author: { '@type': 'Person', name: post.author.displayName },
            url: window.location.href
        };
        var script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
    }).catch(function () {
        window.location.href = 'index.html';
    });

    function loadComments() {
        DDAJournal.getComments(postId).then(renderComments);
    }

    function renderComments(comments) {
        var list = document.getElementById('commentList');
        if (!list) return;
        if (!comments.length) {
            list.innerHTML = '';
            return;
        }
        list.innerHTML = comments.map(function (c) {
            var name = c.authorName || c.username || 'Reader';
            return (
                '<li class="journal-comment">' +
                    JournalApp.avatarHtml(name, c.avatarUrl) +
                    '<div><div class="journal-comment__author">' + JournalApp.escapeHtml(name) + '</div>' +
                    '<div class="journal-comment__text">' + JournalApp.escapeHtml(c.content) + '</div></div>' +
                '</li>'
            );
        }).join('');
    }

    var form = document.getElementById('commentForm');
    var hint = document.getElementById('commentHint');

    if (typeof DDAAuth === 'undefined' || !DDAAuth.isAuthenticated()) {
        if (hint) {
            hint.textContent = JournalApp.t('journal.comment_login');
            hint.hidden = false;
        }
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var text = document.getElementById('commentText').value.trim();
        if (!text || !postId) return;

        DDAJournal.addComment(postId, text).then(function () {
            document.getElementById('commentText').value = '';
            if (hint) {
                hint.textContent = JournalApp.t('journal.comment_pending');
                hint.hidden = false;
            }
            loadComments();
        });
    });

    window.addEventListener('languageChanged', function () {
        if (slug) window.location.reload();
    });
});
