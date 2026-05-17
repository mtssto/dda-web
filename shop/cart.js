/**
 * DDA Cart — Shopping cart for the art shop.
 * Persists in localStorage. Artworks are unique (quantity is always 1 per piece).
 */
var DDACart = (function () {
    'use strict';

    var CART_KEY = 'dda_cart';

    function getCart() {
        try {
            return JSON.parse(localStorage.getItem(CART_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateBadge();
        dispatchCartEvent();
    }

    function addItem(product) {
        var cart = getCart();
        var exists = cart.some(function (item) { return item.id === product.id; });
        if (exists) return false;
        cart.push({
            id: product.id,
            title: product.title,
            price: product.price || 'Consultar',
            image: product.image || '',
            technique: product.technique || '',
            dimensions: product.dimensions || '',
            year: product.year || '',
            category: product.category || ''
        });
        saveCart(cart);
        return true;
    }

    function removeItem(productId) {
        var cart = getCart();
        cart = cart.filter(function (item) { return item.id !== productId; });
        saveCart(cart);
    }

    function isInCart(productId) {
        return getCart().some(function (item) { return item.id === productId; });
    }

    function getCount() {
        return getCart().length;
    }

    function clearCart() {
        saveCart([]);
    }

    function updateBadge() {
        var badges = document.querySelectorAll('.cart-badge');
        var count = getCount();
        badges.forEach(function (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        });
    }

    function dispatchCartEvent() {
        window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: getCount() } }));
    }

    function generateWhatsAppMessage() {
        var cart = getCart();
        if (cart.length === 0) return '';
        var lines = ['Hola Diego, me interesan las siguientes obras:\n'];
        cart.forEach(function (item, i) {
            lines.push((i + 1) + '. ' + item.title +
                (item.dimensions ? ' (' + item.dimensions + ')' : '') +
                (item.technique ? ' — ' + item.technique : ''));
        });
        lines.push('\n¿Podrías enviarme información sobre disponibilidad y precios?\n\nGracias.');
        return lines.join('\n');
    }

    function generateEmailBody() {
        var cart = getCart();
        if (cart.length === 0) return '';
        var lines = ['Hola Diego,\n\nMe interesan las siguientes obras:\n'];
        cart.forEach(function (item, i) {
            lines.push((i + 1) + '. ' + item.title +
                (item.dimensions ? ' (' + item.dimensions + ')' : '') +
                (item.technique ? ' — ' + item.technique : ''));
        });
        lines.push('\n¿Podrías enviarme información sobre disponibilidad y precios?\n\nGracias.');
        return lines.join('\n');
    }

    document.addEventListener('DOMContentLoaded', function () {
        updateBadge();
    });

    return {
        getCart: getCart,
        addItem: addItem,
        removeItem: removeItem,
        isInCart: isInCart,
        getCount: getCount,
        clearCart: clearCart,
        updateBadge: updateBadge,
        generateWhatsAppMessage: generateWhatsAppMessage,
        generateEmailBody: generateEmailBody
    };
})();
