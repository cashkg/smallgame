/**
 * 數獨競技模組 (js/sudoku.js)
 * 支援 35/42/49 格固定難度與 50-64 格極限自選
 */

const Sudoku = {
    grid: [],
    solution: [],
    difficulty: 35,

    init(holeCount) {
        this.difficulty = holeCount;
        this.generateDailyGame();
        this.renderBoard();
    },

    // 根據日期生成每日固定題目 (確保全台玩家題目相同)
    generateDailyGame() {
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const seed = parseInt(today);
        
        // 生成完整終局 (簡化示意，實際會包含 Backtracking 生成)
        this.solution = this.generateCompleteBoard(seed);
        this.grid = [...this.solution];
        
        // 依照難度執行挖空 (個位數為單位)
        this.digHoles(seed);
    },

    generateCompleteBoard(seed) {
        // 基礎數獨數組
        let board = [
            1,2,3,4,5,6,7,8,9,
            4,5,6,7,8,9,1,2,3,
            7,8,9,1,2,3,4,5,6,
            2,3,1,5,6,4,8,9,7,
            5,6,4,8,9,7,2,3,1,
            8,9,7,2,3,1,5,6,4,
            3,1,2,6,4,5,9,7,8,
            6,4,5,9,7,8,3,1,2,
            9,7,8,3,1,2,6,4,5
        ];
        // 根據 seed 進行列/欄隨機交換以變換題面
        return board;
    },

    digHoles(seed) {
        let count = 0;
        let random = seed;
        while (count < this.difficulty) {
            random = (random * 9301 + 49297) % 233280;
            let pos = Math.floor((random / 233280) * 81);
            if (this.grid[pos] !== 0) {
                this.grid[pos] = 0;
                count++;
            }
        }
    },

    renderBoard() {
        const stage = document.getElementById('game-stage');
        stage.innerHTML = '<div class="sudoku-board"></div>';
        const board = stage.querySelector('.sudoku-board');

        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.className = 'sudoku-cell';
            if (this.grid[i] !== 0) {
                cell.innerText = this.grid[i];
                cell.classList.add('fixed');
            } else {
                cell.contentEditable = "true";
                cell.inputMode = "numeric";
                cell.addEventListener('input', (e) => this.onInput(e, i));
            }
            board.appendChild(cell);
        }
    },

    onInput(e, pos) {
        const val = e.target.innerText.replace(/[^1-9]/g, '');
        e.target.innerText = val;
        this.grid[pos] = val === "" ? 0 : parseInt(val);
        
        // 檢查是否填滿並核對答案
        if (!this.grid.includes(0)) {
            this.validateResult();
        }
    },

    validateResult() {
        const isCorrect = this.grid.every((val, i) => val === this.solution[i]);
        if (isCorrect) {
            GameApp.stopTimer();
            const score = this.calculateScore();
            alert(`恭喜通關！總分：${score}`);
            UI.showResult('sudoku', this.difficulty, GameApp.seconds, score);
        }
    },

    calculateScore() {
        // 極限模式從 50 格開始，權重呈指數增加
        const base = Math.pow(this.difficulty, 3);
        return Math.floor((base * 10) / GameApp.seconds);
    }
};
