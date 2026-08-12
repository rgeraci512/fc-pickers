// FC PICKERS service worker — offline-capable pick sheet
const SHELL_CACHE = 'shell-v4';
const DATA_CACHE  = 'data-v4';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL_CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== SHELL_CACHE && k !== DATA_CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // live-score API etc: straight to network
  if (url.pathname.endsWith('picks.enc')) {
    // network-first: always try for this week's freshest picks, fall back to last saved
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(DATA_CACHE).then(c => c.put('picks.enc', copy));
        return r;
      }).catch(() => caches.match('picks.enc'))
    );
  } else {
    // cache-first for the app shell
    e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(hit => hit || fetch(e.request)));
  }
});
