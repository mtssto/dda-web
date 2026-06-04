/**
 * Newsletter — shop form init + programmatic subscribe API.
 */
var DDANewsletter = (function () {
    'use strict';

    var API_BASE = window.DDA_API_BASE || '/api';

    function subscribe(email, source) {
        return fetch(API_BASE + '/newsletter/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, source: source || 'web' })
        }).then(function (res) {
            return res.json().then(function (data) {
                return { ok: res.ok, data: data };
            });
        }).then(function (result) {
            if (!result.ok) {
                var msg = result.data.message || result.data.email || 'Could not subscribe';
                throw new Error(msg);
            }
            return result.data;
        }).catch(function (err) {
            var queue = JSON.parse(localStorage.getItem('dda_newsletter_queue') || '[]');
            if (queue.indexOf(email) === -1) queue.push(email);
            localStorage.setItem('dda_newsletter_queue', JSON.stringify(queue));
            if (err.message && err.message !== 'Failed to fetch') throw err;
            return { queued: true, email: email, message: 'Queued locally' };
        });
    }

    function subscribeWithAuth(email) {
        return fetch(API_BASE + '/newsletter/subscribe', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, source: 'registration' })
        });
    }

    function initNewsletter() {
        var form = document.getElementById('newsletterForm');
        if (!form) return;

        var emailInput = document.getElementById('newsletterEmail');
        var btn = document.getElementById('newsletterBtn');
        var msg = document.getElementById('newsletterMsg');

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            var email = emailInput.value.trim();
            if (!email) return;

            btn.disabled = true;
            btn.textContent = 'Enviando...';
            msg.textContent = '';
            msg.className = 'newsletter-msg';

            subscribe(email, 'shop')
                .then(function (data) {
                    msg.textContent = data.message || '¡Gracias por suscribirte!';
                    msg.className = 'newsletter-msg success';
                    emailInput.value = '';
                })
                .catch(function (err) {
                    msg.textContent = err.message || 'Error al suscribirte. Intentá de nuevo.';
                    msg.className = 'newsletter-msg error';
                })
                .finally(function () {
                    btn.disabled = false;
                    btn.textContent = 'Suscribirme';
                });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNewsletter);
    } else {
        initNewsletter();
    }

    return { subscribe: subscribe, subscribeWithAuth: subscribeWithAuth, init: initNewsletter };
})();
