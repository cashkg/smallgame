/**
 * 核心控管模組 (js/app.js)
 * 負責計時、防作弊偵測、暫停遮罩、以及遊戲模組調度
 */

const GameApp = {
    timer: null,
    seconds: 0,
    isPaused: false,
    currentGame: null,

    // 初始化應用程式
    init() {
        console.log("核心模組初始化...");
        
        // 1. 監聽視窗失去焦點 (防作弊：跳出 App 或切換視窗自動暫停)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && !this.isPaused && this.currentGame) {
                console.warn("偵測到視窗失焦，強制暫停以防作弊");
                this.pauseGame();
            }
        });

        // 2. 綁定手動暫停按鈕 (遊戲中)
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.pauseGame());
        }

        // 3. 綁定繼續遊戲按鈕 (遮罩上)
        const resumeBtn = document.getElementById('resume-btn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => this.resumeGame());
        }

        // 4. 偵測手機返回鍵 (可選)
        window.addEventListener('popstate', () => {
            if (this.currentGame) {
                this.backToLobby();
            }
        });
    },

    // 啟動指定遊戲
    loadGame(gameType) {
        console.log(`準備啟動遊戲: ${gameType}`);
        this.currentGame = gameType;
        this.isPaused = false;
        
        // 介面切換
        document.getElementById('lobby').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        document.getElementById('pause-overlay').classList.add('hidden');

        // 重設並啟動計時器
        this.resetTimer();
        this.startTimer();

        // 根據類型初始化不同遊戲模組
        if (gameType === 'sudoku') {
            // 預設進入極限模式起點 (50格)，具體難度可由 UI 傳入
            if (typeof Sudoku !== 'undefined') {
                Sudoku.init(50); 
            }
        } else if (gameType === 'solitaire') {
            if (typeof Solitaire !== 'undefined') {
                Solitaire.init('draw3');
            }
        }
    },

    // 棄權並返回大廳
    backToLobby() {
        const confirmMsg = "比賽正在進行中，確定要棄權並返回大廳嗎？(此局紀錄將不被儲存)";
        if (confirm(confirmMsg)) {
            this.stopTimer();
            this.currentGame = null;
            document.getElementById('game-container').classList.add('hidden');
            document.getElementById('lobby').classList.remove('hidden');
            // 重置網址狀態
            window.history.pushState(null, "", window.location.href);
        }
    },

    // --- 計時器邏輯 ---

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
        this.stopTimer();
        this.seconds = 0;
        this.updateTimerDisplay();
    },

    updateTimerDisplay() {
        const timerElement = document.getElementById('game-timer');
        if (timerElement) {
            const m = Math.floor(this.seconds / 60).toString().padStart(2, '0');
            const s = (this.seconds % 60).toString().padStart(2, '0');
            timerElement.innerText = `${m}:${s}`;
        }
    },

    // --- 暫停邏輯 (核心防作弊) ---

    pauseGame() {
        if (!this.currentGame) return; // 沒在遊戲中不觸發
        
        this.isPaused = true;
        const overlay = document.getElementById('pause-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            // 這裡可以加入額外的畫面遮蔽邏輯，例如模糊化遊戲畫布
            document.getElementById('game-stage').style.filter = 'blur(15px)';
        }
        console.log("遊戲已暫停，畫面已遮蓋");
    },

    resumeGame() {
        this.isPaused = false;
        const overlay = document.getElementById('pause-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
            // 恢復畫面清晰度
            document.getElementById('game-stage').style.filter = 'none';
        }
        console.log("遊戲繼續");
    }
};

// 確保頁面載入後啟動
window.onload = () => {
    GameApp.init();
};
