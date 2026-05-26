/**
 * DDA Analytics — Google Analytics 4 integration.
 * Auto-loads the GA4 snippet and exposes trackEvent + e-commerce helpers.
 * Include this script on every page: <script src="/shop/analytics.js"></script>
 */
(function () {
    'use strict';

    var GA_ID = 'G-87SFZWVTQC';

    // Auto-load gtag.js if not already present
    if (!document.querySelector('script[src*="googletagmanager.com/gtag"]')) {
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
        document.head.appendChild(s);
    }

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    if (!window.gtag) window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID);

    /**
     * Generic event tracker — used by existing onclick="trackEvent(...)" calls.
     */
    window.trackEvent = function (eventName, category, label, value) {
        if (typeof window.gtag !== 'function') return;
        var params = {};
        if (category) params.event_category = category;
        if (label) params.event_label = label;
        if (value !== undefined && value !== null) params.value = value;
        window.gtag('event', eventName, params);
    };

    /**
     * GA4 recommended e-commerce: view_item
     */
    window.trackViewItem = function (artwork) {
        if (typeof window.gtag !== 'function' || !artwork) return;
        window.gtag('event', 'view_item', {
            currency: 'USD',
            items: [{
                item_id: artwork.slug || artwork.id,
                item_name: artwork.title,
                item_category: artwork.category || '',
                price: parseFloat(artwork.price) || 0
            }]
        });
    };

    /**
     * GA4 recommended e-commerce: view_item_list
     */
    window.trackViewItemList = function (listName, artworks) {
        if (typeof window.gtag !== 'function' || !artworks) return;
        window.gtag('event', 'view_item_list', {
            item_list_name: listName,
            items: artworks.slice(0, 20).map(function (a, i) {
                return {
                    item_id: a.slug || a.id,
                    item_name: a.title,
                    item_category: a.category || '',
                    index: i,
                    price: parseFloat(a.price) || 0
                };
            })
        });
    };

    /**
     * GA4 recommended: add_to_wishlist
     */
    window.trackAddToWishlist = function (artwork) {
        if (typeof window.gtag !== 'function' || !artwork) return;
        window.gtag('event', 'add_to_wishlist', {
            currency: 'USD',
            items: [{
                item_id: artwork.slug || artwork.id,
                item_name: artwork.title,
                item_category: artwork.category || '',
                price: parseFloat(artwork.price) || 0
            }]
        });
    };

    /**
     * GA4 recommended: generate_lead (for WhatsApp/email inquiries)
     */
    window.trackGenerateLead = function (artwork, method) {
        if (typeof window.gtag !== 'function') return;
        var params = { method: method || 'contact' };
        if (artwork) {
            params.currency = 'USD';
            params.value = parseFloat(artwork.price) || 0;
        }
        window.gtag('event', 'generate_lead', params);
    };

    /**
     * GA4 recommended: sign_up
     */
    window.trackSignUp = function (method) {
        if (typeof window.gtag !== 'function') return;
        window.gtag('event', 'sign_up', { method: method || 'email' });
    };

    /**
     * GA4 recommended: login
     */
    window.trackLogin = function (method) {
        if (typeof window.gtag !== 'function') return;
        window.gtag('event', 'login', { method: method || 'email' });
    };
})();
