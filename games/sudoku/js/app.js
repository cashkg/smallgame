/**
 * 數獨競技場 - 積分曲線與顯示修正版
 */
const engine = new SudokuEngine();

// ...其餘 gameState 變數保持不變...

// --- [核心修改] 積分加權曲線 ---
function getDifficultyCoeff(diff) {
    if (diff >= 60) return 30.0; // 極限頂峰
    if (diff >= 50) return 8.0;  // 極限入門
    if (diff >= 49) return 3.0;  // 高級
    if (diff >= 42) return 1.8;  // 中級
    return 1.0;                  // 初級
}

function updateCodePreview() {
    // ...種子碼生成邏輯...
    const coeff = getDifficultyCoeff(gameState.difficulty);
    const display = document.getElementById('score-preview');
    if (display) {
        display.innerText = `預估積分加權: x${coeff.toFixed(1)}`;
        // 如果是極限模式，字體變紅加粗
        display.style.color = gameState.difficulty >= 50 ? "#C0392B" : "#D35400";
    }
}

// --- [核心修改] 顯示目前累計積分 ---
function updateRankUI() {
    const totalScore = parseInt(localStorage.getItem('sudoku_total_score') || '0');
    
    // 更新累計數字
    const scoreEl = document.getElementById('display-total-score');
    if (scoreEl) scoreEl.innerText = totalScore.toLocaleString(); // 加入千分位標點

    // 更新稱號
    let rank = "新手玩家 🌱";
    if (totalScore >= 150000) rank = "競技戰神 ⚡";
    else if (totalScore >= 50000) rank = "邏輯大師 🧠";
    else if (totalScore >= 10000) rank = "數獨達人 🔥";
    
    const tag = document.getElementById('player-rank-tag');
    if (tag) tag.innerText = rank;
}

// --- 修正勝利後的積分計算 ---
function showResult() {
    showScreen('result-page');
    
    const coeff = getDifficultyCoeff(gameState.difficulty);
    let baseTime = 180; // 基準秒數
    if (gameState.difficulty >= 42) baseTime = 360;
    if (gameState.difficulty >= 49) baseTime = 720;
    if (gameState.difficulty >= 50) baseTime = 1500;

    let hintBonus = 1.0;
    if (gameState.hintsLeft === 2) hintBonus = 1.5;
    if (gameState.hintsLeft === 1) hintBonus = 1.2;

    // 最終得分公式
    let score = Math.round((baseTime / (gameState.timer || 1)) * gameState.difficulty * coeff * hintBonus);
    
    // 更新累積積分
    let currentTotal = parseInt(localStorage.getItem('sudoku_total_score') || '0');
    localStorage.setItem('sudoku_total_score', currentTotal + score);
    
    document.getElementById('final-score').innerText = score;
    // ...其餘結算渲染...
}

// 初始化時務必呼叫
function initSetup() {
    selectDifficulty(35);
    updateRankUI(); // 顯示累積積分
}
