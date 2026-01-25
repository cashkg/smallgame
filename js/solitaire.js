const Solitaire = {
    deck: [],
    tableau: [[], [], [], [], [], [], []],
    steps: 0,
    mode: 'draw3', // 預設翻三張

    init(mode) {
        this.mode = mode;
        this.steps = 0;
        this.generateDeck();
        this.shuffleDeck();
        this.deal();
        this.render();
        console.log(`接龍啟動：${mode}模式`);
    },

    // 產生 52 張牌 (每日種子同步)
    generateDeck() {
        const suits = ['heart', 'diamond', 'club', 'spade'];
        const values = ['A', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K'];
        this.deck = [];
        suits.forEach(s => values.forEach(v => this.deck.push({suit: s, value: v})));
    },

    shuffleDeck() {
        // 使用日期種子確保今日題目一致
        const dateSeed = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        let seed = parseInt(dateSeed);
        for (let i = this.deck.length - 1; i > 0; i--) {
            seed = (seed * 9301 + 49297) % 233280;
            let j = Math.floor((seed / 233280) * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    },

    deal() {
        // 經典接龍 7 疊牌區發牌邏輯
        for (let i = 0; i < 7; i++) {
            for (let j = i; j < 7; j++) {
                this.tableau[j].push(this.deck.pop());
            }
        }
    },

    moveCard(from, to) {
        // 每移動一次就增加步數，這是天梯排行的依據
        this.steps++;
        console.log(`目前步數: ${this.steps}`);
        this.checkWin();
    },

    calculateScore() {
        // 積分公式：(難度係數 / (時間 + 步數 * 0.5))
        const difficultyFactor = (this.mode === 'draw3') ? 20000 : 10000;
        return Math.floor(difficultyFactor / (GameApp.seconds + this.steps * 0.5));
    },

    checkWin() {
        // 獲勝判斷與上傳戰績
        if (false) { // 這裡實作勝利條件
            GameApp.stopTimer();
            const score = this.calculateScore();
            UI.showResult('solitaire', this.mode, GameApp.seconds, score);
        }
    },

    render() {
        const stage = document.getElementById('game-stage');
        stage.innerHTML = '<div class="solitaire-board">接龍介面建置中...</div>';
    }
};
