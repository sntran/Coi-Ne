// The service worker. It keeps all the files of the site and the Tailwind script in the cache,
// so that the site works offline after the first visit.
// Do not change the list by hand. Run: node tools/build-sw.js

const VERSION = '292cb680c3dc';
const CACHE = `coine-${VERSION}`;
const TAILWIND_URL = 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.3.3/dist/index.global.js';

const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './credits.json',
  './css/app.css',
  './js/app.js',
  './js/core/clips.js',
  './js/core/drag.js',
  './js/core/game-icons.js',
  './js/core/home.js',
  './js/core/i18n.js',
  './js/core/icons.js',
  './js/core/images.js',
  './js/core/mascot.js',
  './js/core/recorder.js',
  './js/core/rest.js',
  './js/core/settings.js',
  './js/core/shapes.js',
  './js/core/sound.js',
  './js/core/speech.js',
  './js/core/state.js',
  './js/core/story.js',
  './js/core/ui.js',
  './js/core/where-scenes.js',
  './js/games/choichuyen.js',
  './js/games/coloring.js',
  './js/games/dots.js',
  './js/games/feelings.js',
  './js/games/festival.js',
  './js/games/letters.js',
  './js/games/market.js',
  './js/games/memory.js',
  './js/games/music.js',
  './js/games/numbers.js',
  './js/games/oanquan.js',
  './js/games/oantuti.js',
  './js/games/outline.js',
  './js/games/patterns.js',
  './js/games/shapes.js',
  './js/games/sorting.js',
  './js/games/stickers.js',
  './js/games/taptamvong.js',
  './js/games/tones.js',
  './js/games/trace.js',
  './js/games/where.js',
  './js/logic/choichuyen.js',
  './js/logic/coloring.js',
  './js/logic/colors.js',
  './js/logic/dots-data.js',
  './js/logic/dots.js',
  './js/logic/feelings.js',
  './js/logic/festival.js',
  './js/logic/letters.js',
  './js/logic/market.js',
  './js/logic/memory.js',
  './js/logic/music.js',
  './js/logic/numbers.js',
  './js/logic/oanquan.js',
  './js/logic/oantuti.js',
  './js/logic/patterns.js',
  './js/logic/progress.js',
  './js/logic/random.js',
  './js/logic/recordings.js',
  './js/logic/rest.js',
  './js/logic/save.js',
  './js/logic/shapes.js',
  './js/logic/sorting.js',
  './js/logic/stickers.js',
  './js/logic/taptamvong.js',
  './js/logic/tones.js',
  './js/logic/trace.js',
  './js/logic/where.js',
  './lang/en.json',
  './lang/vi.json',
  './data/coloring.json',
  './data/images.json',
  './data/letters.json',
  './data/strokes.json',
  './pictures/festival/banh-tet.svg',
  './pictures/festival/cay-da-chu-cuoi.svg',
  './pictures/festival/du-du.svg',
  './pictures/festival/hoa-mai.svg',
  './pictures/festival/long-den-ca-chep.svg',
  './pictures/festival/mam-ngu-qua.svg',
  './pictures/festival/mang-cau.svg',
  './pictures/twemoji/1f315.svg',
  './pictures/twemoji/1f319.svg',
  './pictures/twemoji/1f329.svg',
  './pictures/twemoji/1f331.svg',
  './pictures/twemoji/1f333.svg',
  './pictures/twemoji/1f334.svg',
  './pictures/twemoji/1f336.svg',
  './pictures/twemoji/1f337.svg',
  './pictures/twemoji/1f338.svg',
  './pictures/twemoji/1f339.svg',
  './pictures/twemoji/1f33a.svg',
  './pictures/twemoji/1f33b.svg',
  './pictures/twemoji/1f33c.svg',
  './pictures/twemoji/1f33d.svg',
  './pictures/twemoji/1f343.svg',
  './pictures/twemoji/1f344.svg',
  './pictures/twemoji/1f345.svg',
  './pictures/twemoji/1f346.svg',
  './pictures/twemoji/1f347.svg',
  './pictures/twemoji/1f349.svg',
  './pictures/twemoji/1f34a.svg',
  './pictures/twemoji/1f34c.svg',
  './pictures/twemoji/1f34d.svg',
  './pictures/twemoji/1f34e.svg',
  './pictures/twemoji/1f350.svg',
  './pictures/twemoji/1f351.svg',
  './pictures/twemoji/1f352.svg',
  './pictures/twemoji/1f353.svg',
  './pictures/twemoji/1f359.svg',
  './pictures/twemoji/1f35a.svg',
  './pictures/twemoji/1f366.svg',
  './pictures/twemoji/1f36c.svg',
  './pictures/twemoji/1f36d.svg',
  './pictures/twemoji/1f381.svg',
  './pictures/twemoji/1f382.svg',
  './pictures/twemoji/1f388.svg',
  './pictures/twemoji/1f392.svg',
  './pictures/twemoji/1f3bb.svg',
  './pictures/twemoji/1f3e0.svg',
  './pictures/twemoji/1f3ee.svg',
  './pictures/twemoji/1f404.svg',
  './pictures/twemoji/1f40c.svg',
  './pictures/twemoji/1f413.svg',
  './pictures/twemoji/1f414.svg',
  './pictures/twemoji/1f418.svg',
  './pictures/twemoji/1f419.svg',
  './pictures/twemoji/1f41d.svg',
  './pictures/twemoji/1f41e.svg',
  './pictures/twemoji/1f41f.svg',
  './pictures/twemoji/1f420.svg',
  './pictures/twemoji/1f422.svg',
  './pictures/twemoji/1f425.svg',
  './pictures/twemoji/1f426.svg',
  './pictures/twemoji/1f427.svg',
  './pictures/twemoji/1f42d.svg',
  './pictures/twemoji/1f42e.svg',
  './pictures/twemoji/1f430.svg',
  './pictures/twemoji/1f431.svg',
  './pictures/twemoji/1f433.svg',
  './pictures/twemoji/1f435.svg',
  './pictures/twemoji/1f436.svg',
  './pictures/twemoji/1f437.svg',
  './pictures/twemoji/1f438.svg',
  './pictures/twemoji/1f43b.svg',
  './pictures/twemoji/1f452.svg',
  './pictures/twemoji/1f455.svg',
  './pictures/twemoji/1f457.svg',
  './pictures/twemoji/1f462.svg',
  './pictures/twemoji/1f468.svg',
  './pictures/twemoji/1f469.svg',
  './pictures/twemoji/1f475.svg',
  './pictures/twemoji/1f476.svg',
  './pictures/twemoji/1f478.svg',
  './pictures/twemoji/1f4a1.svg',
  './pictures/twemoji/1f50b.svg',
  './pictures/twemoji/1f514.svg',
  './pictures/twemoji/1f680.svg',
  './pictures/twemoji/1f68d.svg',
  './pictures/twemoji/1f696.svg',
  './pictures/twemoji/1f697.svg',
  './pictures/twemoji/1f698.svg',
  './pictures/twemoji/1f6aa.svg',
  './pictures/twemoji/1f6b2.svg',
  './pictures/twemoji/1f6f6.svg',
  './pictures/twemoji/1f955.svg',
  './pictures/twemoji/1f95a.svg',
  './pictures/twemoji/1f965.svg',
  './pictures/twemoji/1f96d.svg',
  './pictures/twemoji/1f96e.svg',
  './pictures/twemoji/1f980.svg',
  './pictures/twemoji/1f981.svg',
  './pictures/twemoji/1f986.svg',
  './pictures/twemoji/1f98a.svg',
  './pictures/twemoji/1f98b.svg',
  './pictures/twemoji/1f993.svg',
  './pictures/twemoji/1f9c3.svg',
  './pictures/twemoji/1f9d1-200d-2695-fe0f.svg',
  './pictures/twemoji/1f9e6.svg',
  './pictures/twemoji/1f9e7.svg',
  './pictures/twemoji/1f9f8.svg',
  './pictures/twemoji/1f9fa.svg',
  './pictures/twemoji/1fa80.svg',
  './pictures/twemoji/1fa81.svg',
  './pictures/twemoji/1faad.svg',
  './pictures/twemoji/1fab7.svg',
  './pictures/twemoji/1faba.svg',
  './pictures/twemoji/1fad6.svg',
  './pictures/twemoji/2600.svg',
  './pictures/twemoji/2602.svg',
  './pictures/twemoji/26bd.svg',
  './pictures/twemoji/26f5.svg',
  './pictures/twemoji/2702.svg',
  './pictures/twemoji/2708.svg',
  './pictures/twemoji/270a.svg',
  './pictures/twemoji/270b.svg',
  './pictures/twemoji/270c.svg',
  './pictures/twemoji/2764.svg',
  './pictures/twemoji/2b50.svg',
  './pictures/vietnam/ao-dai.svg',
  './pictures/vietnam/banh-chung.svg',
  './pictures/vietnam/bat-pho.svg',
  './pictures/vietnam/cai-dieu.svg',
  './pictures/vietnam/cay-tre.svg',
  './pictures/vietnam/con-trau.svg',
  './pictures/vietnam/den-ong-sao.svg',
  './pictures/vietnam/hoa-sen.svg',
  './pictures/vietnam/non-la.svg',
  './pictures/vietnam/xich-lo.svg',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/icon-maskable.svg',
  './icons/icon.svg',
  './audio/en/index.json',
  './audio/vi/index.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(FILES);
    try {
      await cache.add(new Request(TAILWIND_URL, { mode: 'cors' }));
    } catch {
      // The fetch handler keeps the script at the next visit.
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith('coine-') && n !== CACHE).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

async function fromCache(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request, { ignoreSearch: true });
  if (hit) return hit;
  const response = await fetch(request);
  // Keep a copy of the Tailwind script, and of a recorded audio file that the list does not have yet.
  if (response.ok && (request.url === TAILWIND_URL || new URL(request.url).pathname.includes('/audio/'))) {
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (request.mode === 'navigate' && url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      return (await cache.match('./index.html')) || fetch(request);
    })());
    return;
  }
  if (url.origin === self.location.origin || url.href === TAILWIND_URL) {
    event.respondWith(fromCache(request));
  }
});
