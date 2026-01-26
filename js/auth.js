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
        // 核心修正：強制登入後跳回目前的網址，避免系統瀏覽器自作聰明
        liff.login({ redirectUri: window.location.href });
    },

    manualLogout() {
        if (confirm("確定要登出帳號嗎？")) {
            liff.logout();
            // 登出後清空網址參數並重刷
            window.location.href = window.location.origin + window.location.pathname;
        }
    }
};

Auth.init();
