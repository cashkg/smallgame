// --- 核心修改：數字鍵盤鎖定邏輯 ---
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
            btn.classList.remove('btn-disabled'); // 恢復可選
        } else {
            btn.classList.add('btn-disabled'); // 填滿 9 個，鎖定不可點選
        }
    });
}

// --- 恢復種子碼功能 ---
function updatePreview() {
    const coeff = getDifficultyCoeff(gameState.difficulty);
    const preview = document.getElementById('score-preview');
    if(preview) preview.innerText = `加權: x${coeff}`;
    
    // 生成預覽種子碼
    const tempSeed = Math.floor(Math.random() * 1000000);
    const code = engine.generateGameCode(tempSeed, gameState.difficulty, 99);
    const codeDisplay = document.getElementById('arena-code');
    if(codeDisplay) codeDisplay.innerText = code;
}

// 修正原本 startGame 漏掉的 ID 標記
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
        showScreen('game-page');
        
        if(document.getElementById('current-diff-display')) 
            document.getElementById('current-diff-display').innerText = gameState.difficulty;

        renderBoard();
        startTimer();
        updateNumberCounts();
    } catch (e) { console.error(e); }
}
