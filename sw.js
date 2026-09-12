/* 中天数据处理服务中心 · Service Worker
 *
 * 策略：network-first（网络优先）
 * 始终优先拉取线上最新内容，断网时回退到缓存副本。
 * 这样页面改版后访问者不会看到旧版本，同时又具备基本离线能力。
 */
const CACHE = 'tianma-data-v1';

// 预缓存：仅核心骨架，保证断网时首页可打开
const PRECACHE = ['./', './index.html', './logo.svg', './icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 只接管同源 GET 请求
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches
            .open(CACHE)
            .then((c) => c.put(req, copy))
            .catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || caches.match('./index.html'))
      )
  );
});
