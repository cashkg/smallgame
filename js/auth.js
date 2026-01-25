/**
 * LINE 登入模組 (js/auth.js)
 * 已整合玩家身分識別與資料傳遞
 */

const Auth = {
    // 這裡已經幫你填好剛才拿到的 LIFF ID
    liffId: '2008964176-En6IBG1i', 

    async init() {
        try {
            await liff.init({ liffId: this.liffId });
            
            if (!liff.isLoggedIn()) {
                console.log("尚未登入，導向 LINE 登入畫面...");
                liff.login();
            } else {
                const profile = await liff.getProfile();
                
                // 更新大廳的使用者資訊
                const nameEl = document.getElementById('user-name');
                const avatarEl = document.getElementById('user-avatar');
                
                if (nameEl) nameEl.innerText = profile.displayName;
                if (avatarEl) {
                    avatarEl.src = profile.pictureUrl;
                    avatarEl.style.display = 'block';
                }
                
                // 將資料存入全域變數，供 GameApp 上傳成績使用
                window.userData = profile; 
                console.log("LINE 登入成功！歡迎：" + profile.displayName);
                
                // 登入成功後，通知主程式去抓取大廳統計數據
                if (typeof GameApp !== 'undefined') {
                    GameApp.fetchLobbyStats();
                }
            }
        } catch (err) {
            console.error('LINE 登入失敗', err);
            const nameEl = document.getElementById('user-name');
            if (nameEl) nameEl.innerText = "訪客模式 (無法存檔)";
        }
    }
};

// 啟動登入程序
Auth.init();
