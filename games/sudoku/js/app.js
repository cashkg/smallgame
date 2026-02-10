const engine = new SudokuEngine();
let gameState = {
    screen: 'setup', difficulty: 35, timer: 0, timerInterval: null,
    board: [], solution: [], fixedMask: [], selectedCell: null
};

document.addEventListener('DOMContentLoaded', () => { updateRankUI(); selectDifficulty(35); });

function getDifficultyCoeff(diff) {
    if (diff < 42) return 1.0;
    if (diff < 49) return 1.8;
    if (diff === 49) return 3.0;
    if (diff >= 50) return parseFloat((8.0 + (diff - 50) * 1.57).toFixed(1));
    return 1.0;
}

function updatePreview() {
    const coeff = getDifficultyCoeff(gameState.difficulty);
    const preview = document.getElementById('score-preview');
    if(preview) preview.innerText = `預估加成: x${coeff}`;
    const codeDisplay = document.getElementById('arena-code');
    if(codeDisplay) {
        const tempSeed = Math.floor(Math.random() * 1000000);
        codeDisplay.innerText = `SEED: ${engine.generateGameCode(tempSeed, gameState.difficulty, 99)}`;
    }
}

function selectDifficulty(val) {
    gameState.difficulty = val;
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.style.background = "white"; btn.style.color = "#333";
    });
    updatePreview();
}

function adjustLimit(delta) {
    if(gameState.difficulty < 50) gameState.difficulty = 50;
    gameState.difficulty = Math.max(50, Math.min(64, gameState.difficulty + delta));
    document.getElementById('limit-display').innerText = gameState.difficulty;
    updatePreview();
}

function startGame() {
    try {
        const full = engine.generateBoard(Math.floor(Math.random() * 1000000));
        gameState.solution = JSON.parse(JSON.stringify(full));
        gameState.board = engine.generatePuzzle(full, gameState.difficulty, Math.floor(Math.random()*1000));
        gameState.fixedMask = gameState.board.map(r => r.map(c => c !== 0));
        
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('game-page').classList.add('active');
        
        document.getElementById('current-diff-display').innerText = gameState.difficulty;
        document.getElementById('current-coeff-display').innerText = `x${getDifficultyCoeff(gameState.difficulty)}`;
        
        renderBoard();
        updateNumberCounts();
        startTimer();
    } catch (e) { console.error(e); }
}

function updateNumberCounts() {
    let counts = Array(10).fill(0);
    gameState.board.flat().forEach(v => { if(v !== 0) counts[v]++; });
    const btns = document.querySelectorAll('.numpad button');
    btns.forEach((btn, i) => {
        let num = i + 1;
        let rem = 9 - counts[num];
        // 修正標籤，防止 18, 27 併排
        btn.innerHTML = `${num}<span style="position:absolute; bottom:2px; right:2px; font-size:10px; color:#777;">${rem > 0 ? rem : ''}</span>`;
        if(rem <= 0) { btn.style.opacity = "0.2"; btn.style.pointerEvents = "none"; }
        else { btn.style.opacity = "1"; btn.style.pointerEvents = "auto"; }
    });
}

function renderBoard() {
    const container = document.getElementById('sudoku-board');
    container.innerHTML = '';
    for(let r=0; r<9; r++) {
        for(let c=0; c<9; c++) {
            const div = document.createElement('div');
            div.className = 'cell';
            if (gameState.fixedMask[r][c]) div.classList.add('fixed');
            div.onclick = () => selectCell(r, c);
            container.appendChild(div);
            renderCell(r, c, div);
        }
    }
}

function renderCell(r, c, el) {
    const val = gameState.board[r][c];
    el.innerText = val !== 0 ? val : '';
    if(val !== 0 && !gameState.fixedMask[r][c]) el.classList.add('user-input');
}

function selectCell(r, c) {
    gameState.selectedCell = {r, c};
    document.querySelectorAll('.cell').forEach(el => el.classList.remove('selected'));
    document.querySelector(`.sudoku-board div:nth-child(${r*9 + c + 1})`).classList.add('selected');
}

function inputAction(num) {
    if(!gameState.selectedCell) return;
    const {r, c} = gameState.selectedCell;
    if(gameState.fixedMask[r][c]) return;
    gameState.board[r][c] = num;
    const el = document.querySelector(`.sudoku-board div:nth-child(${r*9 + c + 1})`);
    renderCell(r, c, el);
    updateNumberCounts();
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

function updateRankUI() {
    const total = parseInt(localStorage.getItem('sudoku_total_score') || '0');
    document.getElementById('display-total-score').innerText = total.toLocaleString();
}

function confirmExit() { if(confirm("確定退出？")) location.reload(); }
