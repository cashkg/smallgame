/**
 * 數獨競技場 - 核心邏輯 (修正版)
 */
const engine = new SudokuEngine();

let gameState = {
    screen: 'setup', difficulty: 35, timer: 0, timerInterval: null,
    board: [], notes: [], solution: [], fixedMask: [],
    hintsLeft: 2, isNoteMode: false, selectedCell: null,
    seed: { board: 0, diff: 35, hole: 0 }
};

document.addEventListener('DOMContentLoaded', () => {
    updateRankUI();
    selectDifficulty(35);
});

// --- UI 更新 ---
function updateRankUI() {
    const totalScore = parseInt(localStorage.getItem('sudoku_total_score') || '0');
    let rank = "新手玩家 🌱";
    if (totalScore >= 150000) rank = "競技戰神 ⚡";
    else if (totalScore >= 50000) rank = "邏輯大師 🧠";
    else if (totalScore >= 10000) rank = "數獨達人 🔥";
    
    const tag = document.getElementById('player-rank-tag');
    if (tag) tag.innerText = `目前位階：${rank}`;
}

// --- 難度選擇 ---
function selectDifficulty(val) {
    gameState.difficulty = val;
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.style.background = "white";
        btn.style.color = "#333";
    });
    // 簡單的高亮邏輯
    const btns = document.querySelectorAll('.diff-btn');
    if(val === 35) btns[0].style.background = "#4A90E2", btns[0].style.color = "white";
    if(val === 42) btns[1].style.background = "#4A90E2", btns[1].style.color = "white";
    if(val === 49) btns[2].style.background = "#4A90E2", btns[2].style.color = "white";
}

function adjustLimit(delta) {
    if(gameState.difficulty < 50) gameState.difficulty = 50;
    gameState.difficulty += delta;
    if(gameState.difficulty < 50) gameState.difficulty = 50;
    if(gameState.difficulty > 64) gameState.difficulty = 64;
    document.getElementById('limit-display').innerText = gameState.difficulty;
}

// --- 進入遊戲 (核心修復) ---
function startGame() {
    gameState.seed.board = Math.floor(Math.random() * 1000000);
    const full = engine.generateBoard(gameState.seed.board);
    gameState.solution = JSON.parse(JSON.stringify(full));
    
    const puzzle = engine.generatePuzzle(full, gameState.difficulty, Math.floor(Math.random()*1000));
    gameState.board = JSON.parse(JSON.stringify(puzzle));
    gameState.fixedMask = puzzle.map(r => r.map(c => c !== 0));
    
    // 初始化筆記
    gameState.notes = Array.from({length:9}, () => Array.from({length:9}, () => Array(10).fill(false)));
    gameState.timer = 0;
    gameState.hintsLeft = 2;

    showScreen('game-page');
    renderBoard();
    startTimer();
    updateNumberCounts();
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
    document.getElementById(id).classList.add('active');
}

function checkWin() {
    if(gameState.board.flat().includes(0)) return;
    // 簡單檢查是否與解答一致
    const isCorrect = gameState.board.every((row, r) => row.every((val, c) => val === gameState.solution[r][c]));
    if(isCorrect) {
        clearInterval(gameState.timerInterval);
        showResult();
    }
}

function showResult() {
    showScreen('result-page');
    const score = Math.round((1000 / gameState.timer) * gameState.difficulty);
    document.getElementById('final-score').innerText = score;
    document.getElementById('res-time').innerText = gameState.timer + "s";
    document.getElementById('res-diff').innerText = gameState.difficulty;
    
    let total = parseInt(localStorage.getItem('sudoku_total_score') || '0');
    localStorage.setItem('sudoku_total_score', total + score);
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

function confirmExit() { if(confirm("確定退出並放棄進度嗎？")) location.reload(); }
