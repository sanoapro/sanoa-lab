/* Sanoa SW v3 — Workbox + Background Sync + app events */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.6.0/workbox-sw.js');

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

let PENDING = 0;

async function postAll(message) {
  const cs = await self.clients.matchAll({ type: 'window' });
  for (const c of cs) c.postMessage(message);
}

if (self.workbox) {
  const {routing, strategies, expiration, backgroundSync, precaching} = workbox;
  workbox.setConfig({debug:false});

  const PRECACHE_URLS = ['/', '/dashboard', '/pacientes', '/perfil', '/offline.html', '/favicon.ico'];
  precaching.precacheAndRoute(PRECACHE_URLS.map(u => ({url: u, revision: null})));

  routing.registerRoute(
    ({request}) => request.mode === 'navigate',
    new strategies.NetworkFirst({
      cacheName: 'pages',
      networkTimeoutSeconds: 3,
      plugins: [ new expiration.ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 7*24*3600 }) ]
    })
  );

  routing.registerRoute(
    ({url}) => url.pathname.startsWith('/_next/static/'),
    new strategies.StaleWhileRevalidate({
      cacheName: 'next-static',
      plugins: [ new expiration.ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 30*24*3600 }) ]
    })
  );

  routing.registerRoute(
    ({request}) => request.destination === 'image',
    new strategies.StaleWhileRevalidate({
      cacheName: 'images',
      plugins: [ new expiration.ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 30*24*3600 }) ]
    })
  );

  routing.registerRoute(
    ({request}) => request.destination === 'font',
    new strategies.StaleWhileRevalidate({
      cacheName: 'fonts',
      plugins: [ new expiration.ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 365*24*3600 }) ]
    })
  );

  const SUPABASE_HOST = 'mmeybpohqtpvaxuhipjr.supabase.co';
  const isSupabaseWrite = ({url, request}) => {
    const m = request.method.toUpperCase();
    if (!['POST','PUT','DELETE','PATCH'].includes(m)) return false;
    if (url.host !== SUPABASE_HOST) return false;
    return url.pathname.startsWith('/rest/v1/') || url.pathname.startsWith('/storage/v1/');
  };

  // Notifica cuando una escritura falla y se encola
  const notifyPlugin = {
    fetchDidFail: async ({request}) => {
      PENDING++;
      postAll({ type: 'queue:added', pending: PENDING, info: { method: request.method, url: request.url } });
    }
  };

  // Reproduce la cola y notifica resultado
  const bgSyncPlugin = new backgroundSync.BackgroundSyncPlugin('sanoa-queue', {
    maxRetentionTime: 24 * 60,
    onSync: async ({queue}) => {
      let processed = 0;
      try {
        // Algunos entornos no exponen getAll(); mantenemos el conteo aproximado.
        if (queue.getAll) {
          const before = await queue.getAll();
          processed = Array.isArray(before) ? before.length : 0;
        }
        await queue.replayRequests();
        if (!processed) processed = 1; // fallback
        PENDING = Math.max(0, PENDING - processed);
        postAll({ type: 'queue:replay-success', pending: PENDING, info: { processed } });
      } catch (err) {
        postAll({ type: 'queue:replay-fail', pending: PENDING, info: { error: String(err) } });
        throw err;
      }
    }
  });

  // Rutas de escrituras Supabase: se encolarán si falla la red
  routing.registerRoute(isSupabaseWrite, new strategies.NetworkOnly({ plugins: [bgSyncPlugin, notifyPlugin] }), 'POST');
  routing.registerRoute(isSupabaseWrite, new strategies.NetworkOnly({ plugins: [bgSyncPlugin, notifyPlugin] }), 'PUT');
  routing.registerRoute(isSupabaseWrite, new strategies.NetworkOnly({ plugins: [bgSyncPlugin, notifyPlugin] }), 'DELETE');
  routing.registerRoute(isSupabaseWrite, new strategies.NetworkOnly({ plugins: [bgSyncPlugin, notifyPlugin] }), 'PATCH');

  routing.setCatchHandler(async ({event}) => {
    if (event.request.destination === 'document') {
      return (await caches.match('/offline.html')) || Response.error();
    }
    return Response.error();
  });
}

// Mensajes desde la página (extensible)
self.addEventListener('message', (evt) => {
  const msg = evt.data || {};
  if (msg && msg.type === 'queue:reset') {
    PENDING = 0;
    postAll({ type: 'queue:count', pending: PENDING });
  }
});
