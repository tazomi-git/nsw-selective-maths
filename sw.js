/* Offline service worker for NSW Selective Maths app.
   Cache-first for the app shell so it runs with no internet after first load.
   Bump CACHE when you change questions.js or the app to force an update. */
const CACHE = "nsw-maths-v5";
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

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(resp => {
        // cache newly fetched same-origin assets for next time
        if (resp && resp.status === 200 && resp.type === "basic") {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return resp;
      }).catch(() => caches.match("./app.html"));
    })
  );
});
