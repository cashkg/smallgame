/**
 * 數獨競技場 - 核心邏輯 (終極穩定版)
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
});

// --- 積分與加成 ---
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
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.style.background = "white"; btn.style.color = "#333";
    });
    const idx = [35, 42, 49].indexOf(val);
    if(idx !== -1) {
        const target = document.querySelectorAll('.diff-btn')[idx];
        target.style.background = "#4A90E2"; target.style.color = "white";
    }
    updatePreview();
}

function adjustLimit(delta) {
    if(gameState.difficulty < 50) gameState.difficulty = 50;
    gameState.difficulty += delta;
    if(gameState.difficulty > 64) gameState.difficulty = 64;
    const display = document.getElementById('limit-display');
    if(display) display.innerText = gameState.difficulty;
    updatePreview();
}

function updatePreview() {
    const coeff = getDifficultyCoeff(gameState.difficulty);
    const preview = document.getElementById('score-preview');
    if(preview) preview.innerText = `加權: x${coeff}`;
}

// --- 遊戲流程 ---
function startGame() {
    try {
        const full = engine.generateBoard(Math.floor(Math.random() * 1000000));
        gameState.solution = JSON.parse(JSON.stringify(full));
        gameState.board = engine.generatePuzzle(full, gameState.difficulty, Math.floor(Math.random()*1000));
        gameState.fixedMask = gameState.board.map(r => r.map(c => c !== 0));
        gameState.notes = Array.from({length:9},()=>Array.from({length:9},()=>Array(10).fill(false)));
        gameState.timer = 0;

        showScreen('game-page');
        document.getElementById('current-diff-display').innerText = gameState.difficulty;
        document.getElementById('current-coeff-display').innerText = `x${getDifficultyCoeff(gameState.difficulty)}`;
        
        renderBoard();
        startTimer();
        updateNumberCounts();
    } catch (e) { console.error("Start Error", e); }
}

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
    cell.innerHTML = val !== 0 ? val : '';
    if(val !== 0 && !gameState.fixedMask[r][c]) cell.style.color = "#4A90E2";
}

function selectCell(r, c) {
    gameState.selectedCell = {r, c};
    document.querySelectorAll('.cell').forEach(el => el.classList.remove('selected'));
    document.getElementById(`cell-${r}-${c}`).classList.add('selected');
}

function inputAction(num) {
    if(!gameState.selectedCell) return;
    const {r, c} = gameState.selectedCell;
    if(gameState.fixedMask[r][c]) return;
    gameState.board[r][c] = num;
    renderCell(r, c);
    updateNumberCounts();
}

function updateNumberCounts() {
    let counts = Array(10).fill(0);
    gameState.board.flat().forEach(v => { if(v !== 0) counts[v]++; });
    const btns = document.querySelectorAll('.numpad button');
    btns.forEach((btn, i) => {
        let num = i + 1;
        let rem = 9 - counts[num];
        let badge = btn.querySelector('.num-badge') || document.createElement('span');
        badge.className = 'num-badge'; badge.innerText = rem > 0 ? rem : '';
        if(!btn.contains(badge)) btn.appendChild(badge);
        if(rem <= 0) { btn.style.opacity = "0.2"; btn.style.pointerEvents = "none"; }
        else { btn.style.opacity = "1"; btn.style.pointerEvents = "auto"; }
    });
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
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

function confirmExit() { if(confirm("確定退出？")) location.reload(); }
function toggleNoteMode() { /* 待擴充 */ }
function eraseCell() { /* 待擴充 */ }
