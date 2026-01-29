/**
 * 數獨競技場 - 核心邏輯 (大廳修復版)
 */
const engine = new SudokuEngine();

let gameState = {
    screen: 'setup', difficulty: 35, timer: 0, timerInterval: null,
    board: [], notes: [], solution: [], fixedMask: [],
    hintsLeft: 2, isNoteMode: false, selectedCell: null,
    seed: { board: 0 }
};

document.addEventListener('DOMContentLoaded', () => {
    updateRankUI();
    selectDifficulty(35);
    checkSave();
});

// --- [核心修改] 積分加權曲線 (隨格數動態增加) ---
function getDifficultyCoeff(diff) {
    if (diff < 42) return 1.0; // 初級
    if (diff < 49) return 1.8; // 中級
    if (diff === 49) return 3.0; // 高級
    // 極限模式：50格=8倍，每增1格加成約+1.57，64格=30倍
    if (diff >= 50) {
        let base = 8.0;
        let growth = (diff - 50) * 1.5714;
        return parseFloat((base + growth).toFixed(1));
    }
    return 1.0;
}

function updateRankUI() {
    const totalScore = parseInt(localStorage.getItem('sudoku_total_score') || '0');
    // 1. 更新累積積分顯示
    const scoreEl = document.getElementById('display-total-score');
    if (scoreEl) scoreEl.innerText = totalScore.toLocaleString();

    // 2. 更新稱號
    let rank = "新手玩家 🌱";
    if (totalScore >= 150000) rank = "競技戰神 ⚡";
    else if (totalScore >= 50000) rank = "邏輯大師 🧠";
    else if (totalScore >= 10000) rank = "數獨達人 🔥";
    
    const tag = document.getElementById('player-rank-tag');
    if (tag) tag.innerText = rank;
}

function selectDifficulty(val) {
    gameState.difficulty = val;
    // UI 高亮處理
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.style.background = "white";
        btn.style.color = "#333";
    });
    const btns = document.querySelectorAll('.diff-btn');
    if(val === 35) { btns[0].style.background = "#4A90E2"; btns[0].style.color = "white"; }
    if(val === 42) { btns[1].style.background = "#4A90E2"; btns[1].style.color = "white"; }
    if(val === 49) { btns[2].style.background = "#4A90E2"; btns[2].style.color = "white"; }
    
    updatePreview();
}

function adjustLimit(delta) {
    if(gameState.difficulty < 50) gameState.difficulty = 50;
    gameState.difficulty += delta;
    if(gameState.difficulty > 64) gameState.difficulty = 64;
    if(gameState.difficulty < 50) gameState.difficulty = 50;
    
    const display = document.getElementById('limit-display');
    if(display) display.innerText = gameState.difficulty;
    
    // 清除固定難度的高亮
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.style.background = "white";
        btn.style.color = "#333";
    });
    
    updatePreview();
}

function updatePreview() {
    const coeff = getDifficultyCoeff(gameState.difficulty);
    const preview = document.getElementById('score-preview');
    if(preview) preview.innerText = `預估積分加權: x${coeff}`;
}

// --- [核心修改] 開局與盤面標示 ---
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
        gameState.hintsLeft = 2;

        showScreen('game-page');
        
        // 顯示盤面上的難度資訊
        if(document.getElementById('current-diff-display')) 
            document.getElementById('current-diff-display').innerText = gameState.difficulty;
        if(document.getElementById('current-coeff-display')) 
            document.getElementById('current-coeff-display').innerText = `x${getDifficultyCoeff(gameState.difficulty)}`;

        renderBoard();
        startTimer();
        updateNumberCounts();
    } catch (e) {
        console.error("啟動失敗:", e);
    }
}

// --- 渲染功能 ---
function renderBoard() {
    const container = document.getElementById('sudoku-board');
    if(!container) return;
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

function renderCell(r, c) {
    const cell = document.getElementById(`cell-${r}-${c}`);
    if(!cell) return;
    const val = gameState.board[r][c];
    cell.innerHTML = '';
    if (val !== 0) {
        cell.innerText = val;
        if(!gameState.fixedMask[r][c]) cell.style.color = "#4A90E2";
    } else {
        const grid = document.createElement('div');
        grid.className = 'notes-grid';
        for(let i=1; i<=9; i++) {
            const n = document.createElement('div');
            n.className = 'note-num';
            n.innerText = gameState.notes[r][c][i] ? i : '';
            grid.appendChild(n);
        }
        cell.appendChild(grid);
    }
}

// --- 操作功能 ---
function selectCell(r, c) {
    gameState.selectedCell = {r, c};
    document.querySelectorAll('.cell').forEach(el => el.classList.remove('selected', 'highlight'));
    document.getElementById(`cell-${r}-${c}`).classList.add('selected');
}

function inputAction(num) {
    if(!gameState.selectedCell) return;
    const {r, c} = gameState.selectedCell;
    if(gameState.fixedMask[r][c]) return;

    if(gameState.isNoteMode) {
        gameState.notes[r][c][num] = !gameState.notes[r][c][num];
        gameState.board[r][c] = 0;
    } else {
        gameState.board[r][c] = num;
        gameState.notes[r][c].fill(false);
    }
    renderCell(r, c);
    updateNumberCounts();
    checkWin();
    saveState();
}

function updateNumberCounts() {
    let counts = Array(10).fill(0);
    gameState.board.flat().forEach(v => { if(v!==0) counts[v]++; });
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
        } else {
            btn.style.opacity = "0.3";
        }
    });
}

function startTimer() {
    if(gameState.timerInterval) clearInterval(gameState.timerInterval);
    gameState.timerInterval = setInterval(() => {
        gameState.timer++;
        const m = Math.floor(gameState.timer/60).toString().padStart(2,'0');
        const s = (gameState.timer%60).toString().padStart(2,'0');
        document.getElementById('timer').innerText = `${m}:${s}`;
    }, 1000);
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
}

function checkWin() {
    if(gameState.board.flat().includes(0)) return;
    const isCorrect = gameState.board.every((row, r) => row.every((val, c) => val === gameState.solution[r][c]));
    if(isCorrect) {
        clearInterval(gameState.timerInterval);
        showResult();
    }
}

function showResult() {
    showScreen('result-page');
    let baseTime = (gameState.difficulty >= 50) ? 1500 : (gameState.difficulty >= 49 ? 720 : (gameState.difficulty >= 42 ? 360 : 180));
    const coeff = getDifficultyCoeff(gameState.difficulty);
    const score = Math.round((baseTime / (gameState.timer || 1)) * gameState.difficulty * coeff);
    
    document.getElementById('final-score').innerText = score;
    document.getElementById('res-time').innerText = gameState.timer + "s";
    document.getElementById('res-diff').innerText = gameState.difficulty;
    
    let total = parseInt(localStorage.getItem('sudoku_total_score') || '0');
    localStorage.setItem('sudoku_total_score', total + score);
    localStorage.removeItem('sudoku_save');
}

function toggleNoteMode() {
    gameState.isNoteMode = !gameState.isNoteMode;
    document.getElementById('note-mode-btn').innerText = `✏️ 筆記: ${gameState.isNoteMode?'開':'關'}`;
}

function eraseCell() {
    if(!gameState.selectedCell) return;
    const {r, c} = gameState.selectedCell;
    if(gameState.fixedMask[r][c]) return;
    gameState.board[r][c] = 0;
    gameState.notes[r][c].fill(false);
    renderCell(r, c);
    updateNumberCounts();
}

function confirmExit() { if(confirm("確定退出並放棄進度嗎？")) { localStorage.removeItem('sudoku_save'); location.reload(); } }
function saveState() { localStorage.setItem('sudoku_save', JSON.stringify(gameState)); }
function checkSave() { if(localStorage.getItem('sudoku_save')) { const btn = document.getElementById('resume-btn'); if(btn) btn.classList.remove('hidden'); } }
function resumeGame() {
    const saved = localStorage.getItem('sudoku_save');
    if(!saved) return;
    gameState = JSON.parse(saved);
    showScreen('game-page');
    renderBoard();
    startTimer();
    updateNumberCounts();
}
