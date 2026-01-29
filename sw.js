/**
 * PWA Service Worker - 實現離線遊玩與資源快取
 */
const CACHE_NAME = 'sudoku-arena-v1';
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

// 安裝階段：下載並儲存所有資源
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 啟動階段：清理舊快取
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
});

// 擷取階段：優先從快取讀取，若無則嘗試連網
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
