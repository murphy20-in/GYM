/* sw.js — offline support.
 *
 * The whole app is a fixed set of small static files, so everything is
 * precached on install. Gym wifi is unreliable; once installed the app never
 * needs the network again.
 */

const VERSION = 'gym-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/base.css',
  './css/components.css',
  './css/views.css',
  './css/tracking.css',
  './css/editorial.css',
  './css/mindset.css',
  './js/app.js',
  './js/ui.js',
  './js/figure.js',
  './js/muscles.js',
  './js/storage.js',
  './js/timer.js',
  './js/chart.js',
  './js/db.js',
  './js/data/archetypes.js',
  './js/data/plan.js',
  './js/data/exercises.js',
  './js/data/workouts.js',
  './js/views/dashboard.js',
  './js/views/daystrip.js',
  './js/views/weighin.js',
  './js/views/nutrition.js',
  './js/views/habits.js',
  './js/views/sessions.js',
  './js/views/workouts.js',
  './js/views/workoutMode.js',
  './js/views/detail.js',
  './js/views/library.js',
  './js/views/progress.js',
  './js/views/settings.js',
  './js/views/setgrid.js',
  './js/views/analytics.js',
  './js/views/mindset.js',
  './js/views/bodyAnalytics.js',
  './assets/img/shoulder.webp',
  './assets/img/armsout.webp',
  './assets/img/ego.webp',
  './assets/img/texture.webp',
  './assets/icons/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/maskable-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    /* addAll fails the whole install if one file 404s, so add individually */
    await Promise.all(ASSETS.map(url =>
      cache.add(new Request(url, { cache: 'reload' })).catch(err => console.warn('Skipped', url, err))
    ));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  /* Navigations: serve the shell immediately, refresh it in the background. */
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cached = await caches.match('./index.html');
      if (cached) {
        fetchAndCache(request).catch(() => {});
        return cached;
      }
      try { return await fetchAndCache(request); }
      catch { return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } }); }
    })());
    return;
  }

  /* Everything else: cache first — these files only change on deploy. */
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try { return await fetchAndCache(request); }
    catch (err) {
      return new Response('', { status: 504, statusText: 'Offline' });
    }
  })());
});

async function fetchAndCache(request) {
  const response = await fetch(request);
  if (response && response.ok && response.type === 'basic') {
    const cache = await caches.open(VERSION);
    cache.put(request, response.clone());
  }
  return response;
}
