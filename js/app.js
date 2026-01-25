/**
 * 核心控管模組 (js/app.js) - 完整覆蓋版
 * 已整合 Google GAS 網址與數據交換邏輯
 */

const GameApp = {
    // 1. 這裡貼入你的 GAS 網址
    apiAddr: "https://script.google.com/macros/s/AKfycbx3Dk_IT57pWMC-baaVK-e67Bzyw2hgEbJ44ZYaodgT-XM51XC_soxCgr24LK2jrPBX/exec",
    
    timer: null,
    seconds: 0,
    isPaused: false,
    currentGame: null,
    currentSeed: null,

    init() {
        console.log("核心模組初始化...");
        
        // 取得大廳初始數據 (遊玩人數、榜首)
        this.fetchLobbyStats();

        // 防作弊監控
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && !this.isPaused && this.currentGame) {
                this.pauseGame();
            }
        });

        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());

        this.parseURL();
    },

    // 向 Google 試算表抓取遊玩人數與榜首
    async fetchLobbyStats() {
        try {
            const resp = await fetch(`${this.apiAddr}?action=getStats`);
            const stats = await resp.json();
            if (typeof UI !== 'undefined') {
                if (stats.sudoku) UI.updateStats('sudoku', stats.sudoku.count, stats.sudoku.top);
                if (stats.solitaire) UI.updateStats('solitaire', stats.solitaire.count, stats.solitaire.top);
            }
        } catch (err) {
            console.error("無法取得統計數據", err);
        }
    },

    // 將成績上傳至 Google 試算表
    async uploadScore(game, mode, score, time) {
        const payload = {
            game: game,
            mode: mode,
            score: score,
            time: time,
            name: (window.userData && window.userData.displayName) ? window.userData.displayName : "訪客",
            lineId: (window.userData && window.userData.userId) ? window.userData.userId : "guest",
            picture: (window.userData && window.userData.pictureUrl) ? window.userData.pictureUrl : ""
        };

        try {
            await fetch(this.apiAddr, {
                method: "POST",
                mode: "no-cors", // GAS 跨域必要設定
                body: JSON.stringify(payload)
            });
            console.log("戰績已同步至雲端");
            // 上傳後刷新大廳人數
            this.fetchLobbyStats();
        } catch (err) {
            console.error("上傳失敗", err);
        }
    },

    parseURL() {
        const params = new URLSearchParams(window.location.search);
        const game = params.get('game');
        const seed = params.get('seed');
        const state = params.get('state');
        const mode = params.get('mode');
        if (game) this.loadGame(game, mode, seed, state);
    },

    loadGame(gameType, mode = null, seed = null, state = null) {
        this.currentGame = gameType;
        this.isPaused = false;
        this.currentSeed = seed || new Date().toISOString().slice(0, 10).replace(/-/g, '');
        
        document.getElementById('lobby').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        document.getElementById('pause-overlay').classList.add('hidden');

        this.resetTimer();
        this.startTimer();

        if (gameType === 'sudoku') {
            if (typeof Sudoku !== 'undefined') Sudoku.init(mode || 50, this.currentSeed, state); 
        } else if (gameType === 'solitaire') {
            if (typeof Solitaire !== 'undefined') Solitaire.init(mode || 'draw3', this.currentSeed);
        }
    },

    backToLobby() {
        if (confirm("確定返回大廳？")) {
            this.stopTimer();
            this.currentGame = null;
            window.location.href = window.location.pathname;
        }
    },

    startTimer() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            if (!this.isPaused) {
                this.seconds++;
                this.updateTimerDisplay();
            }
        }, 1000);
    },

    stopTimer() {
        clearInterval(this.timer);
        this.timer = null;
    },

    resetTimer() {
        this.seconds = 0;
        this.updateTimerDisplay();
    },

    updateTimerDisplay() {
        const m = Math.floor(this.seconds / 60).toString().padStart(2, '0');
        const s = (this.seconds % 60).toString().padStart(2, '0');
        document.getElementById('game-timer').innerText = `${m}:${s}`;
    },

    pauseGame() {
        if (!this.currentGame) return;
        this.isPaused = true;
        document.getElementById('pause-overlay').classList.remove('hidden');
        document.getElementById('game-stage').style.filter = 'blur(15px)';
    },

    resumeGame() {
        this.isPaused = false;
        document.getElementById('pause-overlay').classList.add('hidden');
        document.getElementById('game-stage').style.filter = 'none';
    }
};

window.onload = () => GameApp.init();
