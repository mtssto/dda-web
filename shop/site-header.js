/**
 * Shared site header: back link, brand, auth actions.
 */
(function () {
    'use strict';

    function initSiteHeader() {
        var header = document.querySelector('.close-container');
        if (!header || header.dataset.enhanced === 'true') return;

        var closeBtn = header.querySelector('.close-btn');
        var authBtns = header.querySelector('.auth-header-btns');
        var backHref = (closeBtn && closeBtn.getAttribute('href')) || header.dataset.backHref || '../index.html';
        var backLabel = header.dataset.backLabel || '← Inicio';
        var brandHref = header.dataset.brandHref || '../index.html';
        var brandText = header.dataset.brandText || 'Diego De Aduriz';

        var left = document.createElement('div');
        left.className = 'site-header-left';

        var back = document.createElement('a');
        back.className = 'site-header-back';
        back.href = backHref;
        back.textContent = backLabel;
        left.appendChild(back);

        var lang = header.querySelector('.lang-switcher-global');
        if (lang) {
            lang.classList.add('site-header-lang');
            left.appendChild(lang);
        }

        var brand = document.createElement('a');
        brand.className = 'site-header-brand';
        brand.href = brandHref;
        brand.textContent = brandText;

        if (closeBtn) closeBtn.remove();

        header.classList.add('site-header');
        header.insertBefore(left, header.firstChild);
        if (authBtns) {
            header.insertBefore(brand, authBtns);
        } else {
            header.appendChild(brand);
        }

        header.dataset.enhanced = 'true';
    }

    function initAuthHeader() {
        var authBtns = document.getElementById('authHeaderBtns');
        if (!authBtns || typeof DDAAuth === 'undefined') return;

        var cartBtnHtml = '<a href="cart.html" class="auth-header-link cart-header-link" aria-label="Carrito">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>' +
            '<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>' +
            '<span class="cart-badge" style="display:none">0</span></a>';

        if (DDAAuth.isAuthenticated()) {
            var user = DDAAuth.getUser();
            var isAdmin = user && user.role === 'ADMIN';
            authBtns.innerHTML = cartBtnHtml +
                '<a href="mi-cuenta.html" class="auth-header-link">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ' +
                'MI CUENTA</a>' +
                (isAdmin ? '<a href="admin.html" class="auth-header-link">PANEL</a>' : '') +
                '<a href="#" class="auth-header-link" id="headerLogout">SALIR</a>';

            var logoutLink = document.getElementById('headerLogout');
            if (logoutLink) {
                logoutLink.addEventListener('click', function (e) {
                    e.preventDefault();
                    DDAAuth.logout();
                });
            }
        }

        if (typeof DDACart !== 'undefined') {
            DDACart.updateBadge();
        }
    }

    function boot() {
        initSiteHeader();
        if (typeof DDAAuth !== 'undefined' && typeof DDAAuth.init === 'function') {
            DDAAuth.init().then(initAuthHeader);
        } else {
            initAuthHeader();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
