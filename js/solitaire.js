const Solitaire = {
    steps: 0,
    mode: 'draw3',
    cards: [],

    init(mode, seed) {
        this.mode = mode || 'draw3';
        this.steps = 0;
        this.renderLayout();
        console.log("接龍遊戲已就緒 (種子: " + seed + ")");
    },

    renderLayout() {
        const stage = document.getElementById('game-stage');
        stage.innerHTML = `
            <div class="game-info">模式: ${this.mode === 'draw1' ? '翻1張' : '翻3張'} | 步數: <span id="step-count">0</span></div>
            <div class="solitaire-board">
                <div class="placeholder">接龍盤面渲染區域</div>
                <button onclick="Solitaire.testWin()" style="margin-top:20px; padding:10px;">模擬完成 (測試分數)</button>
            </div>
        `;
    },

    recordStep() {
        this.steps++;
        document.getElementById('step-count').innerText = this.steps;
    },

    // 依據 README 的計分邏輯：耗時 + 步數懲罰
    calculateScore() {
        const difficultyBonus = this.mode === 'draw3' ? 1.5 : 1.0;
        const baseScore = 10000 * difficultyBonus;
        // 罰分邏輯：秒數 + 步數*0.5 為分母
        return Math.floor(baseScore / (GameApp.seconds + this.steps * 0.5));
    },

    testWin() {
        const score = this.calculateScore();
        GameApp.stopTimer();
        GameApp.uploadScore('solitaire', this.mode, score, GameApp.seconds);
        UI.showResult('solitaire', this.mode, GameApp.seconds, score);
    }
};
