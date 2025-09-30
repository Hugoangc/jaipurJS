const CACHE_NAME = "tropeiro-cache-v2";
const urlsToCache = [
  "/",
  "/index.html",
  "/src/styles/base.css",
  "/src/styles/layout.css",
  "/src/styles/card.css",
  "/src/styles/components.css",
  "/src/styles/tutorial.css",
  "/src/styles/responsive.css",
  "/src/js/game.js",
  "/src/js/main.js",
  "/src/js/ai.js",
  "/src/js/tutorial.js",
  "/public/images/github.png",
  "/public/images/icon-192.png",
  "/public/images/icon-512.png",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});

self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
