/**
 * Sudoku App - 邏輯判贏與錯誤偵測增強版
 */

const engine = new SudokuEngine();

let gameState = {
    screen: 'setup',
    difficulty: 35,
    seed: { board: 0, diff: 35, hole: 0 },
    board: [], 
    solution: [], 
    fixedMask: [], 
    timer: 0,
    timerInterval: null,
    hintsLeft: 2,
    selectedCell: null,
    isPaused: false
};

// --- [核心修改] 邏輯判贏機制 ---
// 不再對比 solution，而是檢查是否符合數獨規則
function checkWin() {
    // 1. 檢查是否所有格子都填滿了
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (gameState.board[r][c] === 0) return; // 還有空格，直接返回
        }
    }

    // 2. 檢查目前盤面是否有任何邏輯衝突
    if (hasAnyConflict()) {
        console.log("盤面已滿但存在邏輯衝突");
        return;
    }

    // 3. 通過檢查，判定勝利
    clearInterval(gameState.timerInterval);
    showResult();
}

// 檢查全盤是否有衝突
function hasAnyConflict() {
    for (let i = 0; i < 9; i++) {
        if (isRegionInvalid(getCellsInRow(i))) return true;
        if (isRegionInvalid(getCellsInCol(i))) return true;
        if (isRegionInvalid(getCellsInBlock(i))) return true;
    }
    return false;
}

function isRegionInvalid(cells) {
    let seen = new Set();
    for (let item of cells) {
        if (item.val !== 0) {
            if (seen.has(item.val)) return true; // 發現重複
            seen.add(item.val);
        }
    }
    return false;
}

// --- [優化] 即時錯誤視覺反饋 ---
function checkAllErrors() {
    document.querySelectorAll('.cell').forEach(el => el.classList.remove('error'));

    for (let i = 0; i < 9; i++) {
        markErrors(getErrorCells(getCellsInRow(i)));
        markErrors(getErrorCells(getCellsInCol(i)));
        markErrors(getErrorCells(getCellsInBlock(i)));
    }
}

function getErrorCells(cells) {
    let counts = {};
    cells.forEach(item => { if(item.val !== 0) counts[item.val] = (counts[item.val] || 0) + 1; });
    return cells.filter(item => item.val !== 0 && counts[item.val] > 1);
}

function markErrors(errors) {
    errors.forEach(err => {
        document.getElementById(`cell-${err.r}-${err.c}`).classList.add('error');
    });
}

// --- [新增] 退出功能 ---
function confirmExit() {
    if(confirm("確定要放棄並回到大廳嗎？")) {
        clearInterval(gameState.timerInterval);
        localStorage.removeItem('sudoku_save');
        window.location.href = '../../index.html'; 
    }
}

// --- [新增] 暫停功能 (手動與失焦) ---
function togglePause(forcePause = null) {
    const shouldPause = (forcePause !== null) ? forcePause : !gameState.isPaused;
    
    if (shouldPause) {
        clearInterval(gameState.timerInterval);
        document.getElementById('game-page').style.filter = 'blur(15px) grayscale(1)';
        console.log("遊戲暫停，計時停止");
    } else {
        startTimer();
        document.getElementById('game-page').style.filter = 'none';
    }
    gameState.isPaused = shouldPause;
}

// 監聽視窗失焦 (防作弊：失焦計時不停但畫面變黑)
document.addEventListener("visibilitychange", () => {
    if (document.hidden && gameState.screen === 'game-page') {
        document.getElementById('game-page').style.filter = 'brightness(0)';
        // 注意：這裡不清除 timerInterval，計時會繼續跑
    } else if (!document.hidden && !gameState.isPaused) {
        document.getElementById('game-page').style.filter = 'none';
    }
});

// 其餘輔助函式 (getCellsInRow, getCellsInCol, getCellsInBlock 等) 保持不變...
