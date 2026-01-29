/**
 * 數獨競技場 - 完整核心邏輯
 */
const engine = new SudokuEngine();

let gameState = {
    screen: 'setup', difficulty: 35, timer: 0, timerInterval: null,
    board: [], notes: [], solution: [], fixedMask: [],
    hintsLeft: 2, isNoteMode: false, selectedCell: null,
    seed: { board: 0, diff: 35, hole: 0 },
    history: [], isPaused: false
};

document.addEventListener('DOMContentLoaded', () => {
    initSetup();
    checkSave();
});

// --- 設置頁邏輯 ---
function selectDifficulty(val) {
    gameState.difficulty = val;
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    if([35, 42, 49].includes(val)) {
        const idx = [35, 42, 49].indexOf(val);
        document.querySelectorAll('.diff-btn')[idx].classList.add('active');
        document.querySelector('.limit-mode-zone').style.opacity = '0.5';
    }
    updateCodePreview();
}

function adjustLimit(delta) {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.limit-mode-zone').style.opacity = '1';
    if(gameState.difficulty < 50) gameState.difficulty = 50;
    let newVal = gameState.difficulty + delta;
    if (newVal < 50) newVal = 50; if (newVal > 64) newVal = 64;
    gameState.difficulty = newVal;
    document.getElementById('limit-display').innerText = newVal;
    updateCodePreview();
}

function updateCodePreview() {
    const code = engine.generateGameCode(Math.random()*1000, gameState.difficulty, Math.random()*100);
    document.getElementById('arena-code').innerText = code;
    let coeff = gameState.difficulty >= 50 ? 6.0 : (gameState.difficulty >= 49 ? 3.0 : 1.0);
    document.getElementById('score-preview').innerText = `預估加權: x${coeff}`;
}

// --- 遊戲控制 ---
function startGame() {
    gameState.seed.diff = gameState.difficulty;
    gameState.seed.board = Math.floor(Math.random() * 1000000);
    gameState.seed.hole = Math.floor(Math.random() * 1000);

    const full = engine.generateBoard(gameState.seed.board);
    gameState.solution = JSON.parse(JSON.stringify(full));
    const puzzle = engine.generatePuzzle(full, gameState.seed.diff, gameState.seed.hole);
    gameState.board = JSON.parse(JSON.stringify(puzzle));
    gameState.fixedMask = puzzle.map(r => r.map(c => c !== 0));
    
    gameState.timer = 0;
    gameState.hintsLeft = 2;
    initNotes();
    showScreen('game-page');
    renderBoard();
    startTimer();
    updateNumberCounts();
}

// --- 繪製功能 ---
function renderBoard() {
    const container = document.getElementById('sudoku-board');
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
    cell.innerHTML = '';
    const val = gameState.board[r][c];
    if (val !== 0) {
        cell.innerText = val;
        if(!gameState.fixedMask[r][c]) cell.classList.add('user-input');
    } else {
        const grid = document.createElement('div');
        grid.className = 'notes-grid';
        for (let i = 1; i <= 9; i++) {
            const note = document.createElement('div');
            note.className = 'note-num';
            note.innerText = gameState.notes[r][c][i] ? i : '';
            grid.appendChild(note);
        }
        cell.appendChild(grid);
    }
}

function selectCell(r, c) {
    gameState.selectedCell = {r, c};
    document.querySelectorAll('.cell').forEach(el => el.classList.remove('selected', 'highlight'));
    document.getElementById(`cell-${r}-${c}`).classList.add('selected');
    for(let i=0; i<9; i++) {
        document.getElementById(`cell-${r}-${i}`).classList.add('highlight');
        document.getElementById(`cell-${i}-${c}`).classList.add('highlight');
    }
}

function inputAction(num) {
    if (!gameState.selectedCell) return;
    const { r, c } = gameState.selectedCell;
    if (gameState.fixedMask[r][c]) return;

    if (gameState.isNoteMode) {
        gameState.notes[r][c][num] = !gameState.notes[r][c][num];
        gameState.board[r][c] = 0;
    } else {
        gameState.board[r][c] = num;
        gameState.notes[r][c].fill(false);
    }
    renderCell(r, c);
    updateNumberCounts();
    checkAllErrors();
    checkWin();
    saveState();
}

function eraseCell() {
    if (!gameState.selectedCell) return;
    const { r, c } = gameState.selectedCell;
    if (gameState.fixedMask[r][c]) return;
    gameState.board[r][c] = 0;
    gameState.notes[r][c].fill(false);
    renderCell(r, c);
    updateNumberCounts();
    checkAllErrors();
}

// --- 統計與校驗 ---
function updateNumberCounts() {
    let counts = Array(10).fill(0);
    gameState.board.forEach(row => row.forEach(v => { if(v!==0) counts[v]++; }));
    const btns = document.querySelectorAll('.numpad button');
    btns.forEach((btn, i) => {
        let num = i + 1;
        let rem = 9 - counts[num];
        let old = btn.querySelector('.num-badge');
        if (old) old.remove();
        if (rem > 0) {
            let badge = document.createElement('span');
            badge.className = 'num-badge'; badge.innerText = rem;
            btn.appendChild(badge); btn.disabled = false; btn.style.opacity = "1";
        } else {
            btn.disabled = true; btn.style.opacity = "0.3";
        }
    });
}

function checkWin() {
    for (let r=0; r<9; r++) for (let c=0; c<9; c++) if (gameState.board[r][c] === 0) return;
    if (!hasAnyConflict()) {
        clearInterval(gameState.timerInterval);
        showResult();
    }
}

function hasAnyConflict() {
    for (let i = 0; i < 9; i++) {
        if (isRegionInvalid(getCells(i, 'row'))) return true;
        if (isRegionInvalid(getCells(i, 'col'))) return true;
        if (isRegionInvalid(getCells(i, 'block'))) return true;
    }
    return false;
}

function isRegionInvalid(cells) {
    let seen = new Set();
    for (let v of cells) { if(v!==0) { if(seen.has(v)) return true; seen.add(v); } }
    return false;
}

function getCells(idx, type) {
    let res = [];
    if(type==='row') for(let i=0; i<9; i++) res.push(gameState.board[idx][i]);
    if(type==='col') for(let i=0; i<9; i++) res.push(gameState.board[i][idx]);
    if(type==='block') {
        let r=Math.floor(idx/3)*3, c=(idx%3)*3;
        for(let i=0; i<3; i++) for(let j=0; j<3; j++) res.push(gameState.board[r+i][c+j]);
    }
    return res;
}

function checkAllErrors() {
    document.querySelectorAll('.cell').forEach(el => el.classList.remove('error'));
    // 簡單錯誤提示：與解答不同即紅 (可選) 或 規則衝突
    for(let r=0; r<9; r++) {
        for(let c=0; c<9; c++) {
            let v = gameState.board[r][c];
            if(v !== 0 && v !== gameState.solution[r][c]) document.getElementById(`cell-${r}-${c}`).classList.add('error');
        }
    }
}

// --- 系統功能 ---
function startTimer() {
    if(gameState.timerInterval) clearInterval(gameState.timerInterval);
    gameState.timerInterval = setInterval(() => {
        gameState.timer++;
        let m = Math.floor(gameState.timer/60).toString().padStart(2,'0');
        let s = (gameState.timer%60).toString().padStart(2,'0');
        document.getElementById('timer').innerText = `${m}:${s}`;
    }, 1000);
}

function showResult() {
    showScreen('result-page');
    let score = Math.round((1000 / (gameState.timer || 1)) * gameState.difficulty);
    let total = parseInt(localStorage.getItem('sudoku_total_score') || '0');
    localStorage.setItem('sudoku_total_score', total + score);
    
    document.getElementById('final-score').innerText = score;
    document.getElementById('res-time').innerText = gameState.timer + "s";
    document.getElementById('res-diff').innerText = gameState.difficulty;
    document.getElementById('res-hint').innerText = (2 - gameState.hintsLeft);
    
    uploadRecord(score);
}

async function uploadRecord(score) {
    const GAS_URL = "https://script.google.com/macros/s/AKfycbzWvr0O-3kcxKqEGZMCD8_fQegxljPLE2xHh1_V-VZLgfGZbQ9PZulkFnYYA0rNzSn9/exec"; 
    const payload = {
        userName: localStorage.getItem('user_name') || "玩家",
        difficulty: gameState.difficulty,
        time: gameState.timer,
        score: score,
        seed: gameState.seed.board,
        hints: 2 - gameState.hintsLeft,
        boardStr: gameState.board.flat().join('')
    };
    try { await fetch(GAS_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) }); } catch (e) {}
}

// --- 輔助 ---
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    gameState.screen = id;
}
function toggleNoteMode() {
    gameState.isNoteMode = !gameState.isNoteMode;
    document.getElementById('note-mode-btn').innerText = `✏️ 筆記: ${gameState.isNoteMode?'開':'關'}`;
}
function initNotes() {
    gameState.notes = Array.from({length:9},()=>Array.from({length:9},()=>Array(10).fill(false)));
}
function initSetup() { selectDifficulty(35); }
function goHome() { window.location.href = '../../index.html'; }
function confirmExit() { if(confirm("確定退出？")) goHome(); }
function saveState() { localStorage.setItem('sudoku_save', JSON.stringify(gameState)); }
function checkSave() { if(localStorage.getItem('sudoku_save')) document.getElementById('resume-btn').classList.remove('hidden'); }
function resumeGame() {
    gameState = JSON.parse(localStorage.getItem('sudoku_save'));
    showScreen('game-page'); renderBoard(); startTimer(); updateNumberCounts();
}
