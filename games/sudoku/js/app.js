/**
 * Sudoku App - 主控邏輯 (修復版)
 */

const engine = new SudokuEngine();

// 狀態變數
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
    isNoteMode: false,
    selectedCell: null // {r, c}
};

document.addEventListener('DOMContentLoaded', () => {
    initSetup();
    checkSave();
});

// --- 設置頁邏輯 (修復難度切換 Bug) ---
function selectDifficulty(val) {
    gameState.difficulty = val;
    
    // UI 更新：清除所有按鈕 active
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    
    // 如果是固定難度
    if([35,42,49].includes(val)) {
        // 找到對應按鈕並亮起 (這裡用遍歷因為 onclick 傳值不好抓 DOM)
        const btns = document.querySelectorAll('.diff-btn');
        if(val === 35) btns[0].classList.add('active');
        if(val === 42) btns[1].classList.add('active');
        if(val === 49) btns[2].classList.add('active');

        // 淡化極限區
        document.querySelector('.limit-mode-zone').style.opacity = '0.5';
    }
    
    updateCodePreview();
}

function adjustLimit(delta) {
    // 當使用者操作極限區時，先取消上方固定難度的 active
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.limit-mode-zone').style.opacity = '1';

    // 如果當前難度不在極限範圍，先設為 50
    if(gameState.difficulty < 50) gameState.difficulty = 50;

    let newVal = gameState.difficulty + delta;
    if (newVal < 50) newVal = 50;
    if (newVal > 64) newVal = 64;
    gameState.difficulty = newVal;
    
    // UI 更新
    document.getElementById('limit-display').innerText = newVal;
    document.getElementById('limit-display').style.color = newVal >= 60 ? 'red' : 'black';
    
    updateCodePreview();
}

function updateCodePreview() {
    const tempBoardSeed = Math.floor(Math.random() * 10000000);
    const tempHoleSeed = Math.floor(Math.random() * 100000);
    const code = engine.generateGameCode(tempBoardSeed, gameState.difficulty, tempHoleSeed);
    document.getElementById('arena-code').innerText = code;
    
    let coeff = 1.0;
    if(gameState.difficulty >= 42) coeff = 1.8;
    if(gameState.difficulty >= 49) coeff = 3.0;
    if(gameState.difficulty >= 50) coeff = 6.0;
    if(gameState.difficulty >= 60) coeff = 30.0;
    
    document.getElementById('score-preview').innerText = `預估加權: x${coeff}`;
}

// --- 遊戲開始 ---
function startGame() {
    gameState.seed.diff = gameState.difficulty;
    gameState.seed.board = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    gameState.seed.hole = Math.floor(Math.random() * 100000);

    const fullBoard = engine.generateBoard(gameState.seed.board);
    gameState.solution = JSON.parse(JSON.stringify(fullBoard));
    
    const puzzle = engine.generatePuzzle(fullBoard, gameState.seed.diff, gameState.seed.hole);
    gameState.board = JSON.parse(JSON.stringify(puzzle));
    gameState.fixedMask = puzzle.map(row => row.map(cell => cell !== 0));
    
    gameState.timer = 0;
    gameState.hintsLeft = 2;
    document.getElementById('hint-btn').innerText = `💡 提示 (${gameState.hintsLeft})`;
    
    showScreen('game-page');
    renderBoard();
    startTimer();
}

// --- 渲染與操作 ---
function renderBoard() {
    const container = document.getElementById('sudoku-board');
    container.innerHTML = '';
    
    for(let r=0; r<9; r++) {
        for(let c=0; c<9; c++) {
            const val = gameState.board[r][c];
            const div = document.createElement('div');
            div.className = 'cell';
            if (gameState.fixedMask[r][c]) div.classList.add('fixed');
            if (!gameState.fixedMask[r][c] && val !== 0) div.classList.add('user-input');
            
            if (val !== 0) div.innerText = val;
            div.onclick = () => selectCell(r, c);
            div.id = `cell-${r}-${c}`;
            container.appendChild(div);
        }
    }
    // 渲染後檢查一次錯誤
    checkAllErrors(); 
}

function selectCell(r, c) {
    gameState.selectedCell = {r, c};
    
    document.querySelectorAll('.cell').forEach(el => {
        el.classList.remove('selected', 'highlight', 'same-num');
    });
    
    const cell = document.getElementById(`cell-${r}-${c}`);
    cell.classList.add('selected');
    
    const val = gameState.board[r][c];
    
    for(let i=0; i<9; i++) {
        document.getElementById(`cell-${r}-${i}`).classList.add('highlight');
        document.getElementById(`cell-${i}-${c}`).classList.add('highlight');
    }
    
    if(val !== 0) {
        for(let i=0; i<9; i++) {
            for(let j=0; j<9; j++) {
                if(gameState.board[i][j] === val) {
                    document.getElementById(`cell-${i}-${j}`).classList.add('same-num');
                }
            }
        }
    }
}

function fillNumber(num) {
    if(!gameState.selectedCell) return;
    const {r, c} = gameState.selectedCell;
    if(gameState.fixedMask[r][c]) return;
    
    gameState.board[r][c] = num;
    
    const cell = document.getElementById(`cell-${r}-${c}`);
    cell.innerText = num;
    cell.classList.add('user-input');
    
    // 選中狀態下刷新高亮與相同數字
    selectCell(r, c);
    
    // 檢查錯誤 (即時反紅)
    checkAllErrors();
    saveState();
    checkWin();
}

function eraseCell() {
    if(!gameState.selectedCell) return;
    const {r, c} = gameState.selectedCell;
    if(gameState.fixedMask[r][c]) return;
    
    gameState.board[r][c] = 0;
    const cell = document.getElementById(`cell-${r}-${c}`);
    cell.innerText = '';
    cell.classList.remove('user-input', 'error'); // 擦掉也要移除錯誤紅字
    
    checkAllErrors(); // 重新檢查，也許這個數字刪掉後，別格就正確了
    saveState();
}

// --- 錯誤檢查邏輯 (新增功能) ---
function checkAllErrors() {
    // 先移除所有錯誤標記
    document.querySelectorAll('.cell').forEach(el => el.classList.remove('error'));

    // 檢查行、列、宮
    for (let i = 0; i < 9; i++) {
        checkRegion(getErrorCellsInRegion(getCellsInRow(i)));     // 行
        checkRegion(getErrorCellsInRegion(getCellsInCol(i)));     // 列
        checkRegion(getErrorCellsInRegion(getCellsInBlock(i)));   // 宮
    }
}

function getErrorCellsInRegion(cells) {
    // cells = [{r, c, val}, ...]
    let counts = {};
    cells.forEach(item => {
        if(item.val !== 0) {
            counts[item.val] = (counts[item.val] || 0) + 1;
        }
    });
    // 回傳那些出現超過1次的座標
    let errors = [];
    cells.forEach(item => {
        if(item.val !== 0 && counts[item.val] > 1) {
            errors.push({r: item.r, c: item.c});
        }
    });
    return errors;
}

function checkRegion(errorCoords) {
    errorCoords.forEach(({r, c}) => {
        document.getElementById(`cell-${r}-${c}`).classList.add('error');
    });
}

// 輔助獲取行列宮的座標與值
function getCellsInRow(r) {
    let res = [];
    for(let c=0; c<9; c++) res.push({r, c, val: gameState.board[r][c]});
    return res;
}
function getCellsInCol(c) {
    let res = [];
    for(let r=0; r<9; r++) res.push({r, c, val: gameState.board[r][c]});
    return res;
}
function getCellsInBlock(b) {
    let res = [];
    let startR = Math.floor(b/3)*3;
    let startC = (b%3)*3;
    for(let r=startR; r<startR+3; r++) {
        for(let c=startC; c<startC+3; c++) {
            res.push({r, c, val: gameState.board[r][c]});
        }
    }
    return res;
}

// --- 遊戲控制 (修復暫停與退出) ---
function startTimer() {
    if(gameState.timerInterval) clearInterval(gameState.timerInterval);
    gameState.timerInterval = setInterval(() => {
        gameState.timer++;
        const m = Math.floor(gameState.timer / 60).toString().padStart(2, '0');
        const s = (gameState.timer % 60).toString().padStart(2, '0');
        document.getElementById('timer').innerText = `${m}:${s}`;
    }, 1000);
}

// 點選左上角退出按鈕
function confirmExit() {
    if(confirm("確定要放棄本局並回到大廳嗎？(進度將會遺失)")) {
        clearInterval(gameState.timerInterval);
        localStorage.removeItem('sudoku_save'); // 清除存檔
        
        // 重置狀態
        gameState.board = [];
        gameState.timer = 0;
        
        showScreen('setup-page');
    }
}

// --- 結算與跳轉 (修復分享與回大廳) ---
function checkWin() {
    let isFull = true;
    let isCorrect = true;
    for(let r=0; r<9; r++) {
        for(let c=0; c<9; c++) {
            if(gameState.board[r][c] === 0) isFull = false;
            // 這裡可以選擇檢查 solution，或是只檢查有沒有衝突
            // 目前邏輯：檢查是否與解答完全一致
            if(gameState.board[r][c] !== gameState.solution[r][c]) isCorrect = false;
        }
    }
    
    if(isFull && isCorrect) {
        clearInterval(gameState.timerInterval);
        showResult();
    }
}

function showResult() {
    showScreen('result-page');
    
    let diffWeight = 1.0;
    if(gameState.difficulty >= 42) diffWeight = 1.8;
    if(gameState.difficulty >= 49) diffWeight = 3.0;
    if(gameState.difficulty >= 50) diffWeight = 6.0;
    
    let hintBonus = 1.0;
    if(gameState.hintsLeft === 2) hintBonus = 1.5;
    if(gameState.hintsLeft === 1) hintBonus = 1.2;
    
    let score = Math.round((10000 / (gameState.timer || 1)) * gameState.difficulty * diffWeight * hintBonus);
    
    document.getElementById('final-score').innerText = score;
    document.getElementById('res-time').innerText = gameState.timer + "s";
    document.getElementById('res-diff').innerText = gameState.difficulty;
    document.getElementById('res-hint').innerText = (2 - gameState.hintsLeft);
    
    localStorage.removeItem('sudoku_save');
}

function goHome() {
    // 因為在 games/sudoku/ 目錄下，要往上兩層
    window.location.href = '../../index.html';
}

function shareResult() {
    const score = document.getElementById('final-score').innerText;
    const text = `數獨競技場挑戰成功！\n得分：${score}\n快來挑戰我！`;
    
    if (navigator.share) {
        navigator.share({
            title: '數獨競技場',
            text: text,
            url: window.location.href
        }).catch(console.error);
    } else {
        // 電腦版 fallback：複製到剪貼簿
        navigator.clipboard.writeText(text + " " + window.location.href).then(() => {
            alert("戰績已複製到剪貼簿！");
        });
    }
}

// --- 提示功能 ---
function useHint() {
    if(gameState.hintsLeft <= 0) {
        alert("提示次數已用盡！");
        return;
    }
    
    // 簡單邏輯：隨機幫忙填一個還是 0 的格子
    let emptyCells = [];
    for(let r=0; r<9; r++) {
        for(let c=0; c<9; c++) {
            if(gameState.board[r][c] === 0) emptyCells.push({r,c});
        }
    }
    
    if(emptyCells.length > 0) {
        const rand = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const ans = gameState.solution[rand.r][rand.c];
        
        gameState.hintsLeft--;
        document.getElementById('hint-btn').innerText = `💡 提示 (${gameState.hintsLeft})`;
        
        // 模擬點擊填入
        gameState.selectedCell = rand;
        fillNumber(ans); 
    }
}

// --- 通用 ---
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    gameState.screen = id;
}

function saveState() {
    localStorage.setItem('sudoku_save', JSON.stringify(gameState));
}

function checkSave() {
    const save = localStorage.getItem('sudoku_save');
    if(save) {
        document.getElementById('resume-btn').classList.remove('hidden');
    }
}

function resumeGame() {
    const save = JSON.parse(localStorage.getItem('sudoku_save'));
    gameState = save;
    showScreen('game-page');
    renderBoard();
    startTimer();
}

function initSetup() {
    selectDifficulty(35);
}

// 複製代碼
function copyCode() {
    const code = document.getElementById('arena-code').innerText;
    navigator.clipboard.writeText(code).then(() => {
        alert("代碼已複製！");
    });
}
