// 野外取样工具 Service Worker — 缓存页面本体，离线可打开
// 只拦截本页面请求；地图瓦片由页面内 IndexedDB 管理，不经过这里
const CACHE = "sampling-v1";
const PAGE = new URL(self.registration.scope).pathname + "sampling_helper.html";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll([PAGE]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  // 只处理本工具页面：网络优先（保证拿到最新版），失败回缓存
  if (u.origin === location.origin && u.pathname === PAGE) {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return r;
        })
        .catch(() => caches.match(e.request))
    );
  }
  // 其它请求一律放行（不干预 fencing 页面和外部资源）
});
