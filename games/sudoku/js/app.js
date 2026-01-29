const engine = new SudokuEngine();
let gameState = {
    screen: 'setup', difficulty: 35, timer: 0, timerInterval: null,
    board: [], notes: [], solution: [], fixedMask: [],
    hintsLeft: 2, isNoteMode: false, selectedCell: null
};

document.addEventListener('DOMContentLoaded', () => {
    updateRankUI();
    selectDifficulty(35);
});

// --- [核心修改] 動態積分加權曲線 ---
function getDifficultyCoeff(diff) {
    if (diff < 42) return 1.0; // 初級
    if (diff < 49) return 1.8; // 中級
    if (diff === 49) return 3.0; // 高級
    // 極限模式：從 50 格的 8.0 倍到 64 格的 30.0 倍，採線性增長
    if (diff >= 50) {
        let baseLimit = 8.0;
        let growth = (diff - 50) * 1.57; // (30-8)/14格 ≈ 1.57
        return parseFloat((baseLimit + growth).toFixed(1));
    }
    return 1.0;
}

function updateRankUI() {
    const score = parseInt(localStorage.getItem('sudoku_total_score') || '0');
    if (document.getElementById('display-total-score')) {
        document.getElementById('display-total-score').innerText = score.toLocaleString();
    }
}

function selectDifficulty(val) {
    gameState.difficulty = val;
    updatePreview();
}

function adjustLimit(delta) {
    if(gameState.difficulty < 50) gameState.difficulty = 50;
    gameState.difficulty += delta;
    if(gameState.difficulty > 64) gameState.difficulty = 64;
    if(gameState.difficulty < 50) gameState.difficulty = 50;
    
    const display = document.getElementById('limit-display');
    if(display) display.innerText = gameState.difficulty;
    updatePreview();
}

function updatePreview() {
    const coeff = getDifficultyCoeff(gameState.difficulty);
    const preview = document.getElementById('score-preview');
    if(preview) preview.innerText = `預估積分加權: x${coeff}`;
}

// --- [核心修改] 進入遊戲並顯示當前狀態 ---
function startGame() {
    try {
        const boardSeed = Math.floor(Math.random() * 1000000);
        const full = engine.generateBoard(boardSeed);
        gameState.solution = JSON.parse(JSON.stringify(full));
        
        const puzzle = engine.generatePuzzle(full, gameState.difficulty, Math.floor(Math.random()*1000));
        gameState.board = JSON.parse(JSON.stringify(puzzle));
        gameState.fixedMask = puzzle.map(r => r.map(c => c !== 0));
        gameState.notes = Array.from({length:9},()=>Array.from({length:9},()=>Array(10).fill(false)));
        gameState.timer = 0;

        showScreen('game-page');
        
        // 顯示盤面上的難度與倍率
        if(document.getElementById('current-diff-display')) 
            document.getElementById('current-diff-display').innerText = gameState.difficulty;
        if(document.getElementById('current-coeff-display')) 
            document.getElementById('current-coeff-display').innerText = `x${getDifficultyCoeff(gameState.difficulty)}`;

        renderBoard();
        startTimer();
        updateNumberCounts();
    } catch (e) {
        console.error("啟動失敗:", e);
        alert("盤面生成出錯，請重新嘗試");
    }
}

// ... 剩餘 renderBoard, inputAction, startTimer 等功能保持不變 ...
// ... 務必確保 showScreen(id) 函式有正確切換 display ...

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
}
