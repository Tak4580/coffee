window.APP_CONFIG = {
  // LINE Developers Consoleで発行されたLIFF IDを設定します。
  liffId: '2010384179-FDCKBM32',
  // 注文通知用バックエンドのURL。設定すると公式アカウントから確認通知を送ります。
  apiBaseUrl: 'https://script.google.com/macros/s/AKfycbyFvW1uGJ1yandVzixQGmBAVpSEBXVCuhTnvl6wASj_iR-QUXusfmSgSa_Ja4dRC_HZGg/exec',
  lineOfficialAccountUrl: ''
};

// Google Apps ScriptはCORS応答を返さないため、ページ本体の読込後にGAS用送信処理へ切り替えます。
function installGasOrderSender() {
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
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({ idToken: liff.getIDToken(), order: lastOrder })
      });
      status.textContent = '注文データをGoogleスプレッドシートへ送信しました。LINE通知も処理しています。';
    } catch (error) {
      console.error(error);
      status.textContent = 'LINEへの注文通知に失敗しました。';
    }
  };
}
setTimeout(installGasOrderSender, 0);
window.addEventListener('load', installGasOrderSender);

async function ensureLineProfileStatus() {
  if (!window.liff) return;
  try {
    await liff.ready;
    if (!liff.isLoggedIn()) return;
    const profileElement = document.getElementById('profile');
    let displayName = liff.getDecodedIDToken()?.name || '';
    try {
      const profile = await liff.getProfile();
      displayName = profile.displayName || displayName;
    } catch (profileError) {
      console.warn('LINE profile unavailable', profileError);
    }
    profileElement.textContent = displayName ? displayName + 'さんでログイン中です。' : 'LINEでログイン中です。';
    profileElement.classList.add('show');
    if (displayName) document.getElementById('name').value = displayName;
  } catch (error) {
    console.warn('LIFF login status unavailable', error);
  }
}
window.addEventListener('load', ensureLineProfileStatus);

function loadRemoteProducts() {
  if (!document.getElementById('home') || !document.getElementById('products') || typeof renderProducts !== 'function') return;
  const api = window.APP_CONFIG.apiBaseUrl.replace(/\/$/, '');
  const callback = 'receiveCoffeeProducts';
  const script = document.createElement('script');
  window[callback] = function (data) {
    if (data?.ok && Array.isArray(data.products) && data.products.length) {
      products = data.products;
      renderProducts();
    }
    delete window[callback];
    script.remove();
  };
  script.onerror = function () {
    delete window[callback];
    script.remove();
    console.warn('商品データを取得できないため、初期商品を表示します。');
  };
  script.src = api + '?action=products&callback=' + callback + '&t=' + Date.now();
  document.head.appendChild(script);
}
window.addEventListener('load', loadRemoteProducts);

function updateOperationNotice() {
  const notice = document.querySelector('#home .notice');
  if (!notice) return;
  notice.textContent = 'テスト運用中です。Square決済は模擬ですが、注文内容はGoogleスプレッドシートへ送信されます。';
}
window.addEventListener('load', updateOperationNotice);
