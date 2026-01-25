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
            nameEl.innerText = profile.displayName;
            avatarEl.src = profile.pictureUrl;
            
            // 顯示登出，隱藏登入
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'block';
        } else {
            nameEl.innerText = "訪客玩家";
            avatarEl.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
            
            // 顯示登入，隱藏登出
            loginBtn.style.display = 'block';
            logoutBtn.style.display = 'none';
        }
    },

    manualLogin() {
        liff.login();
    },

    manualLogout() {
        if (confirm("確定要登出帳號嗎？")) {
            liff.logout();
            window.location.reload();
        }
    }
};

Auth.init();
