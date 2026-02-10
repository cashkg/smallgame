const engine = new SudokuEngine();
let gameState = {
    screen: 'setup', difficulty: 35, timer: 0, timerInterval: null,
    board: [], notes: [], solution: [], fixedMask: [],
    isNoteMode: false, selectedCell: null
};

document.addEventListener('DOMContentLoaded', () => {
    updateRankUI();
    selectDifficulty(35);
});

// --- 1. 積分與UI連動 ---
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
    // 移除所有 active
    document.querySelectorAll('.diff-btn').forEach(btn => btn.classList.remove('active'));
    // 加上 active (根據文字判斷)
    document.querySelectorAll('.diff-btn').forEach(btn => {
        if(btn.innerText.includes(val.toString())) btn.classList.add('active');
    });
    updatePreview();
}

function adjustLimit(delta) {
    if(gameState.difficulty < 50) gameState.difficulty = 50;
    gameState.difficulty = Math.max(50, Math.min(64, gameState.difficulty + delta));
    document.getElementById('limit-display').innerText = gameState.difficulty;
    
    // 清除上方按鈕的 active
    document.querySelectorAll('.diff-btn').forEach(btn => btn.classList.remove('active'));
    updatePreview();
}

// --- 2. 核心邏輯：過關判定 (不依賴唯一解) ---
function checkWin() {
    if (gameState.board.flat().includes(0)) return; // 還有空格
    
    // 檢查行列宮是否有衝突
    for (let i = 0; i < 9; i++) {
        if (!isRegionValid(getRegion('row', i)) || 
            !isRegionValid(getRegion('col', i)) || 
            !isRegionValid(getRegion('block', i))) return;
    }
    
    // 全滿且無衝突 -> 過關
    clearInterval(gameState.timerInterval);
    alert("恭喜！邏輯完全正確，挑戰成功！");
    // TODO: showResult();
}

function isRegionValid(cells) {
    const nums = cells.filter(n => n !== 0);
    // 如果過濾後的數字長度 == 去重後的長度，代表無重複
    return new Set(nums).size === 9;
}

function getRegion(type, index) {
    if (type === 'row') return gameState.board[index];
    if (type === 'col') return gameState.board.map(r => r[index]);
    const rS = Math.floor(index / 3) * 3, cS = (index % 3) * 3;
    let res = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) res.push(gameState.board[rS+r][cS+c]);
    return res;
}

// --- 3. 點擊與輔助高亮 ---
function selectCell(r, c) {
    gameState.selectedCell = { r, c };
    const val = gameState.board[r][c];
    
    // 清除舊高亮
    document.querySelectorAll('.cell').forEach(el => el.classList.remove('selected', 'same-num'));
    
    // 選中高亮
    document.querySelector(`.sudoku-board div:nth-child(${r*9 + c + 1})`).classList.add('selected');
    
    // 相同數字高亮 (如果不是空格)
    if (val !== 0) {
        document.querySelectorAll('.cell').forEach(el => {
            if (el.innerText === val.toString()) el.classList.add('same-num');
        });
    }
    updateKeyboardSuggestions(r, c);
}

function updateKeyboardSuggestions(r, c) {
    const btns = document.querySelectorAll('.numpad button');
    // 如果格子已有數字，不提示
    if (gameState.board[r][c] !== 0) {
        btns.forEach(b => b.style.boxShadow = "none");
        return;
    }
    
    // 找出該格不能填的數字
    const invalid = new Set([
        ...getRegion('row', r), 
        ...getRegion('col', c), 
        ...getRegion('block', Math.floor(r/3)*3 + Math.floor(c/3))
    ]);
    
    // 提示可填數字
    btns.forEach((btn, i) => {
        btn.style.boxShadow = (!invalid.has(i + 1)) ? "0 0 10px #4A90E2 inset" : "none";
    });
}

// --- 4. 輸入與擦除 ---
function inputAction(num) {
    if (!gameState.selectedCell) return;
    const { r, c } = gameState.selectedCell;
    if (gameState.fixedMask[r][c]) return;

    if (gameState.isNoteMode) {
        gameState.notes[r][c][num] = !gameState.notes[r][c][num];
        gameState.board[r][c] = 0;
    } else {
        // 如果填入一樣的數字則取消，否則填入
        gameState.board[r][c] = (gameState.board[r][c] === num) ? 0 : num;
        gameState.notes[r][c].fill(false);
    }
    
    // 重新渲染該格
    const el = document.querySelector(`.sudoku-board div:nth-child(${r*9 + c + 1})`);
    renderCell(r, c, el);
    
    updateNumberCounts();
    checkWin();
    selectCell(r, c); // 重新觸發高亮
}

function eraseCell() {
    if (!gameState.selectedCell) return;
    const { r, c } = gameState.selectedCell;
    if (gameState.fixedMask[r][c]) return;
    gameState.board[r][c] = 0;
    gameState.notes[r][c].fill(false);
    
    const el = document.querySelector(`.sudoku-board div:nth-child(${r*9 + c + 1})`);
    renderCell(r, c, el);
    updateNumberCounts();
}

function toggleNoteMode() {
    gameState.isNoteMode = !gameState.isNoteMode;
    const btn = document.getElementById('note-mode-btn');
    if (btn) {
        btn.innerText = `✏️ 筆記: ${gameState.isNoteMode ? '開' : '關'}`;
        btn.style.background = gameState.isNoteMode ? '#e3f2fd' : 'white';
    }
}

// --- 5. 渲染與系統 ---
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
    el.innerHTML = '';
    const val = gameState.board[r][c];
    
    if (val !== 0) {
        el.innerText = val;
        if(!gameState.fixedMask[r][c]) el.classList.add('user-input');
    } else {
        // 渲染筆記
        const grid = document.createElement('div');
        grid.className = 'notes-grid';
        for(let i=1; i<=9; i++) {
            const n = document.createElement('div');
            n.className = 'note-num';
            n.innerText = gameState.notes[r][c][i] ? i : '';
            grid.appendChild(n);
        }
        el.appendChild(grid);
    }
}

function updateNumberCounts() {
    let counts = Array(10).fill(0);
    gameState.board.flat().forEach(v => { if(v !== 0) counts[v]++; });
    const btns = document.querySelectorAll('.numpad button');
    btns.forEach((btn, i) => {
        let num = i + 1;
        let rem = 9 - counts[num];
        btn.innerHTML = `${num}<span style="position:absolute; bottom:2px; right:2px; font-size:10px; color:#777;">${rem > 0 ? rem : ''}</span>`;
        if(rem <= 0) { btn.style.opacity = "0.2"; btn.style.pointerEvents = "none"; }
        else { btn.style.opacity = "1"; btn.style.pointerEvents = "auto"; }
    });
}

function startGame() {
    try {
        const full = engine.generateBoard(Math.floor(Math.random() * 1000000));
        gameState.solution = JSON.parse(JSON.stringify(full));
        gameState.board = engine.generatePuzzle(full, gameState.difficulty, Math.floor(Math.random()*1000));
        gameState.fixedMask = gameState.board.map(r => r.map(c => c !== 0));
        gameState.notes = Array.from({length:9},()=>Array.from({length:9},()=>Array(10).fill(false)));
        
        document.getElementById('setup-page').classList.remove('active');
        document.getElementById('game-page').classList.add('active');
        
        document.getElementById('current-diff-display').innerText = gameState.difficulty;
        document.getElementById('current-coeff-display').innerText = `x${getDifficultyCoeff(gameState.difficulty)}`;
        
        renderBoard();
        updateNumberCounts();
        startTimer();
    } catch (e) { console.error(e); }
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
