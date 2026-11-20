// StatSkill AI offline service worker.
// Caches the app shell, built assets, uploaded files and visited pages.
// API calls are never cached (they carry authentication and change often).
const CACHE = 'statskill-offline-v2';
const SHELL = ['/', '/index.html', '/offline'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL).catch(() => c.add('/')))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('statskill-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const copy = response.clone();
    const cache = await caches.open(CACHE);
    cache.put(request, copy).catch(() => {});
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const copy = response.clone();
      const cache = await caches.open(CACHE);
      cache.put(request, copy).catch(() => {});
    }
    return response;
  } catch (e) {
    return (await caches.match(request)) || (await caches.match('/')) || (await caches.match('/index.html')) || Response.error();
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return; // YouTube and other third parties

  const p = url.pathname;
  if (p.startsWith('/api/') || p.startsWith('/@vite') || p.includes('/node_modules/')) return;

  if (req.mode === 'navigate') { e.respondWith(networkFirst(req)); return; }
  if (p.startsWith('/src/') || p.startsWith('/@fs/')) { e.respondWith(networkFirst(req)); return; }

  if (p.startsWith('/uploads/') || p.startsWith('/assets/') || /\.(js|css|png|jpe?g|svg|webp|woff2?|ico|json)$/i.test(p)) {
    e.respondWith(cacheFirst(req));
    return;
  }
  e.respondWith(networkFirst(req));
});

// Allows the app to ask the worker to store a resource (for example a lesson thumbnail).
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'CACHE_URL' && e.data.url) {
    e.waitUntil(caches.open(CACHE).then(c => c.add(e.data.url)).catch(() => {}));
  }
});
