// v1 cache básico
const CACHE="sanoa-v1";const PRECACHE_URLS=["/","/dashboard","/favicon.ico"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRECACHE_URLS)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET")return;e.respondWith(caches.match(r).then(cached=>{const f=fetch(r).then(res=>{const rc=res.clone();caches.open(CACHE).then(c=>c.put(r,rc));return res}).catch(()=>cached);return cached||f}))});
