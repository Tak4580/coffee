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
https://liff.line.me/2010316929-viV90cPK
```

LINE内でGitHub Pages URLが直接開かれた場合も、LIFF URLへ自動的に切り替えます。

ユーザー画面は常にスマートフォン向けの全画面表示です。LIFF IDが未設定でも
購入フローのテストができます。

## LINE連携設定

1. LINE Developers ConsoleでLINEログインチャネルを作成します。
2. LIFFアプリを追加し、エンドポイントURLに
   `https://tak4580.github.io/coffee/` を設定します。
3. LIFFアプリのサイズは `Full`、Scopeは `profile` と `openid` を有効にします。
4. 注文内容をトークへ送る場合は `chat_message.write` も有効にします。
5. `config.js` の `liffId` に発行されたLIFF IDを設定します。
6. LINE公式アカウントのリッチメニューURIに
   `https://liff.line.me/{LIFF_ID}` を設定します。

```js
window.APP_CONFIG = {
  liffId: '1234567890-AbcdEfgh',
  apiBaseUrl: '',
  lineOfficialAccountUrl: ''
};
```

LIFF IDは公開識別子です。チャネルシークレットやMessaging APIのアクセストークンは
このファイルへ入れず、サーバー側の環境変数で管理してください。

## 実装済み

- LIFF SDK初期化
- LINE内と外部ブラウザの判定
- LINEログイン、ログアウト
- LINEプロフィール取得と配送名への反映
- LINE内では購入画面だけを全画面表示
- 注文完了内容のトーク送信、またはシェアターゲットピッカー共有

## 未接続

- Squareの実決済
- 注文データベース
- Messaging APIによる発送通知

これらは秘密鍵を扱うバックエンドが必要です。現在のSquare画面は動作確認用の模擬決済です。
