const Auth = {
    liffId: 'YOUR_LIFF_ID', // 之後填入你的 LIFF ID

    async init() {
        try {
            await liff.init({ liffId: this.liffId });
            if (!liff.isLoggedIn()) {
                liff.login();
            } else {
                const profile = await liff.getProfile();
                document.getElementById('user-name').innerText = profile.displayName;
                document.getElementById('user-avatar').src = profile.pictureUrl;
                window.userData = profile; // 儲存玩家資訊供後續上傳成績
            }
        } catch (err) {
            console.error('LINE 登入失敗', err);
            document.getElementById('user-name').innerText = "訪客模式";
        }
    }
};

Auth.init();
