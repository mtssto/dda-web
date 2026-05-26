document.addEventListener('DOMContentLoaded', function () {
    var viewport = document.getElementById('bookViewport');
    var navWrap = document.getElementById('bookNav');
    var btnPrev = document.getElementById('btnPrev');
    var btnNext = document.getElementById('btnNext');
    var pageInfo = document.getElementById('pageInfo');
    var empty = document.getElementById('journalEmpty');
    var searchInput = document.getElementById('forumSearch');

    var allPosts = [];
    var visiblePosts = [];
    var currentPage = 0;
    var animating = false;
    var searchQuery = '';

    var FLIP_MS = 480;

    function attrUrl(url) {
        if (typeof JournalApp !== 'undefined' && JournalApp.attrUrl) {
            return JournalApp.attrUrl(url);
        }
        return String(url || '').replace(/"/g, '&quot;');
    }

    function filterPosts(posts) {
        if (!searchQuery) return posts;
        var q = searchQuery.toLowerCase();
        return posts.filter(function (p) {
            return (p.title && p.title.toLowerCase().indexOf(q) !== -1) ||
                (p.excerpt && p.excerpt.toLowerCase().indexOf(q) !== -1) ||
                (p.tags && p.tags.some(function (t) { return t.toLowerCase().indexOf(q) !== -1; }));
        });
    }

    function buildPageHtml(post, index, total) {
        var lang = DDAJournal.getLang();
        var date = DDAJournal.formatDate(post.publishedAt, lang);
        var cover = post.coverImage
            ? '<img class="diary-page-cover" src="' + attrUrl(post.coverImage) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">'
            : '';
        var tags = post.tags && post.tags.length
            ? '<div class="diary-page-tags">' + JournalApp.renderTags(post.tags) + '</div>'
            : '';

        return (
            '<a href="post.html?slug=' + encodeURIComponent(post.slug) + '" class="diary-page-inner" style="text-decoration:none;color:inherit;">' +
                '<time class="diary-page-date">' + JournalApp.escapeHtml(date) + '</time>' +
                '<h2 class="diary-page-title">' + JournalApp.escapeHtml(post.title) + '</h2>' +
                cover +
                '<p class="diary-page-excerpt">' + JournalApp.escapeHtml(post.excerpt) + '</p>' +
                tags +
                '<div class="diary-page-footer">' +
                    '<span>' + post.readMinutes + ' min</span>' +
                    '<span>&#9829; ' + (post.likes || 0) + '</span>' +
                    '<span class="diary-page-cta" data-i18n="journal.read">Leer entrada &rarr;</span>' +
                '</div>' +
            '</a>' +
            '<span class="diary-page-num">' + (index + 1) + ' / ' + total + '</span>'
        );
    }

    function createPageEl(post, index, total) {
        var div = document.createElement('div');
        div.className = 'diary-book__page';
        div.innerHTML = buildPageHtml(post, index, total);
        return div;
    }

    function renderBook() {
        visiblePosts = filterPosts(allPosts);
        viewport.innerHTML = '';
        currentPage = 0;

        if (!visiblePosts.length) {
            navWrap.hidden = true;
            if (empty) {
                empty.hidden = false;
                empty.textContent = searchQuery
                    ? 'No hay entradas con ese criterio.'
                    : (JournalApp.t('journal.empty') || 'Aún no hay entradas publicadas.');
            }
            return;
        }

        if (empty) empty.hidden = true;

        visiblePosts.forEach(function (post, i) {
            var page = createPageEl(post, i, visiblePosts.length);
            if (i === 0) page.classList.add('is-active');
            viewport.appendChild(page);
        });

        if (visiblePosts.length > 1) {
            navWrap.hidden = false;
            updateNav();
        } else {
            navWrap.hidden = true;
        }
    }

    function updateNav() {
        btnPrev.disabled = currentPage <= 0;
        btnNext.disabled = currentPage >= visiblePosts.length - 1;
        pageInfo.textContent = (currentPage + 1) + ' / ' + visiblePosts.length;
    }

    function flipTo(newIndex, direction) {
        if (animating || newIndex < 0 || newIndex >= visiblePosts.length || newIndex === currentPage) return;
        animating = true;

        var pages = viewport.querySelectorAll('.diary-book__page');
        var oldPage = pages[currentPage];
        var newPage = pages[newIndex];

        var outClass = direction === 'forward' ? 'flip-out-fwd' : 'flip-out-back';
        var inClass = direction === 'forward' ? 'flip-in-fwd' : 'flip-in-back';

        oldPage.classList.add(outClass);
        newPage.classList.add('is-active', inClass);

        currentPage = newIndex;
        updateNav();

        setTimeout(function () {
            oldPage.classList.remove('is-active', outClass);
            newPage.classList.remove(inClass);
            animating = false;
        }, FLIP_MS);
    }

    btnPrev.addEventListener('click', function () {
        flipTo(currentPage - 1, 'back');
    });

    btnNext.addEventListener('click', function () {
        flipTo(currentPage + 1, 'forward');
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') flipTo(currentPage - 1, 'back');
        if (e.key === 'ArrowRight') flipTo(currentPage + 1, 'forward');
    });

    /* Touch swipe support */
    (function () {
        var startX = 0;
        var startY = 0;
        viewport.addEventListener('touchstart', function (e) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });

        viewport.addEventListener('touchend', function (e) {
            var dx = e.changedTouches[0].clientX - startX;
            var dy = e.changedTouches[0].clientY - startY;
            if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
            if (dx < 0) flipTo(currentPage + 1, 'forward');
            else flipTo(currentPage - 1, 'back');
        }, { passive: true });
    })();

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            searchQuery = searchInput.value.trim();
            renderBook();
        });
    }

    DDAJournal.fetchPosts().then(function (posts) {
        allPosts = posts.sort(function (a, b) {
            return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
        });
        renderBook();
    }).catch(function () {
        if (empty) empty.hidden = false;
    });

    JournalApp.bindNewsletterForm('journalNewsletterForm');

    window.addEventListener('languageChanged', function () {
        DDAJournal.fetchPosts().then(function (posts) {
            allPosts = posts.sort(function (a, b) {
                return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
            });
            renderBook();
        });
    });
});
