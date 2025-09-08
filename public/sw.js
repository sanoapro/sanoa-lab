// v3 - precache rutas clave + offline + runtime caching (Twemoji/CDNs/Supabase Storage)
const PRECACHE = "sanoa-pre-v3";
const RUNTIME  = "sanoa-run-v3";

const PRECACHE_URLS = [
  "/", "/dashboard", "/login", "/reset-password", "/update-password", "/offline",
  "/favicon.ico"
];

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
    await Promise.all(
      keys
        .filter(k => k !== PRECACHE && k !== RUNTIME)
        .map(k => caches.delete(k))
    );
  })());
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const u = new URL(req.url);

  // 1) Navegación: Network-First + fallback cache + /offline
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

  // 2) Runtime caching (Stale-While-Revalidate) para:
  //    - Twemoji / CDNs (jsdelivr, unpkg, cdnjs)
  //    - Google Fonts (gstatic)
  //    - Supabase Storage (dominios *.supabase.co con /storage/v1/object/)
  const host = u.hostname;
  const isCdn =
    host.includes("twemoji") ||
    host.includes("jsdelivr.net") ||
    host.includes("unpkg.com") ||
    host.includes("cdnjs.cloudflare.com") ||
    host.includes("gstatic.com");
  const isSupabaseStorage =
    host.endsWith(".supabase.co") && u.pathname.includes("/storage/v1/object/");

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

  // 3) Para el resto, intenta red y si falla usa cache
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      return res;
    } catch {
      const cache = await caches.open(RUNTIME);
      const cached = await cache.match(req);
      return cached || Response.error();
    }
  })());
});
