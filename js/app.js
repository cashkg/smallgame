const GameApp = {
    timer: null,
    seconds: 0,
    isPaused: false,

    init() {
        // 監聽視窗失去焦點 (防作弊：跳出 App 自動暫停)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && !this.isPaused) {
                this.pauseGame();
            }
        });

        // 手動暫停按鈕
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
    },

    loadGame(gameType) {
        document.getElementById('lobby').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        this.startTimer();
        console.log(`啟動遊戲: ${gameType}`);
        // 這裡之後會呼叫各遊戲的初始化函式
    },

    backToLobby() {
        if (confirm("比賽正在進行中，確定要棄權返回大廳嗎？")) {
            this.stopTimer();
            document.getElementById('game-container').classList.add('hidden');
            document.getElementById('lobby').classList.remove('hidden');
        }
    },

    startTimer() {
        this.seconds = 0;
        this.timer = setInterval(() => {
            if (!this.isPaused) {
                this.seconds++;
                this.updateTimerDisplay();
            }
        }, 1000);
    },

    stopTimer() {
        clearInterval(this.timer);
    },

    updateTimerDisplay() {
        const m = Math.floor(this.seconds / 60).toString().padStart(2, '0');
        const s = (this.seconds % 60).toString().padStart(2, '0');
        document.getElementById('game-timer').innerText = `${m}:${s}`;
    },

    pauseGame() {
        this.isPaused = true;
        document.getElementById('pause-overlay').classList.remove('hidden');
    },

    resumeGame() {
        this.isPaused = false;
        document.getElementById('pause-overlay').classList.add('hidden');
    }
};

GameApp.init();
