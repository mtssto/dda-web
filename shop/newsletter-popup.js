/**
 * Newsletter popup — shows after scroll or delay on pages that include it.
 * Respects a localStorage flag so it only shows once per session.
 */
(function () {
    'use strict';

    var STORAGE_KEY = 'dda_nl_popup_dismissed';
    var DELAY_MS = 25000;
    var SCROLL_THRESHOLD = 0.55;

    if (localStorage.getItem(STORAGE_KEY)) return;

    var shown = false;

    function createPopup() {
        if (shown) return;
        shown = true;

        var overlay = document.createElement('div');
        overlay.id = 'nlPopupOverlay';
        overlay.innerHTML =
            '<div class="nl-popup">' +
                '<button class="nl-popup-close" aria-label="Cerrar">&times;</button>' +
                '<h3 class="nl-popup-title">Mantenete al d\u00eda</h3>' +
                '<p class="nl-popup-desc">Recib\u00ed novedades sobre obras, exposiciones y contenido exclusivo.</p>' +
                '<form class="nl-popup-form" id="nlPopupForm">' +
                    '<input type="email" name="email" required placeholder="tu@email.com" autocomplete="email" class="nl-popup-input">' +
                    '<button type="submit" class="nl-popup-btn">Suscribirme</button>' +
                '</form>' +
                '<p class="nl-popup-msg" id="nlPopupMsg" hidden></p>' +
                '<p class="nl-popup-fine">Sin spam. Pod\u00e9s desuscribirte cuando quieras.</p>' +
            '</div>';

        document.body.appendChild(overlay);

        var closeBtn = overlay.querySelector('.nl-popup-close');
        closeBtn.addEventListener('click', dismiss);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) dismiss();
        });
        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape') {
                dismiss();
                document.removeEventListener('keydown', handler);
            }
        });

        var form = document.getElementById('nlPopupForm');
        var msg = document.getElementById('nlPopupMsg');

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var email = form.querySelector('input[name="email"]').value.trim();
            if (!email) return;

            var btn = form.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Enviando...';
            msg.hidden = true;

            var API_BASE = window.DDA_API_BASE || '/api';
            fetch(API_BASE + '/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, source: 'popup' })
            })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                msg.textContent = data.message || '\u00a1Gracias por suscribirte!';
                msg.className = 'nl-popup-msg success';
                msg.hidden = false;
                form.style.display = 'none';
                localStorage.setItem(STORAGE_KEY, '1');
                setTimeout(dismiss, 3000);
            })
            .catch(function () {
                msg.textContent = 'Error. Intent\u00e1 de nuevo.';
                msg.className = 'nl-popup-msg error';
                msg.hidden = false;
                btn.disabled = false;
                btn.textContent = 'Suscribirme';
            });
        });

        requestAnimationFrame(function () {
            overlay.classList.add('is-visible');
        });
    }

    function dismiss() {
        var overlay = document.getElementById('nlPopupOverlay');
        if (overlay) {
            overlay.classList.remove('is-visible');
            setTimeout(function () { overlay.remove(); }, 300);
        }
        localStorage.setItem(STORAGE_KEY, '1');
    }

    setTimeout(createPopup, DELAY_MS);

    window.addEventListener('scroll', function onScroll() {
        var scrolled = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        if (scrolled >= SCROLL_THRESHOLD) {
            createPopup();
            window.removeEventListener('scroll', onScroll);
        }
    });
})();
