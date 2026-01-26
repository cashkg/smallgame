/**
 * 身份驗證模組 (js/auth.js)
 * 修正版：鎖定回傳網址，防止登入後跳轉至其他瀏覽器
 */
const Auth = {
    liffId: '2008964176-En6IBG1i', 

    async init() {
        try {
            await liff.init({ liffId: this.liffId });
            this.checkStatus();
        } catch (err) {
            console.error('LIFF Init Error', err);
        }
    },

    async checkStatus() {
        const nameEl = document.getElementById('user-name');
        const avatarEl = document.getElementById('user-avatar');
        const loginBtn = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');

        if (liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            window.userData = profile;
            nameEl.innerText = profile.displayName;
            avatarEl.src = profile.pictureUrl;
            
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'block';
        } else {
            window.userData = null;
            nameEl.innerText = "訪客玩家";
            avatarEl.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
            
            loginBtn.style.display = 'block';
            logoutBtn.style.display = 'none';
        }
    },

    manualLogin() {
        // 核心修正：
        // 1. redirectUri: 告訴 LINE 授權完一定要回到「現在這個網址」。
        // 2. 透過 window.location.href 鎖定，減少系統偵測到「自定義 URL Scheme」而亂跳 App 的機率。
        const currentUrl = window.location.origin + window.location.pathname;
        liff.login({ redirectUri: currentUrl });
    },

    manualLogout() {
        if (confirm("確定要登出並切換回訪客身分嗎？")) {
            liff.logout();
            // 登出後清空所有參數，確保頁面在原瀏覽器重整
            window.location.replace(window.location.origin + window.location.pathname);
        }
    }
};

Auth.init();
