const CACHE_VERSION = 'pseudocode-v1';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/icons/pwa-192.png',
  '/icons/pwa-512.png',
  '/icons/pwa-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key !== APP_SHELL_CACHE && key !== RUNTIME_CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'worker'
  ) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    await cacheResponse(RUNTIME_CACHE, request, response);
    return response;
  } catch {
    return (
      (await caches.match(request)) ||
      (await caches.match('/')) ||
      Response.error()
    );
  }
}

async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  const networkResponse = fetch(request)
    .then(async (response) => {
      await cacheResponse(RUNTIME_CACHE, request, response);
      return response;
    })
    .catch(() => undefined);

  return cachedResponse || (await networkResponse) || Response.error();
}

async function cacheResponse(cacheName, request, response) {
  if (!response || !response.ok || response.type === 'opaque') {
    return;
  }

  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
}
