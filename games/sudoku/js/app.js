/**
 * 數獨競技場 - 核心邏輯穩定版
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
    checkSave();
});

// 顯示螢幕切換 (關鍵修復：解決兩個介面疊在一起)
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
}

// 難度選擇與預覽
function selectDifficulty(val) {
    gameState.difficulty = val;
    document.querySelectorAll('.diff-btn').forEach(btn => btn.classList.remove('active-diff'));
    // 這裡可以加入更精確的按鈕選取邏輯
    updatePreview();
}

function updatePreview() {
    const coeff = getDifficultyCoeff(gameState.difficulty);
    const preview = document.getElementById('score-preview');
    if (preview) preview.innerText = `加權: x${coeff}`;
    
    try {
        const tempSeed = Math.floor(Math.random() * 1000000);
        const code = engine.generateGameCode(tempSeed, gameState.difficulty, 99);
        const codeDisplay = document.getElementById('arena-code');
        if (codeDisplay) codeDisplay.innerText = code;
    } catch (e) { console.error(e); }
}

// 開始競技
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
        showScreen('game-page'); // 切換到遊戲畫面
        
        const diffDisplay = document.getElementById('current-diff-display');
        if (diffDisplay) diffDisplay.innerText = gameState.difficulty;

        renderBoard();
        startTimer();
        updateNumberCounts();
    } catch (e) { console.error("啟動失敗", e); }
}

// 數字鍵鎖定邏輯
function updateNumberCounts() {
    let counts = Array(10).fill(0);
    gameState.board.flat().forEach(v => { if(v !== 0) counts[v]++; });
    
    const btns = document.querySelectorAll('.numpad button');
    btns.forEach((btn, i) => {
        let num = i + 1;
        let rem = 9 - counts[num];
        let badge = btn.querySelector('.num-badge');
        if (badge) badge.remove();

        if (rem > 0) {
            badge = document.createElement('span');
            badge.className = 'num-badge';
            badge.innerText = rem;
            btn.appendChild(badge);
            btn.style.opacity = "1";
            btn.style.pointerEvents = "auto";
        } else {
            btn.style.opacity = "0.2";
            btn.style.pointerEvents = "none";
        }
    });
}

// 其餘渲染函式 renderBoard, selectCell, inputAction... 略
