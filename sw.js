const CACHE_NAME = 'jump-weather-v1';
const STATIC_ASSETS = [
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com'
];

// Phase 1: Installation - Hard-cache the application shell infrastructure
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Phase 2: Activation - Prune obsolete cache indices
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Phase 3: Dynamic Interception Engine
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Strategy A: Network-First with Cache Fallback for dynamic NOAA endpoints
  if (url.includes('api.weather.gov') || url.includes('spc.noaa.gov')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone and update regional metrics cache if live handshake succeeds
          if (response.status === 200) {
            const resClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
          }
          return response;
        })
        .catch(() => {
          // Use previous session's ground telemetry if link goes down
          return caches.match(event.request);
        })
    );
  } else {
    // Strategy B: Cache-First for localized static structural files
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        return cachedResponse || fetch(event.request);
      })
    );
  }
});
