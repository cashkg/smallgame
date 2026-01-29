/**
 * Sudoku App - 筆記模式與操作回退版
 */
const engine = new SudokuEngine();

let gameState = {
    screen: 'setup', difficulty: 35, timer: 0, timerInterval: null,
    board: [], notes: [], solution: [], fixedMask: [],
    hintsLeft: 2, isNoteMode: false, selectedCell: null,
    history: [] // 用於 Undo 功能
};

// 初始化筆記數據 (81格，每格存放 1-9 的布林值)
function initNotes() {
    gameState.notes = Array.from({ length: 9 }, () => 
        Array.from({ length: 9 }, () => Array(10).fill(false))
    );
}

// 切換筆記模式
function toggleNoteMode() {
    gameState.isNoteMode = !gameState.isNoteMode;
    const btn = document.getElementById('note-mode-btn');
    btn.innerText = `✏️ 筆記: ${gameState.isNoteMode ? '開' : '關'}`;
    btn.classList.toggle('active', gameState.isNoteMode);
}

// 輸入動作判定
function inputAction(num) {
    if (!gameState.selectedCell) return;
    const { r, c } = gameState.selectedCell;
    if (gameState.fixedMask[r][c]) return;

    saveHistory(); // 每次更動前存入歷史紀錄

    if (gameState.isNoteMode) {
        // 筆記模式：切換小數字開關
        gameState.notes[r][c][num] = !gameState.notes[r][c][num];
        gameState.board[r][c] = 0; // 填筆記時清除大數字
    } else {
        // 普通模式：填入大數字
        gameState.board[r][c] = num;
        // 填入大數字後，清空該格所有筆記
        gameState.notes[r][c].fill(false);
    }
    
    renderCell(r, c);
    checkAllErrors();
    checkWin();
}

// 渲染單個格子
function renderCell(r, c) {
    const cell = document.getElementById(`cell-${r}-${c}`);
    cell.innerHTML = '';
    const val = gameState.board[r][c];

    if (val !== 0) {
        cell.innerText = val;
    } else {
        // 渲染筆記 3x3 網格
        const grid = document.createElement('div');
        grid.className = 'notes-grid';
        for (let i = 1; i <= 9; i++) {
            const note = document.createElement('div');
            note.className = 'note-num';
            note.innerText = gameState.notes[r][c][i] ? i : '';
            grid.appendChild(note);
        }
        cell.appendChild(grid);
    }
}

// 存入歷史 (Undo)
function saveHistory() {
    gameState.history.push({
        board: JSON.parse(JSON.stringify(gameState.board)),
        notes: JSON.parse(JSON.stringify(gameState.notes))
    });
    if (gameState.history.length > 20) gameState.history.shift(); // 最多存20步
}

// 實作全盤判贏 (邏輯校驗)
function checkWin() {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (gameState.board[r][c] === 0) return;
        }
    }
    if (!hasAnyConflict()) {
        clearInterval(gameState.timerInterval);
        showResult();
    }
}

// 渲染盤面 (更新版)
function renderBoard() {
    initNotes();
    const container = document.getElementById('sudoku-board');
    container.innerHTML = '';
    for(let r=0; r<9; r++) {
        for(let c=0; c<9; c++) {
            const div = document.createElement('div');
            div.className = 'cell';
            div.id = `cell-${r}-${c}`;
            if (gameState.fixedMask[r][c]) div.classList.add('fixed');
            div.onclick = () => selectCell(r, c);
            container.appendChild(div);
            renderCell(r, c);
        }
    }
}

// 其他基礎函式 (如 selectCell, hasAnyConflict, checkAllErrors) 請沿用前版邏輯...
