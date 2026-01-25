/**
 * 身份驗證模組 (js/auth.js)
 * 負責 LINE LIFF 初始化與登入狀態管控
 */

const Auth = {
    // 您的 LIFF ID
    liffId: '2008964176-En6IBG1i', 

    async init() {
        console.log("LIFF 初始化中...");
        try {
            await liff.init({ liffId: this.liffId });
            
            // 檢查是否已登入
            if (liff.isLoggedIn()) {
                this.updateUserUI(true);
            } else {
                this.updateUserUI(false);
            }
        } catch (err) {
            console.error('LIFF 初始化失敗', err);
            document.getElementById('user-name').innerText = "系統連線失敗";
        }
    },

    // 介面更新邏輯
    async updateUserUI(isLoggedIn) {
        const nameEl = document.getElementById('user-name');
        const avatarEl = document.getElementById('user-avatar');
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');

        if (isLoggedIn) {
            try {
                const profile = await liff.getProfile();
                window.userData = profile; // 儲存身分資料供後端上傳使用
                
                nameEl.innerText = profile.displayName;
                avatarEl.src = profile.pictureUrl;
                
                // 切換按鈕顯示：隱藏登入，顯示登出
                if (loginBtn) loginBtn.classList.add('hidden');
                if (logoutBtn) logoutBtn.classList.remove('hidden');
                
                console.log("歡迎回來，" + profile.displayName);
            } catch (e) {
                console.error("抓取個人資料失敗", e);
            }
        } else {
            window.userData = null;
            nameEl.innerText = "訪客玩家";
            // 預設訪客頭像 (灰階或空圖)
            avatarEl.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
            
            // 切換按鈕顯示：顯示登入，隱藏登出
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (logoutBtn) logoutBtn.classList.add('hidden');
        }
    },

    // 手動登入
    manualLogin() {
        if (!liff.isLoggedIn()) {
            liff.login();
        }
    },

    // 手動登出
    manualLogout() {
        if (liff.isLoggedIn()) {
            if (confirm("確定要登出 LINE 帳號嗎？")) {
                liff.logout();
                window.location.reload(); // 登出後刷新頁面回到訪客狀態
            }
        }
    }
};

// 執行初始化
Auth.init();
