document.addEventListener('DOMContentLoaded', function () {
    var feed = document.getElementById('journalGrid');
    var empty = document.getElementById('journalEmpty');
    var filters = document.getElementById('journalFilters');
    var searchInput = document.getElementById('forumSearch');
    var allPosts = [];
    var activeTag = '';
    var searchQuery = '';

    function attrUrl(url) {
        if (typeof JournalApp !== 'undefined' && JournalApp.attrUrl) {
            return JournalApp.attrUrl(url);
        }
        return String(url || '').replace(/"/g, '&quot;');
    }

    function authorInitials(author) {
        var name = (author && author.displayName) || 'DDA';
        return name.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase();
    }

    function filterPosts(posts) {
        var list = posts;
        if (activeTag) {
            list = list.filter(function (p) {
                return p.tags && p.tags.indexOf(activeTag) !== -1;
            });
        }
        if (searchQuery) {
            var q = searchQuery.toLowerCase();
            list = list.filter(function (p) {
                return (p.title && p.title.toLowerCase().indexOf(q) !== -1) ||
                    (p.excerpt && p.excerpt.toLowerCase().indexOf(q) !== -1) ||
                    (p.tags && p.tags.some(function (t) { return t.toLowerCase().indexOf(q) !== -1; }));
            });
        }
        return list;
    }

    function render(posts) {
        if (!feed) return;
        var visible = filterPosts(posts);

        if (!visible.length) {
            feed.innerHTML = '';
            if (empty) {
                empty.hidden = false;
                empty.textContent = searchQuery || activeTag
                    ? 'No hay entradas con ese criterio.'
                    : (JournalApp.t('journal.empty') || 'Aún no hay entradas publicadas.');
            }
            return;
        }
        if (empty) empty.hidden = true;

        var lang = DDAJournal.getLang();
        feed.innerHTML = visible.map(function (post, index) {
            var date = DDAJournal.formatDate(post.publishedAt, lang);
            var author = post.author && post.author.displayName ? post.author.displayName : 'Diego De Aduriz';
            var cover = post.coverImage
                ? '<div class="forum-thread__thumb"><img src="' + attrUrl(post.coverImage) + '" alt="" loading="lazy"></div>'
                : '';

            return (
                '<a class="forum-thread' + (index === 0 ? ' forum-thread--featured' : '') + '" href="post.html?slug=' + encodeURIComponent(post.slug) + '">' +
                    '<div class="forum-thread__avatar" aria-hidden="true">' + JournalApp.escapeHtml(authorInitials(post.author)) + '</div>' +
                    '<div class="forum-thread__main">' +
                        '<div class="forum-thread__top">' +
                            '<span class="forum-thread__author">' + JournalApp.escapeHtml(author) + '</span>' +
                            '<time class="forum-thread__date">' + JournalApp.escapeHtml(date) + '</time>' +
                        '</div>' +
                        '<h2 class="forum-thread__title">' + JournalApp.escapeHtml(post.title) + '</h2>' +
                        '<p class="forum-thread__excerpt">' + JournalApp.escapeHtml(post.excerpt) + '</p>' +
                        '<div class="forum-thread__footer">' +
                            '<span class="forum-thread__stat">' + post.readMinutes + ' min lectura</span>' +
                            '<span class="forum-thread__stat">♥ ' + (post.likes || 0) + '</span>' +
                            '<span class="forum-thread__cta" data-i18n="journal.read">Leer hilo →</span>' +
                        '</div>' +
                        (post.tags && post.tags.length
                            ? '<div class="forum-thread__tags">' + JournalApp.renderTags(post.tags) + '</div>'
                            : '') +
                    '</div>' +
                    cover +
                '</a>'
            );
        }).join('');
    }

    function buildFilters(posts) {
        var tags = {};
        posts.forEach(function (p) {
            (p.tags || []).forEach(function (t) { tags[t] = true; });
        });
        Object.keys(tags).sort().forEach(function (tag) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'journal-filter-btn';
            btn.setAttribute('data-tag', tag);
            btn.textContent = tag;
            btn.addEventListener('click', function () {
                activeTag = tag;
                document.querySelectorAll('.journal-filter-btn').forEach(function (b) {
                    b.classList.toggle('is-active', b.getAttribute('data-tag') === activeTag);
                });
                render(allPosts);
            });
            filters.appendChild(btn);
        });

        filters.querySelector('[data-tag=""]').addEventListener('click', function () {
            activeTag = '';
            document.querySelectorAll('.journal-filter-btn').forEach(function (b) {
                b.classList.toggle('is-active', b.getAttribute('data-tag') === '');
            });
            render(allPosts);
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            searchQuery = searchInput.value.trim();
            render(allPosts);
        });
    }

    DDAJournal.fetchPosts().then(function (posts) {
        allPosts = posts.sort(function (a, b) {
            return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
        });
        buildFilters(allPosts);
        render(allPosts);
    }).catch(function () {
        if (empty) empty.hidden = false;
    });

    JournalApp.bindNewsletterForm('journalNewsletterForm');

    window.addEventListener('languageChanged', function () {
        DDAJournal.fetchPosts().then(function (posts) {
            allPosts = posts.sort(function (a, b) {
                return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
            });
            render(allPosts);
        });
    });
});
