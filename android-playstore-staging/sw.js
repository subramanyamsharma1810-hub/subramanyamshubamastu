// Shubhamastu Matrimony Service Worker (Offline Cache & Call Push)
const CACHE_NAME = 'shubhamastu-cache-v2';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Precache partial fallback:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Network-First with Cache Fallback for navigation requests
self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Ignore non-GET requests or API requests for caching
  if (req.method !== 'GET' || req.url.includes('/api/')) {
    return;
  }

  // Network first for HTML and navigation
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html') || caches.match('/'))
    );
    return;
  }

  // Stale-while-revalidate for static assets
  event.respondWith(
    caches.match(req).then((cached) => {
      const networked = fetch(req).then((response) => {
        if (response && response.status === 200) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, cloned));
        }
        return response;
      }).catch(() => cached);
      return cached || networked;
    })
  );
});

// Push notification handling for video/audio calls
self.addEventListener('push', (event) => {
  let data = { title: '📞 Incoming Call', body: 'You have an incoming call on Shubhamastu', url: '/' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    data.body = event.data ? event.data.text() : data.body;
  }

  const options = {
    body: data.body || 'Tap to answer incoming call',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: data.tag || 'shubhamastu-call',
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200, 500, 200],
    data: { url: data.url || '/' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '📞 Incoming Call', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url || '/');
      }
    })
  );
});
