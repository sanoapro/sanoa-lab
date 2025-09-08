// v2 - cache + offline fallback
const CACHE = "sanoa-v2";
const PRECACHE_URLS = [
  "/", "/dashboard", "/login", "/reset-password", "/auth/update-password", "/offline",
  "/favicon.ico"
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(PRECACHE_URLS);
  })());
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
  })());
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  // Navegación: Network-First con fallback a cache y /offline
  if (req.mode === "navigate") {
    e.respondWith((async () => {
      try {
        const net = await fetch(req);
        const c = await caches.open(CACHE);
        c.put(req, net.clone());
        return net;
      } catch {
        const c = await caches.open(CACHE);
        const cached = await c.match(req);
        return cached || c.match("/offline");
      }
    })());
    return;
  }

  // Assets/GET: Stale-While-Revalidate
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const cached = await c.match(req);
    const fetchPromise = fetch(req).then(res => {
      c.put(req, res.clone());
      return res;
    }).catch(() => cached);
    return cached || fetchPromise;
  })());
});
