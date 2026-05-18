(function () {
    'use strict';

    var API_BASE = window.DDA_API_BASE || '/api';

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

            fetch(API_BASE + '/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            })
            .then(function (res) {
                return res.json().then(function (data) {
                    return { ok: res.ok, data: data };
                });
            })
            .then(function (result) {
                if (result.ok) {
                    msg.textContent = result.data.message || '¡Gracias por suscribirte!';
                    msg.className = 'newsletter-msg success';
                    emailInput.value = '';
                } else {
                    var errorMsg = result.data.message || result.data.email || 'Error al suscribirte. Intentá de nuevo.';
                    msg.textContent = errorMsg;
                    msg.className = 'newsletter-msg error';
                }
            })
            .catch(function () {
                msg.textContent = 'Error de conexión. Intentá más tarde.';
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
})();
