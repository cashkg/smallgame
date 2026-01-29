document.addEventListener('DOMContentLoaded', () => {
    // 讀取玩家累積積分與稱號
    const totalScore = parseInt(localStorage.getItem('sudoku_total_score') || '0');
    const userName = localStorage.getItem('user_name') || '玩家';
    
    document.getElementById('user-name').innerText = userName;
    
    // 判定稱號
    let rank = "新手玩家 🌱";
    if (totalScore >= 150000) rank = "競技戰神 ⚡";
    else if (totalScore >= 50000) rank = "邏輯大師 🧠";
    else if (totalScore >= 10000) rank = "數獨達人 🔥";
    
    document.getElementById('user-rank-display').innerText = rank;
});
