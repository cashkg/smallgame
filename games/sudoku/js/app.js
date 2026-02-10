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

// --- 核心邏輯：過關判定 (不依賴唯一解) ---
function checkWin() {
    if (gameState.board.flat().includes(0)) return;
    for (let i = 0; i < 9; i++) {
        if (!isRegionValid(getRegion('row', i)) || 
            !isRegionValid(getRegion('col', i)) || 
            !isRegionValid(getRegion('block', i))) return;
    }
    clearInterval(gameState.timerInterval);
    alert("恭喜！邏輯完全正確，挑戰成功！");
    showResult();
}

function isRegionValid(cells) {
    const nums = cells.filter(n => n !== 0);
    return new Set(nums).size === 9;
}

function getRegion(type, index) {
    if (type === 'row') return gameState.board[index];
    if (type === 'col') return gameState.board.map(r => r[index]);
    const rS = Math.floor(index / 3) * 3, cS = (index % 3) * 3;
    let res = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) res.push(gameState.board[rS+r][cS+c]);
    return res;
}

// --- 點擊格子：相同數字高亮與合法數字建議 ---
function selectCell(r, c) {
    gameState.selectedCell = { r, c };
    const val = gameState.board[r][c];
    document.querySelectorAll('.cell').forEach(el => el.classList.remove('selected', 'same-num'));
    
    document.getElementById(`cell-${r}-${c}`).classList.add('selected');
    if (val !== 0) {
        document.querySelectorAll('.cell').forEach(el => {
            if (el.innerText === val.toString()) el.classList.add('same-num');
        });
    }
    updateKeyboardSuggestions(r, c);
}

function updateKeyboardSuggestions(r, c) {
    const btns = document.querySelectorAll('.numpad button');
    if (gameState.board[r][c] !== 0) {
        btns.forEach(b => b.style.boxShadow = "none");
        return;
    }
    const invalid = new Set([...getRegion('row', r), ...getRegion('col', c), ...getRegion('block', Math.floor(r/3)*3 + Math.floor(c/3))]);
    btns.forEach((btn, i) => {
        btn.style.boxShadow = (!invalid.has(i + 1)) ? "0 0 8px #4A90E2 inset" : "none";
    });
}

// --- 筆記與輸入 ---
function inputAction(num) {
    if (!gameState.selectedCell) return;
    const { r, c } = gameState.selectedCell;
    if (gameState.fixedMask[r][c]) return;

    if (gameState.isNoteMode) {
        gameState.notes[r][c][num] = !gameState.notes[r][c][num];
        gameState.board[r][c] = 0;
    } else {
        gameState.board[r][c] = (gameState.board[r][c] === num) ? 0 : num;
        gameState.notes[r][c].fill(false);
    }
    renderCell(r, c);
    updateNumberCounts();
    checkWin();
    // 重新高亮相同數字
    selectCell(r, c);
}

function eraseCell() {
    if (!gameState.selectedCell) return;
    const { r, c } = gameState.selectedCell;
    if (gameState.fixedMask[r][c]) return;
    gameState.board[r][c] = 0;
    gameState.notes[r][c].fill(false);
    renderCell(r, c);
    updateNumberCounts();
}

function toggleNoteMode() {
    gameState.isNoteMode = !gameState.isNoteMode;
    const btn = document.getElementById('note-mode-btn');
    if (btn) btn.innerText = `✏️ 筆記: ${gameState.isNoteMode ? '開' : '關'}`;
}

// 其他渲染與統計函式保持不變...
