window.APP_CONFIG = {
  // LINE Developers Consoleで発行されたLIFF IDを設定します。
  liffId: '2010384179-FDCKBM32',
  // 注文通知用バックエンドのURL。設定すると公式アカウントから確認通知を送ります。
  apiBaseUrl: 'https://script.google.com/macros/s/AKfycbxo73nW-2xtQUq1MKX7CNYMUmMrjj-E7WGMKiF75_ustZxW0shoWtRSKkYnEQKkeOG53Q/exec',
  lineOfficialAccountUrl: ''
};

// Google Apps ScriptはCORS応答を返さないため、ページ読込後にGAS用送信処理へ切り替えます。
window.addEventListener('load', () => {
  const api = window.APP_CONFIG.apiBaseUrl.replace(/\/$/, '');
  if (!api.startsWith('https://script.google.com/macros/s/') || !api.endsWith('/exec')) return;

  window.sendOrderAutomatically = async function () {
    const status = document.getElementById('lineStatus');
    if (!window.liff || !liff.isLoggedIn()) {
      status.textContent = 'LINEログインを確認できないため、注文通知は行われませんでした。';
      return;
    }

    try {
      await fetch(api, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({ idToken: liff.getIDToken(), order: lastOrder })
      });
      status.textContent = 'LINE公式アカウントへ注文通知を送信しました。';
    } catch (error) {
      console.error(error);
      status.textContent = 'LINEへの注文通知に失敗しました。';
    }
  };
});
