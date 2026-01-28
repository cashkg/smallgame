/**
 * Sudoku App - 主控邏輯
 */

const engine = new SudokuEngine();

// 狀態變數
let gameState = {
    screen: 'setup', // setup, game, result
    difficulty: 35, // 挖空格數
    seed: { board: 0, diff: 35, hole: 0 },
    board: [], // 當前盤面 (0為空)
    solution: [], // 解答
    fixedMask: [], // 哪些是題目 (不可改)
    timer: 0,
    timerInterval: null,
    hintsLeft: 2,
    isNoteMode: false,
    selectedCell: null // {r, c}
};

// --- 初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    initSetup();
    checkSave();
});

// --- 設置頁邏輯 ---
function selectDifficulty(val) {
    gameState.difficulty = val;
    // 更新 UI 樣式
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    // 簡單處理：如果是固定按鈕，高亮對應的
    if([35,42,49].includes(val)) {
        event.target.classList.add('active');
        document.querySelector('.limit-mode-zone').style.opacity = '0.5';
    } else {
        document.querySelector('.limit-mode-zone').style.opacity = '1';
    }
    updateCodePreview();
}

function adjustLimit(delta) {
    let newVal = gameState.difficulty + delta;
    if (newVal < 50) newVal = 50;
    if (newVal > 64) newVal = 64;
    gameState.difficulty = newVal;
    
    // UI 更新
    document.getElementById('limit-display').innerText = newVal;
    document.getElementById('limit-display').style.color = newVal >= 60 ? 'red' : 'black';
    
    // 清除上方按鈕選中
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.limit-mode-zone').style.opacity = '1';
    
    updateCodePreview();
}

function updateCodePreview() {
    // 預覽產生一個臨時種子
    const tempBoardSeed = Math.floor(Math.random() * 10000000);
    const tempHoleSeed = Math.floor(Math.random() * 100000);
    const code = engine.generateGameCode(tempBoardSeed, gameState.difficulty, tempHoleSeed);
    document.getElementById('arena-code').innerText = code;
    
    // 更新積分預估
    // 公式: (10000 / 基準秒) * 格數 * 係數
    // 這裡只顯示係數
    let coeff = 1.0;
    if(gameState.difficulty >= 42) coeff = 1.8;
    if(gameState.difficulty >= 49) coeff = 3.0;
    if(gameState.difficulty >= 50) coeff = 6.0; // 極限
    if(gameState.difficulty >= 60) coeff = 30.0;
    
    document.getElementById('score-preview').innerText = `難度係數: x${coeff}`;
}

// --- 遊戲開始邏輯 ---
function startGame() {
    // 1. 生成真實參數
    gameState.seed.diff = gameState.difficulty;
    gameState.seed.board = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    gameState.seed.hole = Math.floor(Math.random() * 100000);

    // 2. 呼叫引擎
    const fullBoard = engine.generateBoard(gameState.seed.board);
    gameState.solution = JSON.parse(JSON.stringify(fullBoard));
    
    const puzzle = engine.generatePuzzle(fullBoard, gameState.seed.diff, gameState.seed.hole);
    gameState.board = JSON.parse(JSON.stringify(puzzle));
    
    // 3. 標記題目格
    gameState.fixedMask = puzzle.map(row => row.map(cell => cell !== 0));
    
    // 4. 重置狀態
    gameState.timer = 0;
    gameState.hintsLeft = 2;
    document.getElementById('hint-btn').innerText = `💡 提示 (${gameState.hintsLeft})`;
    
    // 5. 切換畫面
    showScreen('game-page');
    renderBoard();
    startTimer();
}

// --- 遊戲室邏輯 ---
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
}

function selectCell(r, c) {
    gameState.selectedCell = {r, c};
    // 清除舊選中
    document.querySelectorAll('.cell').forEach(el => {
        el.classList.remove('selected', 'highlight', 'same-num');
    });
    
    // 高亮選中格
    const cell = document.getElementById(`cell-${r}-${c}`);
    cell.classList.add('selected');
    
    const val = gameState.board[r][c];
    
    // 十字高亮 & 相同數字
    for(let i=0; i<9; i++) {
        document.getElementById(`cell-${r}-${i}`).classList.add('highlight');
        document.getElementById(`cell-${i}-${c}`).classList.add('highlight');
        
        // 查找相同數字
        for(let j=0; j<9; j++) {
            if(val !== 0 && gameState.board[i][j] === val) {
                document.getElementById(`cell-${i}-${j}`).classList.add('same-num');
            }
        }
    }
}

function fillNumber(num) {
    if(!gameState.selectedCell) return;
    const {r, c} = gameState.selectedCell;
    
    // 如果是題目格，不能改
    if(gameState.fixedMask[r][c]) return;
    
    // 更新數據
    gameState.board[r][c] = num;
    
    // 更新 UI
    const cell = document.getElementById(`cell-${r}-${c}`);
    cell.innerText = num;
    cell.classList.add('user-input');
    
    // 存檔
    saveState();
    
    // 檢查是否完成
    checkWin();
}

function startTimer() {
    if(gameState.timerInterval) clearInterval(gameState.timerInterval);
    gameState.timerInterval = setInterval(() => {
        gameState.timer++;
        const m = Math.floor(gameState.timer / 60).toString().padStart(2, '0');
        const s = (gameState.timer % 60).toString().padStart(2, '0');
        document.getElementById('timer').innerText = `${m}:${s}`;
    }, 1000);
}

// 簡單檢查勝利 (實際應檢查規則)
function checkWin() {
    // 檢查是否有空
    let isFull = true;
    let isCorrect = true;
    for(let r=0; r<9; r++) {
        for(let c=0; c<9; c++) {
            if(gameState.board[r][c] === 0) isFull = false;
            if(gameState.board[r][c] !== gameState.solution[r][c]) isCorrect = false;
        }
    }
    
    if(isFull && isCorrect) {
        clearInterval(gameState.timerInterval);
        showResult();
    }
}

// --- 結算邏輯 ---
function showResult() {
    showScreen('result-page');
    
    // 計算分數
    // 公式: (10000 / 秒) * 格數 * 係數 * 提示
    let baseTime = 180; // 預設
    let diffWeight = 1.0;
    
    if(gameState.difficulty >= 42) { baseTime = 360; diffWeight = 1.8; }
    if(gameState.difficulty >= 49) { baseTime = 720; diffWeight = 3.0; }
    if(gameState.difficulty >= 50) { baseTime = 1500; diffWeight = 6.0; } // 極限
    
    let hintBonus = 1.0;
    if(gameState.hintsLeft === 2) hintBonus = 1.5;
    if(gameState.hintsLeft === 1) hintBonus = 1.2;
    
    let score = Math.round((10000 / gameState.timer) * gameState.difficulty * diffWeight * hintBonus);
    
    document.getElementById('final-score').innerText = score;
    document.getElementById('res-time').innerText = gameState.timer + "s";
    document.getElementById('res-diff').innerText = gameState.difficulty;
    document.getElementById('res-hint').innerText = (2 - gameState.hintsLeft);
    
    // 清除存檔
    localStorage.removeItem('sudoku_save');
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
    selectDifficulty(35); // 預設
}

// 防作弊 (Visibility API)
document.addEventListener("visibilitychange", () => {
    if (document.hidden && gameState.screen === 'game-page') {
        // 暫停畫面處理 (這裡簡單做：變黑)
        document.body.style.backgroundColor = '#000';
        alert("競技進行中請勿切換視窗！計時繼續中...");
        document.body.style.backgroundColor = '';
    }
});
