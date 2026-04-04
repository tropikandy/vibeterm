const CACHE = 'clive-v2';
const SHELL = ['/', '/app.js', '/style.css',
  'https://cdn.jsdelivr.net/npm/@xterm/xterm@5/css/xterm.css',
  'https://cdn.jsdelivr.net/npm/@xterm/xterm@5/lib/xterm.js',
  'https://cdn.jsdelivr.net/npm/@xterm/addon-fit@0/lib/addon-fit.js',
  'https://cdn.jsdelivr.net/npm/@xterm/addon-web-links@0/lib/addon-web-links.js',
  'https://cdn.jsdelivr.net/npm/@xterm/addon-webgl@0/lib/addon-webgl.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // API calls and WebSocket upgrades: always network
  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/api/') || e.request.headers.get('upgrade') === 'websocket') return;
  // Navigation: network-first, fall back to cached index
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/'))
    );
    return;
  }
  // Static assets: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(resp => {
      if (resp.ok && (url.hostname === location.hostname || url.hostname.includes('jsdelivr.net'))) {
        const clone = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return resp;
    }))
  );
});
