function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const order = data.order;
    const properties = PropertiesService.getScriptProperties();
    const channelId = properties.getProperty('LINE_LOGIN_CHANNEL_ID');
    const accessToken = properties.getProperty('LINE_CHANNEL_ACCESS_TOKEN');
    const adminUserId = properties.getProperty('LINE_ADMIN_USER_ID');

    if (!data.idToken || !order || !order.number || !order.product || !channelId || !accessToken) {
      return jsonOutput({ ok: false, error: 'Invalid request or settings' });
    }

    const profile = verifyLineIdToken(data.idToken, channelId);
    pushLineMessage(profile.sub, createOrderMessage(order, false), accessToken);

    if (adminUserId) {
      pushLineMessage(adminUserId, createOrderMessage(order, true), accessToken);
    }

    return jsonOutput({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonOutput({ ok: false, error: String(error) });
  }
}

function verifyLineIdToken(idToken, channelId) {
  const response = UrlFetchApp.fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'post',
    payload: { id_token: idToken, client_id: channelId },
    muteHttpExceptions: true
  });
  if (response.getResponseCode() !== 200) throw new Error('LINE ID token verification failed');
  return JSON.parse(response.getContentText());
}

function pushLineMessage(to, text, accessToken) {
  const response = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + accessToken },
    payload: JSON.stringify({ to: to, messages: [{ type: 'text', text: text }] }),
    muteHttpExceptions: true
  });
  if (response.getResponseCode() !== 200) throw new Error('LINE push failed: ' + response.getContentText());
}

function createOrderMessage(order, admin) {
  const lines = [
    admin ? '【新規注文】たかひろ珈琲' : 'たかひろ珈琲 ご注文ありがとうございます',
    '注文番号: ' + order.number,
    '受取方法: ' + order.delivery,
    '決済方法: ' + order.payment,
    '商品: ' + order.product,
    '合計: ¥' + Number(order.amount).toLocaleString('ja-JP')
  ];
  if (admin) {
    lines.push('お名前: ' + (order.name || '-'));
    if (order.postal) lines.push('配送先: 〒' + order.postal + ' ' + (order.address || ''));
  }
  lines.push('こちらはテスト注文です。');
  return lines.join('\n');
}

function jsonOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
