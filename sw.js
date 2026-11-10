/* Toma 6 · Contador — service worker (modo sin conexión)
   Sube CACHE en cada publicación (toma6-v1 → toma6-v2 …). */
const CACHE = 'toma6-v1';
const ARCHIVOS = [
  './', 'index.html', 'manifest.json',
  'icon-192.png', 'icon-512.png', 'maskable-192.png', 'maskable-512.png',
  'apple-touch-icon.png', 'favicon-32.png', 'favicon.ico'
];
// La tipografía (Lilita One) viene de Google Fonts: se guarda la primera vez que se usa con conexión.
const FUENTES = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k.startsWith('toma6-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const propio = url.origin === self.location.origin;
  if (!propio && !FUENTES.includes(url.origin)) return;

  // Red primero (los cambios se ven al momento); la caché solo sirve sin conexión.
  e.respondWith(
    fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
      return res;
    }).catch(() =>
      caches.match(req, { ignoreSearch: propio }).then(r => r || (req.mode === 'navigate' ? caches.match('./') : Response.error()))
    )
  );
});
