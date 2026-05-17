/**
 * DDA Auth — JWT authentication client for the DDA Art Shop backend.
 * Handles login, token storage, and authenticated API requests.
 */
var DDAAuth = (function () {
    'use strict';

    var API_BASE = window.DDA_API_BASE || '/api';
    var TOKEN_KEY = 'dda_auth_token';
    var USER_KEY = 'dda_auth_user';

    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function getUser() {
        var raw = localStorage.getItem(USER_KEY);
        if (!raw) return null;
        try { return JSON.parse(raw); } catch (e) { return null; }
    }

    function saveAuth(data) {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify({
            username: data.username,
            role: data.role
        }));
    }

    function clearAuth() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    function isAuthenticated() {
        var token = getToken();
        if (!token) return false;
        try {
            var payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 > Date.now();
        } catch (e) {
            clearAuth();
            return false;
        }
    }

    function isAdmin() {
        var user = getUser();
        return isAuthenticated() && user && user.role === 'ADMIN';
    }

    function login(username, password) {
        return fetch(API_BASE + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, password: password })
        }).then(function (res) {
            if (!res.ok) {
                return res.json().then(function (data) {
                    throw new Error(data.message || 'Usuario o contraseña incorrectos');
                });
            }
            return res.json();
        }).then(function (data) {
            saveAuth(data);
            return data;
        });
    }

    function register(username, email, password) {
        return fetch(API_BASE + '/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, email: email, password: password })
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
            saveAuth(data);
            return data;
        });
    }

    function logout() {
        var wasAdmin = isAdmin();
        clearAuth();
        window.location.href = wasAdmin ? 'login.html' : 'user-login.html';
    }

    function authHeaders() {
        var token = getToken();
        var headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        return headers;
    }

    function apiFetch(path, options) {
        options = options || {};
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

    return {
        login: login,
        register: register,
        logout: logout,
        getToken: getToken,
        getUser: getUser,
        isAuthenticated: isAuthenticated,
        isAdmin: isAdmin,
        apiFetch: apiFetch,
        authHeaders: authHeaders,
        requireAuth: requireAuth,
        requireAdmin: requireAdmin
    };
})();
