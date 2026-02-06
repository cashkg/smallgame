/**
 * 數獨競技場 - 核心邏輯 (穩定版)
 */
const engine = new SudokuEngine();

let gameState = {
    screen: 'setup', difficulty: 35, timer: 0, timerInterval: null,
    board: [], notes: [], solution: [], fixedMask: [],
    hintsLeft: 2, isNoteMode: false, selectedCell: null
};

document.addEventListener('DOMContentLoaded', () => {
    updateRankUI();
    selectDifficulty(35);
    if(localStorage.getItem('sudoku_save')) {
        const btn = document.getElementById('resume-btn');
        if(btn) btn.classList.remove('hidden');
    }
});

function getDifficultyCoeff(diff) {
    if (diff < 42) return 1.0;
    if (diff < 49) return 1.8;
    if (diff === 49) return 3.0;
    if (diff >= 50) {
        let growth = (diff - 50) * 1.5714;
        return parseFloat((8.0 + growth).toFixed(1));
    }
    return 1.0;
}

function updateRankUI() {
    const total = parseInt(localStorage.getItem('sudoku_total_score') || '0');
    const scoreEl = document.getElementById('display-total-score');
    if(scoreEl) scoreEl.innerText = total.toLocaleString();

    let rank = "新手玩家 🌱";
    if (total >= 150000) rank = "競技戰神 ⚡";
    else if (total >= 50000) rank = "邏輯大師 🧠";
    else if (total >= 10000) rank = "數獨達人 🔥";
    
    const tag = document.getElementById('player-rank-tag');
    if(tag) tag.innerText = rank;
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
    if(preview) preview.innerText = `加權: x${coeff}`;
    const codeDisplay = document.getElementById('arena-code');
    if(codeDisplay) {
        const tempSeed = Math.floor(Math.random() * 1000000);
        codeDisplay.innerText = `SEED: ${engine.generateGameCode(tempSeed, gameState.difficulty, 99)}`;
    }
}

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
        if(document.getElementById('current-diff-display')) document.getElementById('current-diff-display').innerText = gameState.difficulty;
        if(document.getElementById('current-coeff-display')) document.getElementById('current-coeff-display').innerText = `x${getDifficultyCoeff(gameState.difficulty)}`;

        renderBoard();
        startTimer();
        updateNumberCounts();
    } catch (e) { console.error(e); }
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
}

// 渲染與操作函式 (請包含 renderBoard, updateNumberCounts 等完整功能)
// ... [其餘代碼與您目前的 app.js 保持一致] ...
