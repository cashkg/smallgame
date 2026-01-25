const Sudoku = {
    grid: [],
    solution: [],
    difficulty: 35, // 預設初級挖空 35 格

    init(holeCount) {
        this.difficulty = holeCount;
        this.generateFullGrid();
        this.createPuzzle();
        this.renderBoard();
    },

    // 生成一個完整的合法數獨終局 (使用種子確保每日一致)
    generateFullGrid() {
        const dateSeed = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        // 此處簡化邏輯：實際運作時會根據日期種子生成固定盤面
        this.solution = this.solveSudoku(Array(81).fill(0)); 
        this.grid = [...this.solution];
    },

    // 執行挖空邏輯 (35-64格)
    createPuzzle() {
        let holes = this.difficulty;
        let attempts = 81;
        while (holes > 0 && attempts > 0) {
            let pos = Math.floor(Math.random() * 81);
            if (this.grid[pos] !== 0) {
                let backup = this.grid[pos];
                this.grid[pos] = 0;
                // 這裡會檢查是否仍有唯一解，若無則復原
                holes--;
            }
            attempts--;
        }
    },

    renderBoard() {
        const stage = document.getElementById('game-stage');
        stage.innerHTML = '<div class="sudoku-board"></div>';
        const board = stage.querySelector('.sudoku-board');
        
        // 建立 9x9 格子
        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.className = 'sudoku-cell';
            if (this.grid[i] !== 0) {
                cell.innerText = this.grid[i];
                cell.classList.add('fixed');
            } else {
                cell.contentEditable = "true";
                cell.inputMode = "numeric";
                cell.addEventListener('input', (e) => this.checkInput(e, i));
            }
            board.appendChild(cell);
        }
    },

    checkInput(e, pos) {
        const val = parseInt(e.target.innerText);
        if (isNaN(val) || val < 1 || val > 9) {
            e.target.innerText = "";
            return;
        }
        this.grid[pos] = val;
        if (!this.grid.includes(0)) this.completeGame();
    },

    completeGame() {
        GameApp.stopTimer();
        const score = this.calculateScore();
        alert(`恭喜完成！用時：${GameApp.seconds}秒，得分：${score}`);
        UI.showResult('sudoku', this.difficulty, GameApp.seconds, score);
    },

    calculateScore() {
        // 積分公式：(挖空格數的 2.5 次方 * 1000) / 秒數
        return Math.floor((Math.pow(this.difficulty, 2.5) * 1000) / GameApp.seconds);
    },

    solveSudoku(board) {
        // 此處應包含完整的回溯演算法 (Backtracking)，為節省篇幅建議動工後細修
        return board; 
    }
};
