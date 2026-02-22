self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("finance-app").then(cache => {
      return cache.addAll([
        "/",
        "/index.html",
        "/css/styles.css",
        "/js/api.js",
        "/js/app.js",
        "/js/storage.js"
      ]);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});