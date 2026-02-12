/**
 * PWA Service Worker - v5.6 (強制刷新版)
 */
const CACHE_NAME = 'sudoku-arena-v5.6';
const ASSETS = [
    './', './index.html', './css/lobby.css', './js/lobby.js',
    './games/sudoku/index.html', './games/sudoku/style.css',
    './games/sudoku/js/engine.js', './games/sudoku/js/app.js'
];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then(keys => Promise.all(
        keys.map(k => k !== CACHE_NAME && caches.delete(k))
    )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        fetch(e.request).then(res => {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
            return res;
        }).catch(() => caches.match(e.request))
    );
});
