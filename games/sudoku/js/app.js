const engine = new SudokuEngine();
let gameState = {
    screen: 'setup', difficulty: 35, timer: 0, timerInterval: null,
    board: [], notes: [], solution: [], fixedMask: [],
    isNoteMode: false, selectedCell: null
};

document.addEventListener('DOMContentLoaded', () => {
    updateRankUI();
    selectDifficulty(35);
});

// --- 輔助功能：筆記與擦除 ---
function toggleNoteMode() {
    gameState.isNoteMode = !gameState.isNoteMode;
    const btn = document.getElementById('note-mode-btn');
    if (btn) btn.innerText = `✏️ 筆記: ${gameState.isNoteMode ? '開' : '關'}`;
    if (btn) btn.style.background = gameState.isNoteMode ? '#e3f2fd' : 'white';
}

function eraseCell() {
    if (!gameState.selectedCell) return;
    const { r, c } = gameState.selectedCell;
    if (gameState.fixedMask[r][c]) return;

    gameState.board[r][c] = 0;
    gameState.notes[r][c].fill(false); // 同時清空筆記
    renderCell(r, c);
    updateNumberCounts();
}

// --- 核心輸入邏輯 ---
function inputAction(num) {
    if (!gameState.selectedCell) return;
    const { r, c } = gameState.selectedCell;
    if (gameState.fixedMask[r][c]) return;

    if (gameState.isNoteMode) {
        // 筆記模式：切換該數字的 True/False
        gameState.notes[r][c][num] = !gameState.notes[r][c][num];
        gameState.board[r][c] = 0; // 填筆記時清除大數字
    } else {
        // 一般模式：填入大數字
        gameState.board[r][c] = (gameState.board[r][c] === num) ? 0 : num;
        gameState.notes[r][c].fill(false); // 填大數字時清空該格筆記
    }
    renderCell(r, c);
    updateNumberCounts();
    checkWin();
}

// --- 渲染修復 (支援筆記顯示) ---
function renderCell(r, c) {
    const cell = document.getElementById(`cell-${r}-${c}`);
    if (!cell) return;
    const val = gameState.board[r][c];
    cell.innerHTML = ''; // 清空內容

    if (val !== 0) {
        // 顯示大數字
        cell.innerText = val;
        if (!gameState.fixedMask[r][c]) cell.style.color = "#4A90E2";
    } else {
        // 顯示 3x3 筆記網格
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        grid.style.width = '100%';
        grid.style.height = '100%';
        
        for (let i = 1; i <= 9; i++) {
            const n = document.createElement('div');
            n.style.fontSize = '9px';
            n.style.color = '#3498DB';
            n.style.display = 'flex';
            n.style.justifyContent = 'center';
            n.style.alignItems = 'center';
            n.innerText = gameState.notes[r][c][i] ? i : '';
            grid.appendChild(n);
        }
        cell.appendChild(grid);
    }
}

// --- 數字鍵鎖定與統計 ---
function updateNumberCounts() {
    let counts = Array(10).fill(0);
    gameState.board.flat().forEach(v => { if (v !== 0) counts[v]++; });
    
    const btns = document.querySelectorAll('.numpad button');
    btns.forEach((btn, i) => {
        let num = i + 1;
        let rem = 9 - counts[num];
        
        // 更新按鈕上的剩餘數量標籤
        let badge = btn.querySelector('.num-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'num-badge';
            badge.style.position = 'absolute';
            badge.style.right = '2px';
            badge.style.bottom = '2px';
            badge.style.fontSize = '10px';
            btn.appendChild(badge);
        }
        badge.innerText = rem > 0 ? rem : '';

        // 鎖定邏輯
        if (rem <= 0) {
            btn.style.opacity = "0.2";
            btn.style.pointerEvents = "none";
        } else {
            btn.style.opacity = "1";
            btn.style.pointerEvents = "auto";
        }
    });
}

// --- 基礎啟動邏輯 ---
function startGame() {
    try {
        const full = engine.generateBoard(Math.floor(Math.random() * 1000000));
        gameState.solution = JSON.parse(JSON.stringify(full));
        gameState.board = engine.generatePuzzle(full, gameState.difficulty, Math.floor(Math.random()*1000));
        gameState.fixedMask = gameState.board.map(r => r.map(c => c !== 0));
        // 初始化筆記陣列 [9][9][10]
        gameState.notes = Array.from({length:9}, () => Array.from({length:9}, () => Array(10).fill(false)));
        
        showScreen('game-page');
        document.getElementById('current-diff-display').innerText = gameState.difficulty;
        renderBoard();
        updateNumberCounts();
        startTimer();
    } catch (e) { console.error(e); }
}

// 其餘 startGame, renderBoard, selectDifficulty, startTimer 等請沿用前一版...
