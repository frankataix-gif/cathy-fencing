// Service Worker for Cathy Fencing PWA
const CACHE_NAME = 'cathy-fencing-v1';
const ASSETS = [
  './fencing_tournament_helper.html',
  './cathy_avatar.jpg',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => null)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((r) => {
      if (r) return r;
      return fetch(e.request).then((res) => {
        if (!res || res.status !== 200) return res;
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match('./fencing_tournament_helper.html'));
    })
  );
});
