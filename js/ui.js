/**
 * 介面渲染模組 (js/ui.js) - 完整覆蓋版
 * 實作：分享遊戲、分享中局、分享挑戰
 */

const UI = {
    // 取得當前玩家 LINE ID 或名稱
    getSharerName() {
        return (window.userData && window.userData.displayName) ? window.userData.displayName : "神祕玩家";
    },

    // 模式 1：分享整個遊戲 (拉人進場)
    shareApp() {
        const name = this.getSharerName();
        const text = `🎮 [${name}] 邀請你加入經典競技場！\n這裡有最硬核的數獨與接龍挑戰，還有即時排行榜，快來切磋！\n🔗 ${window.location.origin + window.location.pathname}`;
        this.sendToLine(text);
    },

    // 模式 2：分享中局盤面 (求助解謎)
    shareCurrentState() {
        const name = this.getSharerName();
        const game = GameApp.currentGame;
        const seed = GameApp.currentSeed;
        let state = "";

        if (game === 'sudoku') {
            state = Sudoku.grid.join(''); // 將數獨盤面轉為字串
        }

        const url = `${window.location.origin + window.location.pathname}?game=${game}&seed=${seed}&state=${state}&inviter=${encodeURIComponent(name)}`;
        const text = `🆘 [${name}] 在數獨卡關了！\n這題盤面太刁鑽，誰能幫忙解開？點開連結接手挑戰：\n🔗 ${url}`;
        this.sendToLine(text);
    },

    // 模式 3：完成後的盤面邀請 (同題競賽)
    shareChallenge(game, mode, time, score) {
        const name = this.getSharerName();
        const seed = GameApp.currentSeed;
        const url = `${window.location.origin + window.location.pathname}?game=${game}&seed=${seed}&mode=${mode}&inviter=${encodeURIComponent(name)}`;
        
        const m = Math.floor(time / 60);
        const s = time % 60;

        const text = `⚔️ [${name}] 發出了競技邀請！\n項目：${game === 'sudoku' ? '數獨' : '接龍'}\n我的戰績：${m}分${s}秒 (得分:${score})\n使用「相同題目」跟我比速度，你敢接招嗎？\n🔗 ${url}`;
        this.sendToLine(text);
    },

    sendToLine(text) {
        const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
        if (confirm("準備好分享戰報到 LINE 了嗎？")) {
            window.location.href = lineUrl;
        }
    },

    showResult(game, mode, time, score) {
        // 完成遊戲後觸發模式 3
        this.shareChallenge(game, mode, time, score);
    }
};
