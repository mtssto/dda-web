/**
 * Shared comments UI for obra detail and other shop pages.
 */
var DDAComments = (function () {
    'use strict';

    var API_BASE = window.DDA_API_BASE || '/api';
    var LOCAL_ARTWORK_KEY = 'dda_artwork_comments';

    function escapeHtml(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function authorInitials(name) {
        return String(name || 'U').split(/\s+/).map(function (w) {
            return w.charAt(0);
        }).join('').slice(0, 2).toUpperCase();
    }

    function formatDate(iso) {
        if (!iso) return '';
        try {
            return new Date(iso).toLocaleDateString('es-AR', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        } catch (e) {
            return '';
        }
    }

    function loginUrl() {
        return 'user-login.html?return=' + encodeURIComponent(window.location.pathname + window.location.search);
    }

    function readLocalArtwork(slug) {
        try {
            var all = JSON.parse(localStorage.getItem(LOCAL_ARTWORK_KEY) || '{}');
            return (all[slug] || []).filter(function (c) {
                return c.status === 'APPROVED' || !c.status;
            });
        } catch (e) {
            return [];
        }
    }

    function saveLocalArtwork(slug, comment) {
        var all = JSON.parse(localStorage.getItem(LOCAL_ARTWORK_KEY) || '{}');
        if (!all[slug]) all[slug] = [];
        all[slug].unshift(comment);
        localStorage.setItem(LOCAL_ARTWORK_KEY, JSON.stringify(all));
    }

    function fetchArtworkComments(slug) {
        return fetch(API_BASE + '/artworks/' + encodeURIComponent(slug) + '/comments', {
            headers: { Accept: 'application/json' }
        }).then(function (res) {
            if (!res.ok) throw new Error('API');
            return res.json();
        }).catch(function () {
            return readLocalArtwork(slug);
        });
    }

    function postArtworkComment(slug, text) {
        if (typeof DDAAuth === 'undefined' || !DDAAuth.isAuthenticated()) {
            return Promise.reject(new Error('LOGIN_REQUIRED'));
        }
        return fetch(API_BASE + '/artworks/' + encodeURIComponent(slug) + '/comments', {
            method: 'POST',
            credentials: 'include',
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
            var user = DDAAuth.getUser();
            var local = {
                id: 'local_' + Date.now(),
                authorName: user ? user.username : 'Usuario',
                content: text,
                status: 'APPROVED',
                createdAt: new Date().toISOString()
            };
            saveLocalArtwork(slug, local);
            return local;
        });
    }

    function renderCommentList(listEl, comments) {
        if (!listEl) return;
        if (!comments || !comments.length) {
            listEl.innerHTML = '<li class="obra-comment-empty">Todavía no hay comentarios. Sé el primero en dejar tu opinión.</li>';
            return;
        }
        listEl.innerHTML = comments.map(function (c) {
            var name = c.authorName || c.username || 'Usuario';
            return (
                '<li class="obra-comment">' +
                    '<div class="obra-comment__avatar" aria-hidden="true">' + escapeHtml(authorInitials(name)) + '</div>' +
                    '<div class="obra-comment__body">' +
                        '<div class="obra-comment__head">' +
                            '<span class="obra-comment__author">' + escapeHtml(name) + '</span>' +
                            '<time class="obra-comment__date">' + escapeHtml(formatDate(c.createdAt)) + '</time>' +
                        '</div>' +
                        '<p class="obra-comment__text">' + escapeHtml(c.content) + '</p>' +
                    '</div>' +
                '</li>'
            );
        }).join('');
    }

    function mountArtworkSection(slug, options) {
        options = options || {};
        var section = document.getElementById(options.sectionId || 'obraCommentsSection');
        var listEl = document.getElementById(options.listId || 'obraCommentList');
        var form = document.getElementById(options.formId || 'obraCommentForm');
        var hint = document.getElementById(options.hintId || 'obraCommentHint');
        var textarea = document.getElementById(options.textareaId || 'obraCommentText');
        if (!section || !listEl || !form) return;

        section.style.display = 'block';

        function load() {
            fetchArtworkComments(slug).then(function (comments) {
                renderCommentList(listEl, comments);
            });
        }

        function applyAuthGate() {
            var authed = typeof DDAAuth !== 'undefined' && DDAAuth.isAuthenticated();
            var submitBtn = form.querySelector('button[type="submit"]');
            if (textarea) textarea.disabled = !authed;
            if (submitBtn) submitBtn.disabled = !authed;
            if (hint) {
                if (!authed) {
                    hint.hidden = false;
                    hint.innerHTML = 'Para comentar necesitás una cuenta. <a href="' + loginUrl() + '">Iniciá sesión</a> o <a href="user-login.html#register">creá una cuenta</a>.';
                } else {
                    hint.hidden = true;
                    hint.textContent = '';
                }
            }
        }

        applyAuthGate();
        load();

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (typeof DDAAuth === 'undefined' || !DDAAuth.isAuthenticated()) {
                window.location.href = loginUrl();
                return;
            }
            var text = textarea ? textarea.value.trim() : '';
            if (!text) return;

            postArtworkComment(slug, text).then(function () {
                if (textarea) textarea.value = '';
                if (hint) {
                    hint.hidden = false;
                    hint.classList.remove('is-error');
                    hint.textContent = 'Comentario publicado.';
                }
                load();
            }).catch(function (err) {
                if (err && err.message === 'LOGIN_REQUIRED') {
                    window.location.href = loginUrl();
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

    return {
        mountArtworkSection: mountArtworkSection,
        fetchArtworkComments: fetchArtworkComments,
        postArtworkComment: postArtworkComment
    };
})();
