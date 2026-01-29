/**
 * 數獨 App - 戰績上傳與數字統計版
 */

// --- [核心新增] 剩餘數字統計 ---
function updateNumberCounts() {
    let counts = Array(10).fill(0);
    // 統計盤面上 1-9 出現次數
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            let val = gameState.board[r][c];
            if (val !== 0) counts[val]++;
        }
    }

    // 更新 UI 鍵盤
    const buttons = document.querySelectorAll('.numpad button');
    buttons.forEach((btn, index) => {
        let num = index + 1;
        let remaining = 9 - counts[num];
        
        // 移除舊標籤
        let oldBadge = btn.querySelector('.num-badge');
        if (oldBadge) oldBadge.remove();

        if (remaining > 0) {
            let badge = document.createElement('span');
            badge.className = 'num-badge';
            badge.innerText = remaining;
            btn.appendChild(badge);
            btn.disabled = false;
            btn.style.opacity = "1";
        } else {
            // 數字已滿 9 個，按鈕變灰
            btn.disabled = true;
            btn.style.opacity = "0.3";
        }
    });
}

// --- [隱藏功能] Checksum 生成器 ---
function getClientChecksum() {
    let boardStr = gameState.board.flat().join('');
    let raw = gameState.seed.board + "X" + gameState.timer + "Y" + (2 - gameState.hintsLeft) + "Z" + boardStr.substring(0, 10);
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        hash = ((hash << 5) - hash) + raw.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(16).substring(0, 8);
}

// --- [核心優化] 完賽並上傳戰績 ---
async function uploadRecord(score) {
    const GAS_URL = "https://script.google.com/macros/s/AKfycbzWvr0O-3kcxKqEGZMCD8_fQegxljPLE2xHh1_V-VZLgfGZbQ9PZulkFnYYA0rNzSn9/exec"; 
    const payload = {
        userName: localStorage.getItem('user_name') || "玩家",
        difficulty: gameState.difficulty,
        time: gameState.timer,
        score: score,
        seed: gameState.seed.board,
        hints: 2 - gameState.hintsLeft,
        boardStr: gameState.board.flat().join(''),
        checksum: getClientChecksum() // 靜悄悄地上傳校驗碼
    };

    try {
        await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors', // GAS 跨域常用設定
            body: JSON.stringify(payload)
        });
        console.log("戰績已同步至雲端");
    } catch (e) {
        console.error("同步失敗", e);
    }
}

// 在 inputAction 結束時調用統計
function inputAction(num) {
    // ... 原有邏輯 ...
    renderCell(r, c);
    updateNumberCounts(); // 更新統計
    checkAllErrors();
    checkWin();
}
