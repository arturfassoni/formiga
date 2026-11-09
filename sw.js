// Formiga: funciona offline. Ao publicar uma versão nova, troque o número abaixo.
const CACHE = "formiga-v31";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  // Login e Google Drive sempre direto pela rede
  if (/googleapis\.com|accounts\.google\.com|gstatic\.com\/.*gsi/.test(url.href)) return;
  // Página: tenta a rede primeiro (pega atualizações), cai para o cache sem internet
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put("./index.html", cp)); return r; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  // Demais arquivos (ícones, biblioteca de arrastar, fontes): cache primeiro
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok && (url.origin === location.origin || /cdnjs|fonts\.(googleapis|gstatic)/.test(url.host))) {
      const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp));
    }
    return r;
  })));
});
