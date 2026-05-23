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

    function mediaOrigin() {
        if (window.DDA_MEDIA_BASE) {
            return String(window.DDA_MEDIA_BASE).replace(/\/$/, '');
        }
        var api = window.DDA_API_BASE || '/api';
        if (api.indexOf('http://') === 0 || api.indexOf('https://') === 0) {
            return api.replace(/\/api\/?$/, '');
        }
        return '';
    }

    function resolveMediaUrl(url) {
        if (!url) return '';
        var trimmed = String(url).trim();
        if (trimmed.indexOf('http://') === 0 || trimmed.indexOf('https://') === 0) {
            return trimmed;
        }
        if (trimmed.indexOf('/uploads/') === 0 || trimmed.indexOf('uploads/') === 0) {
            var path = trimmed.indexOf('/') === 0 ? trimmed : '/' + trimmed;
            var origin = mediaOrigin();
            return origin ? origin + path : path;
        }
        if (trimmed.indexOf('../') === 0) {
            var sitePath = trimmed.replace(/^(\.\.\/)+/, '/');
            if (typeof window !== 'undefined' && window.location && window.location.origin) {
                return window.location.origin + sitePath;
            }
            return sitePath;
        }
        if (trimmed.indexOf('/') === 0 && typeof window !== 'undefined' && window.location && window.location.origin) {
            return window.location.origin + trimmed;
        }
        return trimmed;
    }

    function resolveContentHtml(html) {
        if (!html) return '';
        var origin = mediaOrigin();
        var resolved = html;
        if (origin) {
            resolved = resolved.replace(/src=(["'])(\/uploads\/[^"']+)\1/gi, function (_, quote, path) {
                return 'src=' + quote + origin + path + quote;
            });
            resolved = resolved.replace(/src=(["'])(uploads\/[^"']+)\1/gi, function (_, quote, path) {
                return 'src=' + quote + origin + '/' + path + quote;
            });
        }
        resolved = resolved.replace(/src=(["'])(\.\.\/[^"']+)\1/gi, function (_, quote, path) {
            var sitePath = path.replace(/^(\.\.\/)+/, '/');
            if (typeof window !== 'undefined' && window.location && window.location.origin) {
                return 'src=' + quote + window.location.origin + sitePath + quote;
            }
            return 'src=' + quote + sitePath + quote;
        });
        return resolved;
    }

    function stripHtml(html) {
        if (!html) return '';
        var div = document.createElement('div');
        div.innerHTML = html;
        return (div.textContent || div.innerText || '').trim();
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

    function loadLocalPublishedPosts() {
        try {
            var raw = JSON.parse(localStorage.getItem('dda_journal_admin_posts') || '[]');
            return raw.filter(function (p) {
                return p.status === 'PUBLISHED';
            }).map(normalizePost);
        } catch (e) {
            return [];
        }
    }

    function mergeBySlug(lists) {
        var map = {};
        lists.forEach(function (list) {
            (list || []).forEach(function (post) {
                if (post && post.slug) map[post.slug] = post;
            });
        });
        return Object.keys(map).map(function (key) { return map[key]; });
    }

    function fetchPostsFromApi() {
        return fetch(API_BASE + '/journal/posts?status=PUBLISHED&size=50')
            .then(function (res) {
                if (!res.ok) throw new Error('API unavailable');
                return res.json();
            })
            .then(function (data) {
                var list = data.content || data.posts || data;
                if (!Array.isArray(list)) return [];
                return list.map(normalizePost);
            });
    }

    function fetchPosts() {
        return fetchPostsFromApi()
            .then(function (apiPosts) {
                return mergeBySlug([apiPosts, loadLocalPublishedPosts()]);
            })
            .catch(function () {
                return loadStaticPosts().then(function (staticPosts) {
                    return mergeBySlug([staticPosts, loadLocalPublishedPosts()]);
                });
            });
    }

    function fetchPostBySlug(slug) {
        return fetch(API_BASE + '/journal/posts/slug/' + encodeURIComponent(slug))
            .then(function (res) {
                if (!res.ok) throw new Error('Not found');
                return res.json();
            })
            .then(normalizePost)
            .catch(function () {
                return fetchPosts().then(function (posts) {
                    var found = posts.find(function (p) { return p.slug === slug; });
                    if (!found) throw new Error('Post not found');
                    return found;
                });
            });
    }

    function normalizePost(raw) {
        var lang = getLang();
        var excerptRaw = pickLocalized(raw.excerpt, lang);
        var contentRaw = pickLocalized(raw.content, lang);
        return {
            id: String(raw.id),
            slug: raw.slug,
            title: pickLocalized(raw.title, lang),
            excerpt: stripHtml(excerptRaw).slice(0, 220) || stripHtml(contentRaw).slice(0, 220),
            content: resolveContentHtml(contentRaw),
            coverImage: resolveMediaUrl(raw.coverImage || ''),
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
                    return c.status === 'APPROVED' || !c.status;
                });
            });
    }

    function addComment(postId, text) {
        if (typeof DDAAuth === 'undefined' || !DDAAuth.isAuthenticated()) {
            return Promise.reject(new Error('LOGIN_REQUIRED'));
        }
        var user = DDAAuth.getUser();
        var comment = {
            id: 'c_' + Date.now(),
            postId: String(postId),
            authorName: user ? user.username : 'Usuario',
            content: text,
            status: 'APPROVED',
            createdAt: new Date().toISOString()
        };

        return fetch(API_BASE + '/journal/posts/' + postId + '/comments', {
            method: 'POST',
            headers: DDAAuth.authHeaders(),
            body: JSON.stringify({ content: text })
        }).then(function (res) {
            if (res.status === 401) return Promise.reject(new Error('LOGIN_REQUIRED'));
            if (!res.ok) {
                return res.text().then(function (t) {
                    throw new Error(t || 'No se pudo publicar el comentario');
                });
            }
            return res.json();
        }).catch(function (err) {
            if (err && err.message === 'LOGIN_REQUIRED') throw err;
            return saveLocalComment(postId, comment);
        });
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
        pickLocalized: pickLocalized,
        resolveMediaUrl: resolveMediaUrl,
        resolveContentHtml: resolveContentHtml
    };
})();
