self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // simple pass-through to ensure installation checklist works
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
