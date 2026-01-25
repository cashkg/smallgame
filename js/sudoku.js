const Sudoku = {
    grid: [],
    solution: [],
    difficulty: 50,

    init(holeCount, seed, savedState = null) {
        this.difficulty = parseInt(holeCount);
        this.generateGame(seed);
        if (savedState) this.grid = savedState.split('').map(n => parseInt(n));
        this.renderBoard();
    },

    generateGame(seed) {
        // 固定的數獨終局模板
        const base = [
            1,2,3,4,5,6,7,8,9, 4,5,6,7,8,9,1,2,3, 7,8,9,1,2,3,4,5,6,
            2,3,1,5,6,4,8,9,7, 5,6,4,8,9,7,2,3,1, 8,9,7,2,3,1,5,6,4,
            3,1,2,6,4,5,9,7,8, 6,4,5,9,7,8,3,1,2, 9,7,8,3,1,2,6,4,5
        ];
        this.solution = [...base];
        this.grid = [...base];
        
        // 依據種子挖空
        let count = 0;
        let s = parseInt(seed);
        while (count < this.difficulty) {
            s = (s * 9301 + 49297) % 233280;
            let pos = Math.floor((s / 233280) * 81);
            if (this.grid[pos] !== 0) { this.grid[pos] = 0; count++; }
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
                cell.oninput = (e) => {
                    const val = e.target.innerText.replace(/[^1-9]/g, '').slice(0,1);
                    e.target.innerText = val;
                    this.grid[i] = val ? parseInt(val) : 0;
                    if (!this.grid.includes(0)) this.checkWin();
                };
            }
            board.appendChild(cell);
        }
    },

    checkWin() {
        if (this.grid.every((v, i) => v === this.solution[i])) {
            GameApp.stopTimer();
            const score = Math.floor((Math.pow(this.difficulty, 2.5) * 100) / GameApp.seconds);
            GameApp.uploadScore('sudoku', this.difficulty, score, GameApp.seconds);
            UI.showResult('sudoku', this.difficulty, GameApp.seconds, score);
        }
    }
};
