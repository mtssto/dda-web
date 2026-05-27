var CACHE_NAME = 'dda-v1';

var PRECACHE_URLS = [
    '/',
    '/index.html',
    '/index-custom.css',
    '/global-close.css',
    '/favicon-32x32.png',
    '/icon-192x192.png',
    '/dda.jpeg'
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(PRECACHE_URLS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (name) {
                    return name !== CACHE_NAME;
                }).map(function (name) {
                    return caches.delete(name);
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', function (event) {
    if (event.request.method !== 'GET') return;

    var url = new URL(event.request.url);

    if (url.pathname.startsWith('/api/')) return;

    event.respondWith(
        fetch(event.request).then(function (response) {
            if (response && response.status === 200 && response.type === 'basic') {
                var responseClone = response.clone();
                caches.open(CACHE_NAME).then(function (cache) {
                    cache.put(event.request, responseClone);
                });
            }
            return response;
        }).catch(function () {
            return caches.match(event.request);
        })
    );
});
