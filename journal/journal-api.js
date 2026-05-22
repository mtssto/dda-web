/**
 * Journal API client with static JSON + localStorage fallback.
 */
var DDAJournal = (function () {
    'use strict';

    var API_BASE = window.DDA_API_BASE || '/api';
    var STATIC_DATA = 'data/posts.json';
    var LIKES_KEY = 'dda_journal_likes';
    var SAVES_KEY = 'dda_journal_saves';
    var COMMENTS_KEY = 'dda_journal_comments';

    function getLang() {
        return localStorage.getItem('preferredLanguage') || 'es';
    }

    function pickLocalized(obj, lang) {
        if (!obj) return '';
        if (typeof obj === 'string') return obj;
        return obj[lang] || obj.es || obj.en || '';
    }

    function loadStaticPosts() {
        return fetch(STATIC_DATA)
            .then(function (r) {
                if (!r.ok) throw new Error('Static data unavailable');
                return r.json();
            })
            .then(function (data) {
                return (data.posts || []).filter(function (p) {
                    return p.status === 'PUBLISHED';
                }).map(normalizePost);
            });
    }

    function fetchPosts() {
        return loadStaticPosts().catch(function () {
            return fetch(API_BASE + '/journal/posts?status=PUBLISHED&size=50')
                .then(function (res) {
                    if (!res.ok) throw new Error('API unavailable');
                    return res.json();
                })
                .then(function (data) {
                    var list = data.content || data.posts || data;
                    if (!list || !list.length) throw new Error('No API posts');
                    return list.map(normalizePost);
                })
                .catch(function () {
                    return loadStaticPosts();
                });
        });
    }

    function fetchPostBySlug(slug) {
        return fetchPosts().then(function (posts) {
            var found = posts.find(function (p) { return p.slug === slug; });
            if (found) return found;
            throw new Error('Post not found');
        }).catch(function () {
            return fetch(API_BASE + '/journal/posts/slug/' + encodeURIComponent(slug))
                .then(function (res) {
                    if (!res.ok) throw new Error('Not found');
                    return res.json();
                })
                .then(normalizePost);
        });
    }

    function normalizePost(raw) {
        var lang = getLang();
        return {
            id: String(raw.id),
            slug: raw.slug,
            title: pickLocalized(raw.title, lang),
            excerpt: pickLocalized(raw.excerpt, lang),
            content: pickLocalized(raw.content, lang),
            coverImage: raw.coverImage || '',
            tags: raw.tags || [],
            publishedAt: raw.publishedAt,
            readMinutes: raw.readMinutes || 5,
            likes: raw.likes || 0,
            author: raw.author || { displayName: 'Diego De Aduriz', username: 'diegodeaduriz' },
            embeds: raw.embeds || []
        };
    }

    function readLocal(key) {
        try {
            return JSON.parse(localStorage.getItem(key) || '{}');
        } catch (e) {
            return {};
        }
    }

    function writeLocal(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    function userKey() {
        if (typeof DDAAuth !== 'undefined' && DDAAuth.getUser()) {
            return DDAAuth.getUser().username;
        }
        var anon = localStorage.getItem('dda_anon_id');
        if (!anon) {
            anon = 'anon_' + Math.random().toString(36).slice(2, 10);
            localStorage.setItem('dda_anon_id', anon);
        }
        return anon;
    }

    function isLiked(postId) {
        var likes = readLocal(LIKES_KEY);
        var list = likes[userKey()] || [];
        return list.indexOf(String(postId)) !== -1;
    }

    function toggleLike(postId) {
        var likes = readLocal(LIKES_KEY);
        var key = userKey();
        var list = likes[key] || [];
        var id = String(postId);
        var idx = list.indexOf(id);
        var liked;
        if (idx === -1) {
            list.push(id);
            liked = true;
        } else {
            list.splice(idx, 1);
            liked = false;
        }
        likes[key] = list;
        writeLocal(LIKES_KEY, likes);

        if (typeof DDAAuth !== 'undefined' && DDAAuth.isAuthenticated()) {
            fetch(API_BASE + '/journal/posts/' + id + '/like', {
                method: 'POST',
                headers: DDAAuth.authHeaders()
            }).catch(function () {});
        }
        return liked;
    }

    function isSaved(postId) {
        var saves = readLocal(SAVES_KEY);
        var list = saves[userKey()] || [];
        return list.indexOf(String(postId)) !== -1;
    }

    function toggleSave(postId) {
        var saves = readLocal(SAVES_KEY);
        var key = userKey();
        var list = saves[key] || [];
        var id = String(postId);
        var idx = list.indexOf(id);
        if (idx === -1) list.push(id);
        else list.splice(idx, 1);
        saves[key] = list;
        writeLocal(SAVES_KEY, saves);
        return idx === -1;
    }

    function getSavedPostIds() {
        var saves = readLocal(SAVES_KEY);
        return saves[userKey()] || [];
    }

    function getComments(postId) {
        return fetch(API_BASE + '/journal/posts/' + postId + '/comments')
            .then(function (res) {
                if (!res.ok) throw new Error('API');
                return res.json();
            })
            .catch(function () {
                var all = readLocal(COMMENTS_KEY);
                return (all[postId] || []).filter(function (c) {
                    return c.status !== 'REJECTED';
                });
            });
    }

    function addComment(postId, text) {
        var user = typeof DDAAuth !== 'undefined' ? DDAAuth.getUser() : null;
        var comment = {
            id: 'c_' + Date.now(),
            postId: String(postId),
            authorName: user ? user.username : 'Guest',
            content: text,
            status: 'PENDING',
            createdAt: new Date().toISOString()
        };

        if (typeof DDAAuth !== 'undefined' && DDAAuth.isAuthenticated()) {
            return fetch(API_BASE + '/journal/posts/' + postId + '/comments', {
                method: 'POST',
                headers: DDAAuth.authHeaders(),
                body: JSON.stringify({ content: text })
            }).then(function (res) {
                if (!res.ok) throw new Error('Failed');
                return res.json();
            }).catch(function () {
                return saveLocalComment(postId, comment);
            });
        }
        return Promise.resolve(saveLocalComment(postId, comment));
    }

    function saveLocalComment(postId, comment) {
        var all = readLocal(COMMENTS_KEY);
        if (!all[postId]) all[postId] = [];
        all[postId].unshift(comment);
        writeLocal(COMMENTS_KEY, all);
        return comment;
    }

    function formatDate(iso, lang) {
        if (!iso) return '';
        var d = new Date(iso);
        return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-AR', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    return {
        fetchPosts: fetchPosts,
        fetchPostBySlug: fetchPostBySlug,
        toggleLike: toggleLike,
        isLiked: isLiked,
        toggleSave: toggleSave,
        isSaved: isSaved,
        getSavedPostIds: getSavedPostIds,
        getComments: getComments,
        addComment: addComment,
        formatDate: formatDate,
        getLang: getLang,
        pickLocalized: pickLocalized
    };
})();
