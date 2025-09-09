// v5 - cache-first estáticos, SWR para runtime, límite por tamaño y limpieza bajo demanda
const PRECACHE = "sanoa-pre-v5";
const RUNTIME  = "sanoa-run-v5";

// Rutas que precacheamos (públicas/claves)
const PRECACHE_URLS = [
  "/", "/login", "/dashboard",
  "/reset-password", "/update-password",
  "/offline", "/instalar", "/acerca", "/privacidad", "/terminos",
  "/favicon.ico"
];

// Límite de tamaño para cachear (bytes) — evita PDFs/video pesados
const MAX_CACHE_BYTES = 8 * 1024 * 1024; // 8MB
// Máximo de entradas en el cache runtime
const RUNTIME_MAX_ENTRIES = 200;

// Mensajes desde el cliente
self.addEventListener("message", (e) => {
  const msg = e?.data?.type;
  if (msg === "SKIP_WAITING") self.skipWaiting();
  if (msg === "CLEANUP_RUNTIME") {
    const limit = e?.data?.limit ?? RUNTIME_MAX_ENTRIES;
    e.waitUntil(cleanupRuntime(limit));
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
    await cleanupRuntime(RUNTIME_MAX_ENTRIES);
  })());
  self.clients.claim();
});

// Utilidades
function isSameOrigin(u) {
  try { return new URL(u).origin === self.location.origin; } catch { return false; }
}

function isIconOrFavicon(u) {
  try {
    const url = new URL(u);
    return url.pathname.startsWith("/icons/") ||
           url.pathname.endsWith(".png") && url.pathname.includes("/icons/") ||
           url.pathname === "/favicon.ico";
  } catch { return false; }
}

function isNextStatic(u) {
  try { return new URL(u).pathname.startsWith("/_next/static/"); } catch { return false; }
}

function isCdn(u) {
  try {
    const host = new URL(u).hostname;
    return host.includes("twemoji") ||
           host.includes("jsdelivr.net") ||
           host.includes("unpkg.com") ||
           host.includes("cdnjs.cloudflare.com") ||
           host.includes("gstatic.com");
  } catch { return false; }
}

function isSupabaseStorage(u) {
  try {
    const url = new URL(u);
    return url.hostname.endsWith(".supabase.co") && url.pathname.includes("/storage/v1/object/");
  } catch { return false; }
}

function shouldCacheResponse(req, res) {
  try {
    // No cachear si status no-OK
    if (!res || !res.ok) return false;

    const ct = res.headers.get("content-type") || "";
    const cl = res.headers.get("content-length");
    const len = cl ? parseInt(cl, 10) : null;

    // Evitar binarios pesados si no sabemos el tamaño
    if (len !== null && len > MAX_CACHE_BYTES) return false;
    if (len === null && (ct.startsWith("video/") || ct === "application/zip")) return false;

    // Do not cache POST responses etc. (ya filtrado por método GET en fetch)
    return true;
  } catch {
    return true;
  }
}

async function cacheFirst(e, cacheName = RUNTIME) {
  const req = e.request;
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) {
    // Revalida en segundo plano
    e.waitUntil(fetch(req).then(res => { if (shouldCacheResponse(req, res)) cache.put(req, res.clone()); }));
    return cached;
  }
  try {
    const net = await fetch(req);
    if (shouldCacheResponse(req, net)) cache.put(req, net.clone());
    return net;
  } catch {
    return caches.match(req);
  }
}

async function staleWhileRevalidate(e, cacheName = RUNTIME) {
  const req = e.request;
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req).then(res => {
    if (shouldCacheResponse(req, res)) cache.put(req, res.clone());
    return res;
  }).catch(() => cached);
  return cached || fetchPromise;
}

async function cleanupRuntime(limit = RUNTIME_MAX_ENTRIES) {
  const cache = await caches.open(RUNTIME);
  const keys = await cache.keys();
  if (keys.length <= limit) return;
  const excess = keys.length - limit;
  const toDelete = keys.slice(0, excess); // inserción cronológica
  await Promise.all(toDelete.map(k => cache.delete(k)));
}

// Estrategias
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  // Navegaciones → network-first con fallback /offline
  if (req.mode === "navigate") {
    e.respondWith((async () => {
      try {
        const net = await fetch(req);
        const c = await caches.open(RUNTIME);
        if (shouldCacheResponse(req, net)) c.put(req, net.clone());
        return net;
      } catch {
        const pre = await caches.open(PRECACHE);
        return (await pre.match(req)) || (await pre.match("/offline"));
      }
    })());
    return;
  }

  const url = req.url;

  // Estáticos del propio sitio
  if (isIconOrFavicon(url) || isNextStatic(url)) {
    e.respondWith(cacheFirst(e));
    return;
  }

  // CDNs, Google Fonts, Supabase Storage → SWR
  if (isCdn(url) || isSupabaseStorage(url) || isSameOrigin(url)) {
    e.respondWith(staleWhileRevalidate(e));
    return;
  }

  // Resto: intenta red y si falla, cache
  e.respondWith((async () => {
    try { return await fetch(req); }
    catch {
      const c = await caches.open(RUNTIME);
      return (await c.match(req)) || Response.error();
    }
  })());
});
