/**
 * PWA Service Worker - v2 (強迫更新版)
 */
const CACHE_NAME = 'sudoku-arena-v2'; // 更改版本號觸發更新
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/lobby.css',
    './js/lobby.js',
    './games/sudoku/index.html',
    './games/sudoku/style.css',
    './games/sudoku/js/engine.js',
    './games/sudoku/js/app.js',
    'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

// 安裝時跳過等待，立即取代舊版
self.addEventListener('install', (event) => {
    self.skipWaiting(); 
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

// 啟動時刪除所有舊版本的快取
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => response || fetch(event.request))
    );
});
