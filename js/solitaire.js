/**
 * 疊牌接龍模組 (js/solitaire.js)
 * 支援翻 1 張 / 翻 3 張模式，比拼「步數」與「時間」
 */

const Solitaire = {
    steps: 0,
    mode: 'draw3',
    cards: [],

    init(mode) {
        this.mode = mode;
        this.steps = 0;
        this.setupGame();
        console.log(`接龍初始化：${mode}`);
    },

    setupGame() {
        const stage = document.getElementById('game-stage');
        stage.innerHTML = `
            <div class="solitaire-info">模式: ${this.mode === 'draw1' ? '翻1張' : '翻3張'} | 步數: <span id="step-count">0</span></div>
            <div class="solitaire-board" id="solitaire-board">
                <p style="text-align:center; padding:20px;">牌組生成中...</p>
            </div>
        `;
        
        this.generateDailyDeck();
    },

    generateDailyDeck() {
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        let seed = parseInt(today);
        
        // 生成 52 張牌
        let deck = [];
        const suits = ['♥','♦','♣','♠'];
        const nums = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
        suits.forEach(s => nums.forEach(n => deck.push({s, n})));

        // 洗牌 (種子隨機)
        for (let i = deck.length - 1; i > 0; i--) {
            seed = (seed * 9301 + 49297) % 233280;
            let j = Math.floor((seed / 233280) * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        this.cards = deck;
        this.renderCards();
    },

    // 每執行一次移動動作，呼叫此函式記錄步數
    recordStep() {
        this.steps++;
        const countEl = document.getElementById('step-count');
        if (countEl) countEl.innerText = this.steps;
    },

    renderCards() {
        // 此處對接視覺渲染邏輯 (HTML/CSS 牌面)
        document.getElementById('solitaire-board').innerHTML = `
            <div class="placeholder">每日牌組已就緒，請開始移動卡片...</div>
        `;
    },

    calculateScore() {
        const modeBonus = this.mode === 'draw3' ? 5000 : 2000;
        // 積分 = (難度獎勵 * 100) / (耗時 + 步數 * 0.5)
        return Math.floor((modeBonus * 100) / (GameApp.seconds + this.steps * 0.5));
    },

    onWin() {
        GameApp.stopTimer();
        const score = this.calculateScore();
        UI.showResult('solitaire', this.mode, GameApp.seconds, score);
    }
};
