/**
 * Platform header — auth-aware navbar, EN/ES switcher, mobile drawer.
 */
(function () {
    'use strict';

    function shopPrefix() {
        var path = window.location.pathname;
        if (path.indexOf('/journal/') !== -1) return '../shop/';
        if (path.indexOf('/shop/') !== -1) return '';
        return 'shop/';
    }

    function journalPrefix() {
        var path = window.location.pathname;
        if (path.indexOf('/journal/') !== -1) return '';
        return '../journal/';
    }

    function sitePrefix() {
        var path = window.location.pathname;
        if (path.indexOf('/journal/') !== -1) return '../';
        if (path.indexOf('/shop/') !== -1) return '../';
        return '';
    }

    function getConfig() {
        var sp = shopPrefix();
        var jp = journalPrefix();
        var site = sitePrefix();
        return {
            brandHref: sp + 'shop.html',
            brandText: 'Diego De Aduriz',
            closeHref: site + 'index.html',
            nav: [
                { href: sp + 'shop.html', key: 'nav.shop', match: /shop\.html$/ },
                { href: sp + 'catalog.html', key: 'nav.catalog', match: /catalog\.html$/ },
                { href: jp + 'index.html', key: 'nav.journal', match: /journal\// }
            ],
            loginHref: sp + 'user-login.html',
            registerHref: sp + 'user-login.html#register',
            accountHref: sp + 'mi-cuenta.html',
            profileHref: jp + 'profile.html',
            adminHref: sp + 'admin.html',
            journalAdminHref: jp + 'admin.html'
        };
    }

    var CONFIG = getConfig();

    function t(key) {
        var lang = localStorage.getItem('preferredLanguage') || 'es';
        var pt = window.platformTranslations && window.platformTranslations[lang];
        if (pt && pt[key]) return pt[key];
        var common = window.translations && window.translations[lang];
        if (common && common[key]) return common[key];
        return key;
    }

    function langSwitcherHtml() {
        return (
            '<div class="lang-switcher-platform" role="group" aria-label="' + t('lang.switch') + '">' +
                '<a href="#" class="lang-btn" data-lang="es">ES</a>' +
                '<span class="lang-divider" aria-hidden="true"></span>' +
                '<a href="#" class="lang-btn" data-lang="en">EN</a>' +
            '</div>'
        );
    }

    function authHtml() {
        if (typeof DDAAuth !== 'undefined' && DDAAuth.isAuthenticated()) {
            var user = DDAAuth.getUser();
            var isAdmin = user && user.role === 'ADMIN';
            var name = user && user.username ? user.username : t('auth.my_account');
            return (
                '<div class="platform-header__auth" id="authHeaderBtns">' +
                    '<a href="' + CONFIG.profileHref + '" class="auth-header-link">' +
                        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
                            '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' +
                        '</svg>' +
                        '<span class="auth-label">' + name.toUpperCase() + '</span>' +
                    '</a>' +
                    (isAdmin ? '<a href="' + CONFIG.adminHref + '" class="auth-header-link"><span class="auth-label">' + t('auth.admin') + '</span></a>' : '') +
                    (isAdmin ? '<a href="' + CONFIG.journalAdminHref + '" class="auth-header-link"><span class="auth-label">' + t('admin.journal') + '</span></a>' : '') +
                    '<a href="#" class="auth-header-link" id="headerLogout"><span class="auth-label">' + t('auth.logout') + '</span></a>' +
                '</div>'
            );
        }
        return (
            '<div class="platform-header__auth" id="authHeaderBtns">' +
                '<a href="' + CONFIG.registerHref + '" class="auth-header-link auth-header-link--primary" data-i18n="auth.create_account">' +
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
                        '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/>' +
                        '<line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>' +
                    '</svg>' +
                    '<span class="auth-label">' + t('auth.create_account') + '</span>' +
                '</a>' +
                '<a href="' + CONFIG.loginHref + '" class="auth-header-link" data-i18n="auth.log_in">' +
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
                        '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' +
                    '</svg>' +
                    '<span class="auth-label">' + t('auth.log_in') + '</span>' +
                '</a>' +
            '</div>'
        );
    }

    function navLinksHtml() {
        var path = window.location.pathname;
        return CONFIG.nav.map(function (item) {
            var active = item.match.test(path) ? ' is-active' : '';
            return '<a href="' + item.href + '" class="' + active.trim() + '" data-i18n="' + item.key + '">' + t(item.key) + '</a>';
        }).join('');
    }

    function buildHeader(closeHref) {
        var close = closeHref || CONFIG.closeHref;
        return (
            '<header class="platform-header" id="platformHeader">' +
                '<div class="platform-header__main">' +
                    '<a href="' + CONFIG.brandHref + '" class="platform-header__brand">' + CONFIG.brandText + '</a>' +
                    '<nav class="platform-header__nav" aria-label="Primary">' + navLinksHtml() + '</nav>' +
                    '<div class="platform-header__actions">' +
                        langSwitcherHtml() +
                        authHtml() +
                        '<button type="button" class="platform-header__burger" id="platformBurger" aria-expanded="false" aria-controls="platformDrawer" data-i18n="nav.menu">' + t('nav.menu') + '</button>' +
                    '</div>' +
                '</div>' +
                '<div class="platform-header__secondary">' +
                    '<a href="' + close + '" class="close-btn" data-i18n="close">' + t('close') + '</a>' +
                '</div>' +
            '</header>' +
            '<div class="platform-drawer__overlay" id="platformDrawerOverlay" hidden></div>' +
            '<aside class="platform-drawer" id="platformDrawer" aria-hidden="true">' +
                '<nav aria-label="Mobile">' + navLinksHtml() +
                    '<div class="platform-drawer__section">' +
                        '<div class="platform-drawer__section-label" data-i18n="lang.switch">' + t('lang.switch') + '</div>' +
                        langSwitcherHtml() +
                    '</div>' +
                    '<div class="platform-drawer__section" id="platformDrawerAuth"></div>' +
                '</nav>' +
            '</aside>'
        );
    }

    function setDrawerOpen(open) {
        var drawer = document.getElementById('platformDrawer');
        var overlay = document.getElementById('platformDrawerOverlay');
        var burger = document.getElementById('platformBurger');
        if (!drawer) return;
        drawer.classList.toggle('is-open', open);
        if (overlay) {
            overlay.classList.toggle('is-open', open);
            overlay.hidden = !open;
        }
        drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
        if (burger) burger.setAttribute('aria-expanded', String(open));
        document.body.style.overflow = open ? 'hidden' : '';
    }

    function bindEvents() {
        var burger = document.getElementById('platformBurger');
        var overlay = document.getElementById('platformDrawerOverlay');
        if (burger) burger.addEventListener('click', function () { setDrawerOpen(true); });
        if (overlay) overlay.addEventListener('click', function () { setDrawerOpen(false); });

        document.getElementById('platformDrawer') && document.getElementById('platformDrawer').addEventListener('click', function (e) {
            if (e.target.tagName === 'A' && !e.target.classList.contains('lang-btn')) setDrawerOpen(false);
        });

        var logout = document.getElementById('headerLogout');
        if (logout) {
            logout.addEventListener('click', function (e) {
                e.preventDefault();
                if (typeof DDAAuth !== 'undefined') DDAAuth.logout();
            });
        }

        window.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') setDrawerOpen(false);
        });

        window.addEventListener('languageChanged', function () {
            refreshI18nInHeader();
        });
    }

    function refreshI18nInHeader() {
        document.querySelectorAll('.platform-header [data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            el.textContent = t(key);
        });
        document.querySelectorAll('.lang-switcher-platform .lang-btn').forEach(function (btn) {
            var lang = localStorage.getItem('preferredLanguage') || 'es';
            btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
        });
        var drawerAuth = document.getElementById('platformDrawerAuth');
        if (drawerAuth) drawerAuth.innerHTML = document.getElementById('authHeaderBtns') ? document.getElementById('authHeaderBtns').innerHTML : '';
    }

    function mount(options) {
        options = options || {};
        CONFIG = getConfig();
        var root = document.querySelector('[data-platform-header]') || document.querySelector('.close-container');
        if (!root) return;

        var closeHref = options.closeHref || root.getAttribute('data-close-href') || CONFIG.closeHref;
        if (options.brandHref) CONFIG.brandHref = options.brandHref;
        if (options.closeHref) CONFIG.closeHref = options.closeHref;

        root.outerHTML = buildHeader(closeHref);
        document.body.classList.add('has-platform-header');

        if (options.theme === 'light') {
            document.body.classList.add('platform-shop-light');
        } else {
            document.body.classList.add('platform-dark');
        }

        bindEvents();
        refreshI18nInHeader();

        var lang = localStorage.getItem('preferredLanguage') || 'es';
        document.documentElement.lang = lang;
    }

    window.PlatformHeader = { mount: mount, refresh: refreshI18nInHeader };

    document.addEventListener('DOMContentLoaded', function () {
        if (!document.querySelector('[data-platform-header]') && !document.querySelector('.close-container')) {
            return;
        }
        if (document.getElementById('platformHeader')) {
            refreshI18nInHeader();
            return;
        }
        var auto = document.body.getAttribute('data-platform-auto');
        if (auto !== 'false') {
            mount({
                theme: document.body.getAttribute('data-platform-theme') || 'dark',
                closeHref: document.body.getAttribute('data-close-href')
            });
        }
    });
})();
