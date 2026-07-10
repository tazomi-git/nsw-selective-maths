/* Offline service worker for NSW Selective Maths app.
   Strategy:
     - App shell (navigations, .html, .js): NETWORK-FIRST with the HTTP cache
       BYPASSED ({cache:"no-store"}). This is what makes re-uploaded code show up
       on the next online load — a plain fetch() would otherwise be served from the
       browser's HTTP cache (e.g. GitHub Pages sends max-age=600), and you'd keep
       seeing the old version. Falls back to the Cache API only when offline.
     - Static assets (icons, manifest): cache-first (they rarely change).
   Bump CACHE if you want to force a full re-cache / purge on all devices. */
const CACHE = "nsw-maths-v12";
const ASSETS = [
  "./",
  "./app.html",
  "./workbook.html",
  "./questions.js",
  "./concepts.js",
  "./variants.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function cachePut(request, resp) {
  if (resp && resp.status === 200 && resp.type === "basic") {
    const copy = resp.clone();
    caches.open(CACHE).then(c => c.put(request, copy));
  }
  return resp;
}

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const isAppShell = e.request.mode === "navigate" || /\.(html|js)$/.test(url.pathname);

  if (isAppShell) {
    // NETWORK-FIRST, HTTP cache bypassed: always fetch the freshest code online,
    // store it for offline, and fall back to the cache when the network is down.
    e.respondWith(
      fetch(url.href, { cache: "no-store" })
        .then(resp => cachePut(e.request, resp))
        .catch(() => caches.match(e.request).then(hit => hit || caches.match("./app.html")))
    );
  } else {
    // CACHE-FIRST: fast, offline-friendly for static assets.
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(resp => cachePut(e.request, resp)))
    );
  }
});
