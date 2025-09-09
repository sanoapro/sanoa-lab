/* Sanoa SW v2 — Workbox + Background Sync */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.6.0/workbox-sw.js');

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

if (self.workbox) {
  const {routing, strategies, expiration, backgroundSync, precaching} = workbox;
  workbox.setConfig({debug:false});

  // Precarga rutas claves y fallback
  const PRECACHE_URLS = [
    '/', '/dashboard', '/pacientes', '/perfil',
    '/offline.html', '/favicon.ico'
  ];
  precaching.precacheAndRoute(PRECACHE_URLS.map(u => ({url: u, revision: null})));

  // Pages → NetworkFirst con timeout
  routing.registerRoute(
    ({request}) => request.mode === 'navigate',
    new strategies.NetworkFirst({
      cacheName: 'pages',
      networkTimeoutSeconds: 3,
      plugins: [ new expiration.ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 7*24*3600 }) ]
    })
  );

  // Next static
  routing.registerRoute(
    ({url}) => url.pathname.startsWith('/_next/static/'),
    new strategies.StaleWhileRevalidate({
      cacheName: 'next-static',
      plugins: [ new expiration.ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 30*24*3600 }) ]
    })
  );

  // Imágenes
  routing.registerRoute(
    ({request}) => request.destination === 'image',
    new strategies.StaleWhileRevalidate({
      cacheName: 'images',
      plugins: [ new expiration.ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 30*24*3600 }) ]
    })
  );

  // Fuentes
  routing.registerRoute(
    ({request}) => request.destination === 'font',
    new strategies.StaleWhileRevalidate({
      cacheName: 'fonts',
      plugins: [ new expiration.ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 365*24*3600 }) ]
    })
  );

  // Background Sync para Supabase REST y Storage
  const SUPABASE_HOST = 'mmeybpohqtpvaxuhipjr.supabase.co';
  const isSupabaseWrite = ({url, request}) => {
    const m = request.method.toUpperCase();
    if (!['POST','PUT','DELETE','PATCH'].includes(m)) return false;
    if (url.host !== SUPABASE_HOST) return false;
    return url.pathname.startsWith('/rest/v1/') || url.pathname.startsWith('/storage/v1/');
  };

  const bgSyncPlugin = new backgroundSync.BackgroundSyncPlugin('sanoa-queue', {
    maxRetentionTime: 24 * 60 // en minutos
  });

  routing.registerRoute(isSupabaseWrite, new strategies.NetworkOnly({ plugins: [bgSyncPlugin] }), 'POST');
  routing.registerRoute(isSupabaseWrite, new strategies.NetworkOnly({ plugins: [bgSyncPlugin] }), 'PUT');
  routing.registerRoute(isSupabaseWrite, new strategies.NetworkOnly({ plugins: [bgSyncPlugin] }), 'DELETE');
  routing.registerRoute(isSupabaseWrite, new strategies.NetworkOnly({ plugins: [bgSyncPlugin] }), 'PATCH');

  // Fallback de navegación → offline
  routing.setCatchHandler(async ({event}) => {
    if (event.request.destination === 'document') {
      return (await caches.match('/offline.html')) || Response.error();
    }
    return Response.error();
  });
}
