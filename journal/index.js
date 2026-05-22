document.addEventListener('DOMContentLoaded', function () {
    var grid = document.getElementById('journalGrid');
    var empty = document.getElementById('journalEmpty');
    var filters = document.getElementById('journalFilters');
    var allPosts = [];
    var activeTag = '';

    function render(posts) {
        if (!grid) return;
        if (!posts.length) {
            grid.innerHTML = '';
            if (empty) empty.hidden = false;
            return;
        }
        if (empty) empty.hidden = true;

        var lang = DDAJournal.getLang();
        grid.innerHTML = posts.map(function (post) {
            var date = DDAJournal.formatDate(post.publishedAt, lang);
            return (
                '<a class="journal-card" href="post.html?slug=' + encodeURIComponent(post.slug) + '">' +
                    '<div class="journal-card__media">' +
                        '<img src="' + JournalApp.escapeHtml(post.coverImage) + '" alt="" loading="lazy" decoding="async">' +
                    '</div>' +
                    '<div class="journal-card__body">' +
                        '<div class="journal-card__meta">' + JournalApp.escapeHtml(date) + ' · ' + post.readMinutes + ' min</div>' +
                        '<h2 class="journal-card__title">' + JournalApp.escapeHtml(post.title) + '</h2>' +
                        '<p class="journal-card__excerpt">' + JournalApp.escapeHtml(post.excerpt) + '</p>' +
                        '<div class="journal-card__tags">' + JournalApp.renderTags(post.tags) + '</div>' +
                    '</div>' +
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
                render(allPosts.filter(function (p) {
                    return p.tags && p.tags.indexOf(activeTag) !== -1;
                }));
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

    DDAJournal.fetchPosts().then(function (posts) {
        allPosts = posts.sort(function (a, b) {
            return new Date(b.publishedAt) - new Date(a.publishedAt);
        });
        buildFilters(allPosts);
        render(allPosts);
    }).catch(function () {
        if (empty) empty.hidden = false;
    });

    JournalApp.bindNewsletterForm('journalNewsletterForm');

    window.addEventListener('languageChanged', function () {
        DDAJournal.fetchPosts().then(function (posts) {
            allPosts = posts;
            render(activeTag ? allPosts.filter(function (p) {
                return p.tags && p.tags.indexOf(activeTag) !== -1;
            }) : allPosts);
        });
    });
});
