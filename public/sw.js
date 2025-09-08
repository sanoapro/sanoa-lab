// v4 - precache + offline + runtime caching + skipWaiting message
const PRECACHE = "sanoa-pre-v4";
const RUNTIME  = "sanoa-run-v4";

const PRECACHE_URLS = [
  "/", "/dashboard", "/login", "/reset-password", "/update-password", "/offline",
  "/favicon.ico"
];

// Permitir que el cliente pida activar ya el nuevo SW
self.addEventListener("message", (e) => {
  if (e?.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(PRECACHE);
    await c.addAll(PRECACHE_URLS);
  })());
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== PRECACHE && k !== RUNTIME).map(k => caches.delete(k)));
  })());
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const u = new URL(req.url);

  // NAVIGATE: network-first con fallback cache + /offline
  if (req.mode === "navigate") {
    e.respondWith((async () => {
      try {
        const net = await fetch(req);
        const c = await caches.open(RUNTIME);
        c.put(req, net.clone());
        return net;
      } catch {
        const pre = await caches.open(PRECACHE);
        const hit = await pre.match(req);
        return hit || pre.match("/offline");
      }
    })());
    return;
  }

  // Runtime caching para Twemoji/CDNs/Fonts/Supabase Storage + mismos-origen
  const host = u.hostname;
  const isCdn =
    host.includes("twemoji") ||
    host.includes("jsdelivr.net") ||
    host.includes("unpkg.com") ||
    host.includes("cdnjs.cloudflare.com") ||
    host.includes("gstatic.com");
  const isSupabaseStorage = host.endsWith(".supabase.co") && u.pathname.includes("/storage/v1/object/");

  if (isCdn || isSupabaseStorage || u.origin === self.location.origin) {
    e.respondWith((async () => {
      const cache = await caches.open(RUNTIME);
      const cached = await cache.match(req);
      const fetchPromise = fetch(req).then(res => {
        cache.put(req, res.clone());
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })());
    return;
  }

  // Resto: intenta red, si no usa cache
  e.respondWith((async () => {
    try { return await fetch(req); }
    catch {
      const cache = await caches.open(RUNTIME);
      return (await cache.match(req)) || Response.error();
    }
  })());
});
