/**
 * 核心控管模組 (js/app.js) - 完整覆蓋版
 * 支援 URL 參數解析：game, seed, state, mode, inviter
 */

const GameApp = {
    timer: null,
    seconds: 0,
    isPaused: false,
    currentGame: null,
    currentSeed: null,

    init() {
        console.log("核心模組初始化...");
        
        // 1. 防作弊監控
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && !this.isPaused && this.currentGame) {
                this.pauseGame();
            }
        });

        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());

        // 2. 解析 URL 參數 (檢查是否為分享連結)
        this.parseURL();
    },

    parseURL() {
        const params = new URLSearchParams(window.location.search);
        const game = params.get('game');
        const seed = params.get('seed');
        const state = params.get('state');
        const mode = params.get('mode');
        const inviter = params.get('inviter');

        if (game && (seed || mode)) {
            console.log(`收到來自 ${inviter || '好友'} 的挑戰！`);
            this.loadGame(game, mode, seed, state);
        }
    },

    loadGame(gameType, mode = null, seed = null, state = null) {
        this.currentGame = gameType;
        this.isPaused = false;
        
        // 生成或繼承種子 (若無 seed 則以今日日期為種子)
        this.currentSeed = seed || new Date().toISOString().slice(0, 10).replace(/-/g, '');
        
        document.getElementById('lobby').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        document.getElementById('pause-overlay').classList.add('hidden');

        this.resetTimer();
        this.startTimer();

        // 啟動對應模組並帶入狀態
        if (gameType === 'sudoku') {
            if (typeof Sudoku !== 'undefined') {
                const holeCount = mode || 50; 
                Sudoku.init(holeCount, this.currentSeed, state); 
            }
        } else if (gameType === 'solitaire') {
            if (typeof Solitaire !== 'undefined') {
                Solitaire.init(mode || 'draw3', this.currentSeed);
            }
        }
    },

    backToLobby() {
        if (confirm("棄權後戰績將不被記錄，確定返回？")) {
            this.stopTimer();
            this.currentGame = null;
            window.location.href = window.location.pathname; // 清除網址參數返回
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
