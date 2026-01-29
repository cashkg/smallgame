const CACHE_NAME = 'sudoku-arena-v3.1'; // 每次更新代碼請改此版本號
const ASSETS = [
    './', './index.html', './css/lobby.css', './js/lobby.js',
    './games/sudoku/index.html', './games/sudoku/style.css',
    './games/sudoku/js/engine.js', './games/sudoku/js/app.js'
];

self.addEventListener('install', (e) => {
    self.skipWaiting(); // 強制跳過等待，立即更新
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then(keys => Promise.all(
        keys.map(k => k !== CACHE_NAME && caches.delete(k))
    )).then(() => self.clients.claim()));
});

// 策略：網路優先，失敗才用快取，並在背景更新快取
self.addEventListener('fetch', (e) => {
    e.respondWith(
        fetch(e.request).then(res => {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
            return res;
        }).catch(() => caches.match(e.request))
    );
});
