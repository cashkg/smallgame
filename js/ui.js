const UI = {
    // 顯示結算畫面並準備分享文字
    showResult(game, difficulty, time, score) {
        const m = Math.floor(time / 60);
        const s = time % 60;
        const timeStr = `${m}分${s}秒`;
        
        const shareText = `🏆 [經典競技場] 戰績報表\n` +
                          `項目：${game === 'sudoku' ? '九宮格神算' : '經典疊牌'}\n` +
                          `挑戰：${difficulty} 格\n` +
                          `耗時：${timeStr}\n` +
                          `總分：${score}\n\n` +
                          `看誰能打破我的紀錄？\n` +
                          `連結：${window.location.href}`;

        this.openShareDialog(shareText);
    },

    openShareDialog(text) {
        if (confirm("是否將戰績分享至 LINE 群組？")) {
            const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
            window.location.href = lineUrl;
        }
    },

    // 更新大廳遊玩人數統計 (目前從本地模擬，後續對接 GAS)
    updateStats(game, playerCount, topName) {
        document.getElementById(`${game}-players`).innerText = playerCount;
        document.getElementById(`${game}-top`).innerText = topName;
    }
};
