/**
 * 數獨競技場 - 核心邏輯 (功能完備版)
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
    if(localStorage.getItem('sudoku_save')) {
        const btn = document.getElementById('resume-btn');
        if(btn) btn.classList.remove('hidden');
    }
});

// --- 積分與加成邏輯 ---
function getDifficultyCoeff(diff) {
    if (diff < 42) return 1.0;
    if (diff < 49) return 1.8;
    if (diff === 49) return 3.0;
    if (diff >= 50) {
        // 極限模式：50格=8.0, 64格=30.0，每增一格加成約 1.57
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
    const btns = document.querySelectorAll('.diff-btn');
    if(val === 35 && btns[0]) { btns[0].style.background = "#4A90E2"; btns[0].style.color = "white"; }
    if(val === 42 && btns[1]) { btns[1].style.background = "#4A90E2"; btns[1].style.color = "white"; }
    if(val === 49 && btns[2]) { btns[2].style.background = "#4A90E2"; btns[2].style.color = "white"; }
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
    const codeDisplay = document.getElementById('arena-code');
    if(codeDisplay) {
        const tempSeed = Math.floor(Math.random() * 1000000);
        codeDisplay.innerText = `SEED: ${engine.generateGameCode(tempSeed, gameState.difficulty, 99)}`;
    }
}

// --- 遊戲執行邏輯 ---
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
    } catch (e) { console.error("Game Start Error:", e); }
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
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
    cell.innerHTML = '';
    if (val !== 0) {
        cell.innerText = val;
        if(!gameState.fixedMask[r][c]) cell.style.color = "#4A90E2"; // 玩家輸入藍色
    } else {
        const grid = document.createElement('div');
        grid.className = 'notes-grid';
        for(let i=1; i<=9; i++) {
            const n = document.createElement('div');
            n.className = 'note-num';
            n.style.color = "#3498DB"; // 筆記顏色
            n.innerText = gameState.notes[r][c][i] ? i : '';
            grid.appendChild(n);
        }
        cell.appendChild(grid);
    }
}

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
            btn.style.opacity = "0.2"; // 滿 9 個變灰
            btn.style.pointerEvents = "none"; // 禁止點選
        }
    });
}

function startTimer() {
    if(gameState.timerInterval) clearInterval(gameState.timerInterval);
    gameState.timerInterval = setInterval(() => {
        gameState.timer++;
        const m = Math.floor(gameState.timer/60).toString().padStart(2,'0');
        const s = (gameState.timer%60).toString().padStart(2,'0');
        const timerEl = document.getElementById('timer');
        if(timerEl) timerEl.innerText = `${m}:${s}`;
    }, 1000);
}

function checkWin() {
    if(gameState.board.flat().includes(0)) return;
    const isCorrect = gameState.board.every((row, r) => row.every((val, c) => val === gameState.solution[r][c]));
    if(isCorrect) {
        clearInterval(gameState.timerInterval);
        alert("挑戰成功！正在上傳戰績...");
        showResult();
    }
}

function showResult() {
    // 結算分數計算
    let baseTime = (gameState.difficulty >= 50) ? 1500 : (gameState.difficulty >= 49 ? 720 : 360);
    const coeff = getDifficultyCoeff(gameState.difficulty);
    const score = Math.round((baseTime / (gameState.timer || 1)) * gameState.difficulty * coeff);
    
    let total = parseInt(localStorage.getItem('sudoku_total_score') || '0');
    localStorage.setItem('sudoku_total_score', total + score);
    
    // 跳轉回大廳或顯示結果 (這裡可依需求擴充 result-page 顯示)
    location.reload(); 
}

function toggleNoteMode() {
    gameState.isNoteMode = !gameState.isNoteMode;
    const btn = document.getElementById('note-mode-btn');
    if(btn) btn.innerText = `✏️ 筆記: ${gameState.isNoteMode?'開':'關'}`;
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

function confirmExit() { if(confirm("確定退出？")) location.reload(); }
function saveState() { localStorage.setItem('sudoku_save', JSON.stringify(gameState)); }
function resumeGame() {
    const saved = localStorage.getItem('sudoku_save');
    if(!saved) return;
    gameState = JSON.parse(saved);
    showScreen('game-page');
    renderBoard();
    startTimer();
    updateNumberCounts();
}
