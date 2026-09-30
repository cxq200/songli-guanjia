// 送礼管家 Service Worker：让网页可以"安装到桌面"，像普通 App 一样打开
const CACHE = 'songli-guanjia-v1'
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  // 页面导航：网络优先，断网时用缓存（离线也能打开）
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('./index.html')))
    return
  }

  // 静态资源：缓存优先，顺便把新资源存进缓存
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((resp) => {
          if (resp.ok && new URL(req.url).origin === location.origin) {
            const copy = resp.clone()
            caches.open(CACHE).then((cache) => cache.put(req, copy))
          }
          return resp
        })
    )
  )
})
