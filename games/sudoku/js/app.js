/**
 * 數獨競技場 - 核心邏輯 (最終完整版)
 */
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

// --- 1. 積分與 UI 連動 ---
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
    document.querySelectorAll('.diff-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.diff-btn').forEach(btn => {
        if(btn.innerText.includes(val.toString())) btn.classList.add('active');
    });
    updatePreview();
}

function adjustLimit(delta) {
    if(gameState.difficulty < 50) gameState.difficulty = 50;
    gameState.difficulty = Math.max(50, Math.min(64, gameState.difficulty + delta));
    document.getElementById('limit-display').innerText = gameState.difficulty;
    document.querySelectorAll('.diff-btn').forEach(btn => btn.classList.remove('active'));
    updatePreview();
}

// --- 2. 核心邏輯：過關判定 ---
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
    
    setTimeout(() => {
        alert("恭喜！邏輯完全正確，挑戰成功！");
        showResult(); 
    }, 100);
}

function isRegionValid(cells) {
    const nums = cells.filter(n => n !== 0);
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
    
    document.querySelectorAll('.cell').forEach(el => el.classList.remove('selected', 'same-num'));
    document.querySelector(`.sudoku-board div:nth-child(${r*9 + c + 1})`).classList.add('selected');
    
    if (val !== 0) {
        document.querySelectorAll('.cell').forEach(el => {
            if (el.innerText === val.toString()) el.classList.add('same-num');
        });
    }
    updateKeyboardSuggestions(r, c);
}

function updateKeyboardSuggestions(r, c) {
    const btns = document.querySelectorAll('.numpad button');
    if (gameState.board[r][c] !== 0) {
        btns.forEach(b =>
