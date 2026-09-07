// Service Worker for Cathy Fencing PWA
const CACHE_NAME = 'cathy-fencing-v2';
const ASSETS = [
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
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isHtml = e.request.mode === 'navigate' || e.request.destination === 'document' || url.pathname.endsWith('.html');

  if (isHtml) {
    // 网页文件：先走网络，失败时走缓存
    e.respondWith(
      fetch(e.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request).then((r) => r || caches.match('./fencing_tournament_helper.html')))
    );
    return;
  }

  // 其他静态资源：先走缓存，再更新
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request).then((res) => {
      if (!res || res.status !== 200) return res;
      const clone = res.clone();
      caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
      return res;
    }))
  );
});
