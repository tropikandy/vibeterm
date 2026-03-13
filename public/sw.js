// Minimal service worker — enables PWA standalone mode on Android
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
// Pass all fetches through to the network (no caching)
self.addEventListener('fetch', () => {});
