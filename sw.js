const VERSION_NUMBER = '1';
const STATIC_CACHE = `restaurant-app-static-v${VERSION_NUMBER}`;
const DATA_CACHE = `restaurant-app-data-v${VERSION_NUMBER}`;
const IMAGE_CACHE = `restaurant-app-image-v${VERSION_NUMBER}`;
const REMOTE_CACHE = `restaurant-app-remote-v${VERSION_NUMBER}`;
const ALL_CACHES = [
    STATIC_CACHE,
    DATA_CACHE,
    IMAGE_CACHE,
    REMOTE_CACHE,
];
// local project files which need to cache
const filesToCache = [
    "./",
    "index.html",
    "restaurant.html",
    "js/dbhelper.js",
    "js/main.js",
    "js/restaurant_info.js",
    "css/styles.css",
];

// cache necessary files for offline usage
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(STATIC_CACHE).then(function (cache) {
            return cache.addAll(filesToCache);
        })
    );
});

// get rid of old caches
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (cacheName) {
                    return cacheName.startsWith('restaurant-app') &&
                        !ALL_CACHES.includes(cacheName);
                }).map(function (cacheName) {
                    // delete caches which are no more active
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

// handle all requests
self.addEventListener('fetch', function (event) {
    const requestUrl = new URL(event.request.url);

    if (requestUrl.origin === location.origin) {
        if (requestUrl.pathname === '/restaurant.html') {
            // handle Restaurant Details page because it's URL contains parameters
            event.respondWith(caches.match('restaurant.html'));
            return;
        }
        if (requestUrl.pathname.startsWith('/img/')) {
            // respond to local project image file requests
            event.respondWith(servePhoto(event.request));
            return;
        }
        // respond to local project file requests
        event.respondWith(
            caches.match(event.request).then(function (response) {
                return response || fetchAndCache(event.request, DATA_CACHE);
            })
        );
    } else {
        // respond to remote requests
        event.respondWith(
            caches.match(event.request).then(function (response) {
                return response || fetchAndCache(event.request, REMOTE_CACHE);
            })
        );
    }
});

/**
 * Handle Image requests, if not yet cached, then cache it.
 * @param {Request} request Image request
 */
function servePhoto(request) {
    // if end of string matches with JPG image width in pixels then remove it
    var storageUrl = request.url.replace(/-\d+w\.jpg$/, '');

    // store images without suffix
    return caches.open(IMAGE_CACHE).then(function (cache) {
        return cache.match(storageUrl).then(function (response) {
            if (response) return response;

            return fetch(request).then(function (networkResponse) {
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            });
        });
    });
}

/**
 * At start fetch request and after it, store it in cache and response back.
 * @param {Request} request Network request
 * @param {String} cacheStorageName Cache storage name
 */
function fetchAndCache(request, cacheStorageName) {
    return caches.open(cacheStorageName).then(function (cache) {
        return fetch(request).then(function (networkResponse) {
            cache.put(request, networkResponse.clone());
            return networkResponse;
        });
    });
}