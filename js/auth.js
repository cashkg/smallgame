/**
 * 身份驗證模組 (js/auth.js)
 */
const Auth = {
    liffId: '2008964176-En6IBG1i', 

    async init() {
        try {
            await liff.init({ liffId: this.liffId });
            this.updateUserUI(liff.isLoggedIn());
        } catch (err) {
            console.error('LIFF 初始化失敗', err);
        }
    },

    async updateUserUI(isLoggedIn) {
        const nameEl = document.getElementById('user-name');
        const avatarEl = document.getElementById('user-avatar');
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');

        if (isLoggedIn) {
            const profile = await liff.getProfile();
            window.userData = profile;
            nameEl.innerText = profile.displayName;
            avatarEl.src = profile.pictureUrl;
            
            // 強制切換顯示狀態
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
        } else {
            window.userData = null;
            nameEl.innerText = "訪客玩家";
            avatarEl.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
            
            loginBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
        }
    },

    manualLogin() {
        if (!liff.isLoggedIn()) liff.login();
    },

    manualLogout() {
        if (liff.isLoggedIn()) {
            if (confirm("確定要登出並切換回訪客身分嗎？")) {
                liff.logout();
                window.location.href = window.location.origin + window.location.pathname; // 徹底刷新
            }
        }
    }
};

Auth.init();
