const GameApp = {
    apiAddr: "https://script.google.com/macros/s/AKfycbx3Dk_IT57pWMC-baaVK-e67Bzyw2hgEbJ44ZYaodgT-XM51XC_soxCgr24LK2jrPBX/exec",
    timer: null,
    seconds: 0,
    isPaused: false,
    currentGame: null,
    currentSeed: null,

    init() {
        this.fetchLobbyStats();
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && !this.isPaused && this.currentGame) this.pauseGame();
        });
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        this.parseURL();
    },

    async fetchLobbyStats() {
        try {
            const resp = await fetch(`${this.apiAddr}?action=getStats`);
            const stats = await resp.json();
            if (stats.sudoku) UI.updateStats('sudoku', stats.sudoku.count, stats.sudoku.top);
            if (stats.solitaire) UI.updateStats('solitaire', stats.solitaire.count, stats.solitaire.top);
        } catch (e) { console.error("Stats fail"); }
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

        // 核心修正：強制啟動渲染
        if (gameType === 'sudoku') {
            Sudoku.init(mode || 50, this.currentSeed, state); 
        } else if (gameType === 'solitaire') {
            Solitaire.init(mode || 'draw3', this.currentSeed);
        }
    },

    async uploadScore(game, mode, score, time) {
        const payload = {
            game: game, mode: mode, score: score, time: time,
            name: (window.userData) ? window.userData.displayName : "訪客",
            lineId: (window.userData) ? window.userData.userId : "guest",
            picture: (window.userData) ? window.userData.pictureUrl : ""
        };
        fetch(this.apiAddr, { method: "POST", mode: "no-cors", body: JSON.stringify(payload) });
    },

    backToLobby() {
        if (confirm("返回大廳？")) window.location.href = window.location.pathname;
    },

    startTimer() {
        this.timer = setInterval(() => {
            if (!this.isPaused) { this.seconds++; this.updateTimerDisplay(); }
        }, 1000);
    },

    stopTimer() { clearInterval(this.timer); },
    resetTimer() { this.seconds = 0; this.updateTimerDisplay(); },
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
    },

    parseURL() {
        const p = new URLSearchParams(window.location.search);
        if (p.get('game')) this.loadGame(p.get('game'), p.get('mode'), p.get('seed'), p.get('state'));
    }
};
window.onload = () => GameApp.init();
