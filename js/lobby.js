/**
 * 老爸競技場 - 大廳邏輯
 */

document.addEventListener('DOMContentLoaded', () => {
    initLobby();
});

function initLobby() {
    // 模擬讀取使用者資料 (未來接 LINE LIFF)
    // 這裡先寫死，讓畫面好看
    const mockUser = {
        name: "老爸玩家001",
        avatar: "https://via.placeholder.com/60/4A90E2/FFFFFF?text=DAD"
    };

    document.getElementById('user-name').innerText = mockUser.name;
    document.getElementById('user-avatar').src = mockUser.avatar;
    
    // 檢查是否有未完成的遊戲存檔，有的話可以在這裡顯示提示
    const sudokuSave = localStorage.getItem('sudoku_save');
    if(sudokuSave) {
        document.querySelector('.game-desc').innerText = "🔴 尚有未完成對局，點擊繼續";
        document.querySelector('.game-desc').style.color = "#E74C3C";
        document.querySelector('.game-desc').style.fontWeight = "bold";
    }
}

// 核心跳轉功能
function enterGame(gameName) {
    if (gameName === 'sudoku') {
        // 這裡的路徑非常重要！
        // 從根目錄跳轉到 games/sudoku/index.html
        window.location.href = './games/sudoku/index.html';
    } else {
        alert("此遊戲尚在開發中，請稍候！");
    }
}
