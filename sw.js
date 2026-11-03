/* Radar Neuro — service worker */
// Troque a versão a cada mudança no app shell.
const CACHE = "radar-neuro-v4";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      // cache:"reload" ignora o cache HTTP do navegador, garantindo a versão nova
      .then(c => c.addAll(SHELL.map(u => new Request(u, {cache: "reload"}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function putInCache(req, res){
  if(res && res.ok && res.type === "basic"){
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
  }
  return res;
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Cross-origin (NCBI E-utilities, proxies CORS, Google Fonts): direto pela rede.
  if (url.origin !== self.location.origin) return;

  const isPage = req.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith(".html");
  if (isPage) {
    // Página: rede primeiro (para que correções cheguem a quem já instalou o app);
    // sem rede, usa a cópia salva.
    e.respondWith(
      fetch(req)
        .then(res => putInCache(req, res))
        .catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
    );
    return;
  }

  // Ícones e manifest: cache primeiro, rede como reserva.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => putInCache(req, res)))
  );
});
