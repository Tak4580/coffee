# タカヒロコーヒー LIFFテスト版

LINE上で商品選択からテスト注文まで確認するためのGitHub Pagesアプリです。

## 公開URL

- ユーザー画面: https://tak4580.github.io/coffee/
- 管理画面: https://tak4580.github.io/coffee/admin.html
- LIFF URL: https://liff.line.me/2010316929-viV90cPK

ユーザー画面はスマートフォン向け表示です。管理画面の商品変更とテスト注文は、同じ端末・同じブラウザの `localStorage` で共有されます。

## LINE Developers設定

LIFFエンドポイントURLを次に設定します。

```text
https://tak4580.github.io/coffee/
```

Scopeは `profile`、`openid`、注文内容をLINEへ送る場合は `chat_message.write` を有効にします。

## 注意

現在はテスト版です。Square画面は模擬決済で、実際の請求、注文登録、発送通知は行われません。
