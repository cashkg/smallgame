/**
 * 數獨競技場 - 核心邏輯修正版
 */
const engine = new SudokuEngine();

let gameState = {
    screen: 'setup', 
    difficulty: 35, 
    timer: 0, 
    timerInterval: null,
    board: [], 
    notes: [], 
    solution: [], 
    fixedMask: [],
    hintsLeft: 2, 
    isNoteMode: false, 
    selectedCell: null,
    seed: { board: 0 }
};

document.addEventListener('DOMContentLoaded', () => {
    updateRankUI();
    selectDifficulty(35);
    // 自動載入存檔 (如有)
    if(localStorage.getItem('sudoku_save')) {
        const btn = document.getElementById('resume-btn');
        if(btn) btn.classList.remove('hidden');
    }
});

// --- [修正] 種子碼與難度加權連動 ---
function getDifficultyCoeff(diff) {
    if (diff < 42) return 1.0;
    if (diff < 49) return 1.8;
    if (diff === 49) return 3.0;
    if (diff >= 50) {
        let base = 8.0;
        let growth = (diff - 50) * 1.5714;
        return parseFloat((base + growth).toFixed(1));
    }
    return 1.0;
}

function updatePreview() {
    const coeff = getDifficultyCoeff(gameState.difficulty);
    const preview = document.getElementById('score-preview');
    if(preview) preview.innerText = `加權: x${coeff}`;
    
    // 生成預覽種子碼 (對齊 engine.js 邏輯)
    try {
        const tempSeed = Math.floor(Math.random() * 1000000);
        const code = engine.generateGameCode(tempSeed, gameState.difficulty, 99);
        const codeDisplay = document.getElementById('arena-code');
        if(codeDisplay) codeDisplay.innerText = code;
    } catch (e) { console.error("種子碼生成失敗", e); }
}

function selectDifficulty(val) {
    gameState.difficulty = val;
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.style.background = "white";
        btn.style.color = "#333";
    });
    const idx = [35, 42, 49].indexOf(val);
    if(idx !== -1) {
        const target = document.querySelectorAll('.diff-btn')[idx];
        target.style.background = "#4A90E2";
        target.style.color = "white";
    }
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

// --- [核心修改] 數字鍵盤鎖定邏輯 ---
function updateNumberCounts() {
    let counts = Array(10).fill(0);
    gameState.board.flat().forEach(v => { if(v !== 0) counts[v]++; });
    
    const btns = document.querySelectorAll('.numpad button');
    btns.forEach((btn, i) => {
        let num = i + 1;
        let rem = 9 - counts[num];
        
        let badge = btn.querySelector('.num-badge');
        if(badge) badge.remove();

        if(rem > 0) {
            badge = document.createElement('span');
            badge.className = 'num-badge';
            badge.innerText = rem;
            btn.appendChild(badge);
            btn.style.opacity = "1";
            btn.style.pointerEvents = "auto";
        } else {
            btn.style.opacity = "0.2";
            btn.style.pointerEvents = "none"; // 填滿 9 個，鎖定不可點選
        }
    });
}

// --- 其餘開局與渲染邏輯 (與前版一致，確保 ID 完整) ---
function startGame() {
    try {
        gameState.seed.board = Math.floor(Math.random() * 1000000);
        const full = engine.generateBoard(gameState.seed.board);
        gameState.solution = JSON.parse(JSON.stringify(full));
        
        const puzzle = engine.generatePuzzle(full, gameState.difficulty, Math.floor(Math.random()*1000));
        gameState.board = JSON.parse(JSON.stringify(puzzle));
        gameState.fixedMask = puzzle.map(r => r.map(c => c !== 0));
        gameState.notes = Array.from({length:9},()=>Array.from({length:9},()=>Array(10).fill(false)));
        
        gameState.timer = 0;
        showScreen('game-page');
        
        const diffDisplay = document.getElementById('current-diff-display');
        if(diffDisplay) diffDisplay.innerText = gameState.difficulty;

        renderBoard();
        startTimer();
        updateNumberCounts();
    } catch (e) { console.error(e); }
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function updateRankUI() {
    const totalScore = parseInt(localStorage.getItem('sudoku_total_score') || '0');
    const scoreEl = document.getElementById('display-total-score');
    if(scoreEl) scoreEl.innerText = totalScore.toLocaleString();
    
    let rank = "新手玩家 🌱";
    if (totalScore >= 150000) rank = "競技戰神 ⚡";
    else if (totalScore >= 50000) rank = "邏輯大師 🧠";
    else if (totalScore >= 10000) rank = "數獨達人 🔥";
    
    const tag = document.getElementById('player-rank-tag');
    if(tag) tag.innerText = rank;
}

// ...其餘渲染與操作函式保持不變...
