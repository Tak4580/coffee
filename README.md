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

LINE公式アカウントのリッチメニューやメッセージには、GitHub Pages URLではなく
次のLIFF URLを設定してください。

```text
https://liff.line.me/2010384179-FDCKBM32
```

LINE内でGitHub Pages URLが直接開かれた場合も、LIFF URLへ自動的に切り替えます。

## LINE連携設定

1. LINE Developers ConsoleでLINEログインチャネルを作成します。
2. LIFFアプリのエンドポイントURLに `https://tak4580.github.io/coffee/` を設定します。
3. LIFFアプリのサイズは `Full`、Scopeは `profile` と `openid` を有効にします。
4. トークへの代替送信を使う場合は `chat_message.write` も有効にします。
5. `config.js` の `liffId` にLIFF IDを設定します。
6. リッチメニューには `https://liff.line.me/2010384179-FDCKBM32` を設定します。

## リッチメニュー

推奨構成と設定URLは `RICH_MENU.md` にまとめています。

- 大枠: 珈琲豆を注文
- 左下: 注文を確認
- 中下: 受取・配送案内
- 右下: 問い合わせ

## Google Apps Scriptによる注文通知

`backend/Code.gs` は、注文確定後にMessaging APIで次の通知を送るGoogle Apps Scriptです。

- 購入者: LINE公式アカウントから注文確認
- 店舗: 管理者のLINEへ新規注文通知

LINEログインチャネルとMessaging APIチャネルは、同じLINE Developersのプロバイダー内に作成してください。

1. `backend/Code.gs` の内容をGoogle Apps Scriptの `コード.gs` へ貼り付けます。
2. スクリプトプロパティへ次の値を登録します。
   - `LINE_LOGIN_CHANNEL_ID`: `2010384179`
   - `LINE_CHANNEL_ACCESS_TOKEN`: Messaging APIのチャネルアクセストークン
   - `LINE_ADMIN_USER_ID`: 管理者通知を受けるユーザーID（任意）
3. 実行ユーザーを「自分」、アクセスできるユーザーを「全員」としてウェブアプリをデプロイします。
4. 発行された `/exec` URLを `config.js` の `apiBaseUrl` に設定します。

```js
window.APP_CONFIG = {
  liffId: '2010384179-FDCKBM32',
  apiBaseUrl: 'https://script.google.com/macros/s/デプロイID/exec',
  lineOfficialAccountUrl: ''
};
```

アクセストークンと管理者ユーザーIDは `config.js` やGitHubへ入れず、GASのスクリプトプロパティだけに保存してください。

## 未接続

- Squareの実決済
- 注文データベース
- Messaging APIによる発送完了通知

現在のSquare画面は動作確認用の模擬決済です。
