const ORDER_SHEET_NAME = '注文';
const SETTINGS_SHEET_NAME = '設定';
const LIFF_ID = '2010384179-FDCKBM32';
const ORDER_HEADERS = [
  '受付日時', '注文番号', '状態', 'お名前', '商品', '合計金額',
  '受取方法', '決済方法', '郵便番号', '住所', 'LINEユーザーID', 'LINE通知'
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const order = data.order;
    const properties = PropertiesService.getScriptProperties();
    const channelId = properties.getProperty('LINE_LOGIN_CHANNEL_ID');
    const accessToken = properties.getProperty('LINE_CHANNEL_ACCESS_TOKEN');
    const adminUserId = properties.getProperty('LINE_ADMIN_USER_ID');

    if (!data.idToken || !order || !order.number || !order.product || !channelId) {
      return jsonOutput({ ok: false, error: 'Invalid request or settings' });
    }

    const profile = verifyLineIdToken(data.idToken, channelId);
    const saved = saveOrder(order, profile.sub);
    if (saved.duplicate) return jsonOutput({ ok: true, duplicate: true });

    const notifications = [];
    if (accessToken) {
      try {
        pushLineMessage(profile.sub, createOrderMessage(order, false), accessToken);
        notifications.push('購入者へ送信済み');
      } catch (error) {
        console.error(error);
        notifications.push('購入者通知失敗');
      }

      if (adminUserId) {
        try {
          pushLineMessage(adminUserId, createOrderMessage(order, true), accessToken);
          notifications.push('管理者へ送信済み');
        } catch (error) {
          console.error(error);
          notifications.push('管理者通知失敗');
        }
      }
    } else {
      notifications.push('アクセストークン未設定');
    }

    saved.sheet.getRange(saved.row, 12).setValue(notifications.join(' / '));
    return jsonOutput({
      ok: true,
      spreadsheetUrl: saved.spreadsheet.getUrl(),
      notifications: notifications
    });
  } catch (error) {
    console.error(error);
    return jsonOutput({ ok: false, error: String(error) });
  }
}

// GASエディタから一度実行すると、保存先シートを作成してURLをログへ表示します。
function setupSpreadsheet() {
  const spreadsheet = getOrderSpreadsheet();
  getOrderSheet(spreadsheet);
  updateSettingsSheet(spreadsheet);
  console.log('注文管理シート: ' + spreadsheet.getUrl());
  return spreadsheet.getUrl();
}

function saveOrder(order, lineUserId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const spreadsheet = getOrderSpreadsheet();
    const sheet = getOrderSheet(spreadsheet);
    const lastRow = sheet.getLastRow();

    if (lastRow > 1) {
      const found = sheet.getRange(2, 2, lastRow - 1, 1)
        .createTextFinder(String(order.number))
        .matchEntireCell(true)
        .findNext();
      if (found) {
        return { duplicate: true, spreadsheet: spreadsheet, sheet: sheet, row: found.getRow() };
      }
    }

    sheet.appendRow([
      new Date(), safeCell(order.number), safeCell(order.status || '受付済み'),
      safeCell(order.name || ''), safeCell(order.product), Number(order.amount) || 0,
      safeCell(order.delivery || ''), safeCell(order.payment || ''),
      safeCell(order.postal || ''), safeCell(order.address || ''),
      safeCell(lineUserId), '通知処理中'
    ]);

    const row = sheet.getLastRow();
    sheet.getRange(row, 1).setNumberFormat('yyyy/mm/dd hh:mm:ss');
    sheet.getRange(row, 6).setNumberFormat('¥#,##0');
    return { duplicate: false, spreadsheet: spreadsheet, sheet: sheet, row: row };
  } finally {
    lock.releaseLock();
  }
}

function getOrderSpreadsheet() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = properties.getProperty('SPREADSHEET_ID');

  if (spreadsheetId) {
    try {
      return SpreadsheetApp.openById(spreadsheetId);
    } catch (error) {
      console.warn('保存済みのスプレッドシートを開けないため再作成します。', error);
    }
  }

  const spreadsheet = SpreadsheetApp.create('たかひろ珈琲 注文管理');
  properties.setProperty('SPREADSHEET_ID', spreadsheet.getId());
  getOrderSheet(spreadsheet);
  updateSettingsSheet(spreadsheet);
  return spreadsheet;
}

function getOrderSheet(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(ORDER_SHEET_NAME);
  if (!sheet) {
    const firstSheet = spreadsheet.getSheets()[0];
    if (spreadsheet.getSheets().length === 1 && firstSheet.getLastRow() === 0) {
      sheet = firstSheet;
      sheet.setName(ORDER_SHEET_NAME);
    } else {
      sheet = spreadsheet.insertSheet(ORDER_SHEET_NAME);
    }
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(ORDER_HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, ORDER_HEADERS.length)
      .setFontWeight('bold').setBackground('#3b1d0f').setFontColor('#ffffff');
    sheet.autoResizeColumns(1, ORDER_HEADERS.length);
  }
  return sheet;
}

function updateSettingsSheet(spreadsheet) {
  const properties = PropertiesService.getScriptProperties();
  let sheet = spreadsheet.getSheetByName(SETTINGS_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SETTINGS_SHEET_NAME);

  const values = [
    ['設定項目', '現在値・状態', '説明'],
    ['LIFF_ID', LIFF_ID, 'サイトで使用するLIFF ID'],
    ['LINE_LOGIN_CHANNEL_ID', properties.getProperty('LINE_LOGIN_CHANNEL_ID') || '未設定', 'LINEログインチャネルID'],
    ['LINE_CHANNEL_ACCESS_TOKEN', properties.getProperty('LINE_CHANNEL_ACCESS_TOKEN') ? '設定済み' : '未設定', '秘密値はスクリプトプロパティで管理'],
    ['LINE_ADMIN_USER_ID', properties.getProperty('LINE_ADMIN_USER_ID') ? '設定済み' : '未設定', '秘密値はスクリプトプロパティで管理'],
    ['SPREADSHEET_ID', spreadsheet.getId(), '注文データの保存先']
  ];

  sheet.clearContents();
  sheet.getRange(1, 1, values.length, values[0].length).setValues(values);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, values[0].length)
    .setFontWeight('bold').setBackground('#3b1d0f').setFontColor('#ffffff');
  sheet.autoResizeColumns(1, values[0].length);
  return sheet;
}

function safeCell(value) {
  const text = String(value == null ? '' : value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
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
    method: 'post', contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + accessToken },
    payload: JSON.stringify({ to: to, messages: [{ type: 'text', text: text }] }),
    muteHttpExceptions: true
  });
  if (response.getResponseCode() !== 200) {
    throw new Error('LINE push failed: ' + response.getContentText());
  }
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
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
