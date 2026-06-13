# たかひろ珈琲 LIFFアプリ

LINEのLIFFブラウザで商品選択から注文確認まで動かすWebアプリです。

## ローカル起動

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

ユーザー画面:

- ローカル: `http://127.0.0.1:8765/`
- 公開URL: `https://tak4580.github.io/coffee/`

管理画面:

- ローカル: `http://127.0.0.1:8765/admin.html`
- 公開URL: `https://tak4580.github.io/coffee/admin.html`

LINE公式アカウントのリッチメニューには次のLIFF URLを設定してください。

```text
https://liff.line.me/2010384179-FDCKBM32
```

## LINE連携設定

1. LIFFアプリのエンドポイントURLに `https://tak4580.github.io/coffee/` を設定します。
2. LIFFアプリのサイズは `Full`、Scopeは `profile` と `openid` を有効にします。
3. `config.js` の `liffId` にLIFF IDを設定します。

## リッチメニュー

推奨構成と設定URLは `RICH_MENU.md` にまとめています。

- 大枠: 珈琲豆を注文
- 左下: 注文を確認
- 中下: 受取・配送案内
- 右下: 問い合わせ

## Googleスプレッドシートへの注文保存とLINE通知

`backend/Code.gs` は、注文確定後に次の処理を行うGoogle Apps Scriptです。

- Googleスプレッドシートへ注文を1行ずつ保存
- 購入者へLINE公式アカウントから注文確認
- 管理者のLINEへ新規注文通知

LINEログインチャネルとMessaging APIチャネルは、同じLINE Developersのプロバイダー内に作成してください。

1. `backend/Code.gs` の内容をGoogle Apps Scriptの `コード.gs` へ貼り付けます。
2. スクリプトプロパティへ次の値を設定します。
   - `LINE_LOGIN_CHANNEL_ID`: `2010384179`
   - `LINE_CHANNEL_ACCESS_TOKEN`: Messaging APIのチャネルアクセストークン
   - `LINE_ADMIN_USER_ID`: 管理者通知を受けるユーザーID（任意）
3. GASエディタ上部の関数選択で `setupSpreadsheet` を選び、一度「実行」します。
4. Googleの権限確認を許可します。
5. 実行ログに表示された「注文管理シート」のURLを開きます。
6. ウェブアプリを「新しいバージョン」で再デプロイします。
7. 発行された `/exec` URLを `config.js` の `apiBaseUrl` に設定します。

```js
window.APP_CONFIG = {
  liffId: '2010384179-FDCKBM32',
  apiBaseUrl: 'https://script.google.com/macros/s/デプロイID/exec',
  lineOfficialAccountUrl: ''
};
```

初回実行時にGoogleドライブへ「たかひろ珈琲 注文管理」が作成されます。注文番号、お名前、商品、金額、受取・決済方法、配送先、LINE通知結果を保存し、同じ注文番号の重複登録を防止します。

スプレッドシートには「注文」と「設定」の2シートが作成されます。「設定」シートではLIFF ID、チャネルID、各秘密情報が設定済みかを確認できます。アクセストークンと管理者ユーザーIDの実際の値は表示しません。

スクリプトプロパティには `SPREADSHEET_ID` が自動登録されます。既存の保存先を使う場合は、そのスプレッドシートIDを `SPREADSHEET_ID` に設定することもできます。

LIFFアプリには `openid` Scopeが必要です。GASはIDトークンをLINE側で検証してから保存・通知します。秘密情報はスプレッドシートや `config.js` へ入れず、GASのスクリプトプロパティだけに保存してください。

## 未接続

- Squareの実決済
- Messaging APIによる発送完了通知

現在のSquare画面は動作確認用の模擬決済です。
