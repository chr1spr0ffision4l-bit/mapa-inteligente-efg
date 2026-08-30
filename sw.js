const CACHE_NAME = "mapa-efg-v1";
const ARQUIVOS = [
  "index.html",
  "css/style.css",
  "js/script.js",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARQUIVOS))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((resposta) => resposta || fetch(event.request))
  );
});