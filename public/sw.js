// CONSTRUX Service Worker - Progressive Web App & Offline Engine
// Note: Service workers are enabled for production & standalone applets.
// In local dev, sw registers automatically for testing offline flows.
// Safari/iOS does not support the Background Sync API ('sync' event), so
// the sync engine also binds to window 'online' and 'focus' events.

const CACHE_NAME = 'construx-cache-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
];

// Install: Precache App Shell and offline fallback page
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Non-critical precache warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event with tailored caching strategies
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests (mutations are handled by the IndexedDB Outbox Engine)
  if (request.method !== 'GET') {
    return;
  }

  // 1. Navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Update cache with fresh version
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          // Try cached page first, or fallback to offline.html
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const fallback = await caches.match('/offline.html');
          return fallback || new Response('Offline - CONSTRUX', { headers: { 'Content-Type': 'text/plain' } });
        })
    );
    return;
  }

  // 2. Static Assets (Images, Icons, Fonts, Audio memos): Cache-First
  const isStaticAsset =
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|woff|woff2|ttf|mp3|wav|ico)$/i) ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('images.unsplash.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        }).catch(() => {
          // Provide placeholder for images if offline
          if (request.destination === 'image') {
            return caches.match('/icon.svg');
          }
        });
      })
    );
    return;
  }

  // 3. API Requests (/api/*): Stale-While-Revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);

        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 4. Default: Network first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Background Sync (Chromium / Android):
self.addEventListener('sync', (event) => {
  if (event.tag === 'construx-outbox-sync') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'TRIGGER_OUTBOX_SYNC' });
        });
      })
    );
  }
});
