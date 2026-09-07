const CACHE = 'qbit-v1';
const STATIC = [
  '/',
  '/index.html',
  '/css/style.css',
  '/styles.css',
  '/auth.js',
  '/common.js',
  '/firebase-config.js',
  '/firebase-db.js',
  '/js/app.js',
  '/js/admin.js',
  '/home.html',
  '/home.js',
  '/matches.html',
  '/matches.js',
  '/profile.html',
  '/profile.js',
  '/rank.html',
  '/rank.js',
  '/settings.html',
  '/settings.js',
  '/wallet.html',
  '/wallet.js',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Static assets - cache first
  if (STATIC.includes(url.pathname)) {
    e.respondWith(caches.match(req).then(cached => cached || fetch(req)));
    return;
  }

  // Navigation (HTML pages) - network first, fallback to cache
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(req, clone));
        return res;
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Everything else - network first
  e.respondWith(
    fetch(req).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(req, clone));
      return res;
    }).catch(() => caches.match(req))
  );
});
