/**
 * Google & Apple sign-in for shop/user-login.html
 */
var DDAOAuthLogin = (function () {
    'use strict';

    var APPLE_LOGIN_ENABLED = false;
    var config = { googleClientId: '', appleClientId: '' };
    var initialized = false;

    function getApiBase() {
        return window.DDA_API_BASE || '/api';
    }

    function showOAuthError(message) {
        var errorBox = document.getElementById('loginError');
        var errorText = document.getElementById('loginErrorText');
        if (!errorBox || !errorText) return;
        errorText.textContent = message || 'No se pudo iniciar sesión';
        errorBox.hidden = false;
    }

    function redirectAfterLogin() {
        var params = new URLSearchParams(window.location.search);
        var returnTo = params.get('return');
        if (returnTo && returnTo.indexOf('user-login') === -1) {
            window.location.href = returnTo;
        } else {
            window.location.href = 'mi-cuenta.html';
        }
    }

    function handleOAuthSuccess(data, provider) {
        if (typeof DDAAuth !== 'undefined' && DDAAuth.saveOAuthSession) {
            DDAAuth.saveOAuthSession(data, provider);
        }
        if (typeof trackLogin === 'function') trackLogin(provider);
        redirectAfterLogin();
    }

    function handleGoogleCredential(response) {
        if (!response || !response.credential) {
            showOAuthError('Google no devolvió credenciales válidas.');
            return;
        }

        DDAAuth.loginWithGoogle(response.credential)
            .then(function (data) { handleOAuthSuccess(data, 'google'); })
            .catch(function (err) { showOAuthError(err.message); });
    }

    function initGoogle() {
        if (!config.googleClientId || !window.google || !google.accounts || !google.accounts.id) return;

        var mount = document.getElementById('googleSignInMount');
        if (!mount) return;

        google.accounts.id.initialize({
            client_id: config.googleClientId,
            callback: handleGoogleCredential,
            auto_select: false,
            cancel_on_tap_outside: true,
            context: 'signin',
            use_fedcm_for_prompt: false
        });

        google.accounts.id.renderButton(mount, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: Math.min(360, mount.offsetWidth || 320),
            click_listener: function () {
                var errorBox = document.getElementById('loginError');
                if (errorBox) errorBox.hidden = true;
            }
        });
    }

    function loadGoogleScript() {
        return new Promise(function (resolve) {
            if (window.google && google.accounts && google.accounts.id) {
                resolve();
                return;
            }
            var existing = document.getElementById('google-gsi-script');
            if (existing) {
                existing.addEventListener('load', function () { resolve(); });
                return;
            }
            var script = document.createElement('script');
            script.id = 'google-gsi-script';
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = function () { resolve(); };
            script.onerror = function () { resolve(); };
            document.head.appendChild(script);
        });
    }

    function loadAppleScript() {
        return new Promise(function (resolve) {
            if (window.AppleID) {
                resolve();
                return;
            }
            var existing = document.getElementById('apple-auth-script');
            if (existing) {
                existing.addEventListener('load', function () { resolve(); });
                return;
            }
            var script = document.createElement('script');
            script.id = 'apple-auth-script';
            script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
            script.async = true;
            script.defer = true;
            script.onload = function () { resolve(); };
            script.onerror = function () { resolve(); };
            document.head.appendChild(script);
        });
    }

    function initApple() {
        if (!config.appleClientId || !window.AppleID) return;

        var btn = document.getElementById('appleSignInBtn');
        if (!btn) return;

        AppleID.auth.init({
            clientId: config.appleClientId,
            scope: 'name email',
            redirectURI: window.location.origin + '/shop/user-login.html',
            usePopup: true
        });

        btn.hidden = false;
        btn.addEventListener('click', function () {
            AppleID.auth.signIn()
                .then(function (res) {
                    var auth = res && res.authorization;
                    if (!auth || !auth.id_token) {
                        showOAuthError('Apple no devolvió credenciales válidas.');
                        return;
                    }
                    var firstName = null;
                    var lastName = null;
                    if (res.user && res.user.name) {
                        firstName = res.user.name.firstName || null;
                        lastName = res.user.name.lastName || null;
                    }
                    return DDAAuth.loginWithApple(auth.id_token, firstName, lastName)
                        .then(function (data) { handleOAuthSuccess(data, 'apple'); });
                })
                .catch(function (err) {
                    if (err && err.error === 'popup_closed_by_user') return;
                    showOAuthError((err && err.error) ? String(err.error) : 'No se pudo iniciar sesión con Apple.');
                });
        });
    }

    function fetchConfig() {
        return fetch(getApiBase() + '/auth/oauth-config', {
            headers: { Accept: 'application/json' }
        }).then(function (res) {
            if (!res.ok) return null;
            return res.json();
        }).catch(function () { return null; });
    }

    function init() {
        if (initialized) return Promise.resolve();
        initialized = true;

        return fetchConfig().then(function (data) {
            config.googleClientId = (data && data.googleClientId) || '';
            config.appleClientId = (data && data.appleClientId) || '';

            var section = document.getElementById('oauthSection');
            var hasGoogle = !!config.googleClientId;
            var hasApple = APPLE_LOGIN_ENABLED && !!config.appleClientId;

            if (!hasGoogle && !hasApple) {
                if (section) section.hidden = true;
                return;
            }

            if (section) section.hidden = false;

            var tasks = [];
            if (hasGoogle) {
                tasks.push(loadGoogleScript().then(initGoogle));
            }
            if (hasApple) {
                tasks.push(loadAppleScript().then(initApple));
            }
            return Promise.all(tasks);
        });
    }

    return { init: init };
})();

document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('oauthSection')) {
        DDAOAuthLogin.init();
    }
});
