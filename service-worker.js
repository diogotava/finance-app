const CACHE_NAME = "finance-app-v1";

const urlsToCache = [
  "https://diogotava.github.io/finance-app/index.html",
  "https://diogotava.github.io/finance-app/css/style.css",
  "https://diogotava.github.io/finance-app/js/api.js",
  "https://diogotava.github.io/finance-app/js/app.js",
  "https://diogotava.github.io/finance-app/js/storage.js",
  "https://diogotava.github.io/finance-app/manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", event => {
  if (urlsToCache.some(url => event.request.url === url)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});