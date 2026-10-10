// Keeps the app's own files on the phone so My Clinic opens without internet.
// It stores only the app (screens, styles, fonts, icons). Patient records are
// never handled here: they stay in the phone's database and are not sent anywhere.
// The two lines below are filled in when the app is built.
const VERSION = "1.0.0-2fd205bc6316";
const FILES = ["./","app.js","fonts/figtree-latin-ext-wght-normal.woff2","fonts/figtree-latin-wght-normal.woff2","icons/icon-180.png","icons/icon-192.png","icons/icon-512-maskable.png","icons/icon-512.png","manifest.webmanifest","styles.css"];
const CACHE = `my-clinic-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // Fetch fresh copies, not whatever the browser's ordinary cache holds.
      .then((cache) => cache.addAll(FILES.map((file) => new Request(file, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n.startsWith('my-clinic-') && n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const kept = await cache.match(request, { ignoreSearch: true });
      if (kept) return kept;
      try {
        return await fetch(request);
      } catch (err) {
        // Offline and not one of the app's files: opening the app still shows its first screen.
        if (request.mode === 'navigate') {
          const home = await cache.match('./');
          if (home) return home;
        }
        throw err;
      }
    }),
  );
});
