const engine = new SudokuEngine();

let gameState = {
    screen: 'setup', difficulty: 35, timer: 0, timerInterval: null,
    board: [], notes: [], solution: [], fixedMask: [],
    hintsLeft: 2, isNoteMode: false, selectedCell: null
};

// ... 此處省略初始化的 updateRankUI 與 selectDifficulty (保持您目前的版本) ...

function startGame() {
    try {
        const boardSeed = Math.floor(Math.random() * 1000000);
        const full = engine.generateBoard(boardSeed);
        gameState.solution = JSON.parse(JSON.stringify(full));
        
        gameState.board = engine.generatePuzzle(full, gameState.difficulty, Math.floor(Math.random()*1000));
        gameState.fixedMask = gameState.board.map(r => r.map(c => c !== 0));
        gameState.notes = Array.from({length:9},()=>Array.from({length:9},()=>Array(10).fill(false)));
        
        showScreen('game-page');
        
        // 更新顯示難度
        document.getElementById('current-diff-display').innerText = gameState.difficulty;
        
        renderBoard(); // 核心：畫出盤面
        startTimer();
        updateNumberCounts(); // 核心：更新數字鍵盤狀態
    } catch (e) { console.error("Start Error", e); }
}

// 繪製 81 格棋盤
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

// 更新單一格子內容
function renderCell(r, c) {
    const cell = document.getElementById(`cell-${r}-${c}`);
    if(!cell) return;
    const val = gameState.board[r][c];
    cell.innerHTML = '';
    if (val !== 0) {
        cell.innerText = val;
        if(!gameState.fixedMask[r][c]) cell.classList.add('user-input');
    }
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
    // TODO: checkWin();
}

// 核心功能：當數字填滿 9 個時鎖定按鍵
function updateNumberCounts() {
    let counts = Array(10).fill(0);
    gameState.board.flat().forEach(v => { if(v !== 0) counts[v]++; });
    
    const btns = document.querySelectorAll('.numpad button');
    btns.forEach((btn, i) => {
        let num = i + 1;
        if(counts[num] >= 9) {
            btn.style.opacity = "0.2";
            btn.style.pointerEvents = "none";
        } else {
            btn.style.opacity = "1";
            btn.style.pointerEvents = "auto";
        }
    });
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}
