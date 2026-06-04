/**

 * DDA Auth — JWT authentication client for the DDA Art Shop backend.

 * Session token is stored in an httpOnly cookie (not accessible to JavaScript).

 */

var DDAAuth = (function () {

    'use strict';



    var API_BASE = window.DDA_API_BASE || '/api';

    var USER_KEY = 'dda_auth_user';

    var LEGACY_TOKEN_KEY = 'dda_auth_token';



    var initPromise = null;



    function migrateLegacyStorage() {

        localStorage.removeItem(LEGACY_TOKEN_KEY);

        var legacyUser = localStorage.getItem(USER_KEY);

        if (legacyUser) {

            sessionStorage.setItem(USER_KEY, legacyUser);

            localStorage.removeItem(USER_KEY);

        }

    }



    function getUser() {

        var raw = sessionStorage.getItem(USER_KEY);

        if (!raw) return null;

        try { return JSON.parse(raw); } catch (e) { return null; }

    }



    function saveUser(data) {

        if (!data || !data.username) return;

        sessionStorage.setItem(USER_KEY, JSON.stringify({

            username: data.username,

            role: data.role

        }));

    }



    function clearAuth() {

        sessionStorage.removeItem(USER_KEY);

    }



    function isAuthenticated() {

        return !!getUser();

    }



    function isAdmin() {

        var user = getUser();

        return isAuthenticated() && user && user.role === 'ADMIN';

    }



    function refreshSession() {

        return fetch(API_BASE + '/auth/me', {

            method: 'GET',

            credentials: 'include',

            headers: { Accept: 'application/json' }

        }).then(function (res) {

            if (res.ok) {

                return res.json().then(function (data) {

                    saveUser(data);

                    return data;

                });

            }

            clearAuth();

            return null;

        }).catch(function () {

            clearAuth();

            return null;

        });

    }



    function init() {

        migrateLegacyStorage();

        if (!initPromise) {

            initPromise = refreshSession();

        }

        return initPromise;

    }



    function login(username, password) {

        return fetch(API_BASE + '/auth/login', {

            method: 'POST',

            credentials: 'include',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({ username: username, password: password })

        }).then(function (res) {

            return res.json().then(function (data) {

                if (!res.ok) {

                    var err = new Error(data.message || 'Usuario o contraseña incorrectos');

                    if (data.pendingVerification) err.pendingVerification = true;

                    throw err;

                }

                return data;

            });

        }).then(function (data) {

            saveUser(data);

            if (typeof trackLogin === 'function') trackLogin('email');

            return data;

        });

    }



    function register(username, email, password, newsletterOptIn) {

        return fetch(API_BASE + '/auth/register', {

            method: 'POST',

            credentials: 'include',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({

                username: username,

                email: email,

                password: password,

                newsletterOptIn: newsletterOptIn === true

            })

        }).then(function (res) {

            if (!res.ok) {

                return res.json().then(function (data) {

                    var err = new Error(data.message || 'Error al registrar');

                    if (data.errors) err.errors = data.errors;

                    throw err;

                });

            }

            return res.json();

        }).then(function (data) {

            if (data.pendingVerification) {

                if (typeof trackSignUp === 'function') trackSignUp('email');

                if (newsletterOptIn === true && typeof DDANewsletter !== 'undefined') {

                    DDANewsletter.subscribe(email, 'registration').catch(function () {});

                }

                return data;

            }

            saveUser(data);

            if (typeof trackSignUp === 'function') trackSignUp('email');

            if (newsletterOptIn === true && typeof DDANewsletter !== 'undefined') {

                DDANewsletter.subscribe(email, 'registration').catch(function () {});

            }

            return data;

        });

    }



    function resendVerification(email) {

        return fetch(API_BASE + '/auth/resend-verification', {

            method: 'POST',

            credentials: 'include',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({ email: email })

        }).then(function (res) {

            return res.json().then(function (data) {

                if (!res.ok) throw new Error(data.message || 'Error al reenviar verificación');

                return data;

            });

        });

    }



    function logout() {

        var wasAdmin = isAdmin();

        return fetch(API_BASE + '/auth/logout', {

            method: 'POST',

            credentials: 'include'

        }).catch(function () {

            // Clear local state even if the server is unreachable.

        }).finally(function () {

            clearAuth();

            window.location.href = wasAdmin ? 'login.html' : 'user-login.html';

        });

    }



    function authHeaders() {

        return { 'Content-Type': 'application/json' };

    }



    function apiFetch(path, options) {

        options = options || {};

        options.credentials = 'include';

        options.headers = Object.assign(authHeaders(), options.headers || {});

        return fetch(API_BASE + path, options).then(function (res) {

            if (res.status === 401 || res.status === 403) {

                clearAuth();

                window.location.href = 'user-login.html';

                throw new Error('Sesión expirada');

            }

            return res;

        });

    }



    function requireAuth() {

        if (!isAuthenticated()) {

            window.location.href = 'user-login.html';

            return false;

        }

        return true;

    }



    function requireAdmin() {

        if (!isAdmin()) {

            window.location.href = 'login.html';

            return false;

        }

        return true;

    }



    init();



    return {

        init: init,

        login: login,

        register: register,

        resendVerification: resendVerification,

        logout: logout,

        getUser: getUser,

        isAuthenticated: isAuthenticated,

        isAdmin: isAdmin,

        apiFetch: apiFetch,

        authHeaders: authHeaders,

        requireAuth: requireAuth,

        requireAdmin: requireAdmin

    };

})();

