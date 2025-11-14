// sw.js – minimal, no custom caching for Xmas Movies

// Install: activate immediately
self.addEventListener("install", (event) => {
  // Skip waiting so the new SW takes over asap
  self.skipWaiting();
});

// Activate: clear ALL existing caches from older SW versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      await self.clients.claim();
    })()
  );
});

// Fetch: do NOTHING special — let the browser decide.
// This means no cache-first, no manual cache storage.
self.addEventListener("fetch", () => {
  // Intentionally empty
});
