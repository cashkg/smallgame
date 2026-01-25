const UI = {
    updateStats(game, count, top) {
        const cEl = document.getElementById(`${game}-players`);
        const tEl = document.getElementById(`${game}-top`);
        if (cEl) cEl.innerText = count;
        if (tEl) tEl.innerText = top;
    },

    showResult(game, mode, time, score) {
        const name = (window.userData) ? window.userData.displayName : "神祕玩家";
        const m = Math.floor(time / 60);
        const s = time % 60;
        const seed = GameApp.currentSeed;
        
        const url = `${window.location.origin + window.location.pathname}?game=${game}&seed=${seed}&mode=${mode}&inviter=${encodeURIComponent(name)}`;
        
        const text = `⚔️ [${name}] 在經典競技場完賽！\n項目：${game === 'sudoku' ? '數獨' : '接龍'}\n成績：${m}分${s}秒\n得分：${score}\n點連結跟我用「同一題」比速度：\n🔗 ${url}`;
        
        if (confirm("恭喜完賽！要分享戰帖給 LINE 好友嗎？")) {
            window.location.href = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
        }
    }
};
