/**
 * Shared journal UI helpers.
 */
(function () {
    'use strict';

    function t(key) {
        var lang = localStorage.getItem('preferredLanguage') || 'es';
        var pt = window.pageTranslations && window.pageTranslations[lang];
        return (pt && pt[key]) || key;
    }

    function renderTags(tags) {
        if (!tags || !tags.length) return '';
        return tags.map(function (tag) {
            return '<span class="journal-tag">' + escapeHtml(tag) + '</span>';
        }).join('');
    }

    function escapeHtml(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function attrUrl(url) {
        return String(url || '').replace(/"/g, '&quot;');
    }

    function avatarHtml(name, url) {
        var initial = (name || '?').charAt(0).toUpperCase();
        if (url) {
            return '<div class="journal-comment__avatar"><img src="' + escapeHtml(url) + '" alt=""></div>';
        }
        return '<div class="journal-comment__avatar" aria-hidden="true">' + initial + '</div>';
    }

    function bindNewsletterForm(formId) {
        var form = document.getElementById(formId);
        if (!form || typeof DDANewsletter === 'undefined') return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var input = form.querySelector('input[type="email"]');
            var msg = form.querySelector('.newsletter-msg');
            var email = input && input.value.trim();
            if (!email) return;

            DDANewsletter.subscribe(email, 'journal').then(function () {
                if (msg) {
                    msg.textContent = t('journal.newsletter_ok');
                    msg.hidden = false;
                }
                form.reset();
            }).catch(function (err) {
                if (msg) {
                    msg.textContent = err.message;
                    msg.hidden = false;
                }
            });
        });
    }

    window.JournalApp = {
        t: t,
        renderTags: renderTags,
        escapeHtml: escapeHtml,
        attrUrl: attrUrl,
        avatarHtml: avatarHtml,
        bindNewsletterForm: bindNewsletterForm
    };
})();
