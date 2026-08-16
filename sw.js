// Mufradat service worker — network-first strategy.
//
// Why: a plain cache-first worker serves the offline copy immediately and never
// checks for anything newer, so updates could sit invisible until the app was
// deleted and reinstalled. This version always tries the network first (so you
// get the latest file whenever you have a connection) and only falls back to
// the cached copy when you're genuinely offline.

const CACHE_NAME = "mufradat-cache-v2";

self.addEventListener("install", (event) => {
  self.skipWaiting(); // activate this new worker immediately, don't wait around
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim()) // take control of open tabs right away
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request)) // offline fallback only
  );
});
