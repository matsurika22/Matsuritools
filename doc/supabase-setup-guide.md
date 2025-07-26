# Supabaseセットアップガイド

## 📋 データベーステーブルの作成手順

### 1. Supabaseダッシュボードにアクセス
1. [Supabase](https://app.supabase.com) にログイン
2. プロジェクト「matsuritools」を選択

### 2. SQLエディタでテーブル作成
1. 左メニューの「SQL Editor」をクリック
2. 「New query」をクリック
3. `/supabase/migrations/001_initial_schema.sql` の内容をコピー
4. SQLエディタに貼り付け
5. 「Run」ボタンをクリックして実行

### 3. 認証プロバイダーの設定

#### Email/Password認証（デフォルトで有効）
確認のみ：
1. 左メニューの「Authentication」→「Providers」
2. 「Email」が有効になっていることを確認

#### Google OAuth設定
1. 「Authentication」→「Providers」→「Google」
2. 「Enable Google」をONに
3. 必要な情報：
   - **Client ID**: Google Cloud ConsoleのOAuth 2.0クライアントID
   - **Client Secret**: Google Cloud ConsoleのOAuth 2.0クライアントシークレット
4. **Authorized redirect URI**をコピー（Google Cloud Consoleに登録が必要）

#### Apple Sign-In設定
1. 「Authentication」→「Providers」→「Apple」
2. 「Enable Apple」をONに
3. 必要な情報：
   - **Service ID**: Apple Developer PortalのService ID
   - **Team ID**: Apple Developer PortalのTeam ID
   - **Key ID**: Apple Developer PortalのKey ID
   - **Private Key**: Apple Developer Portalで生成した秘密鍵

#### Twitter(X) OAuth設定
1. 「Authentication」→「Providers」→「Twitter」
2. 「Enable Twitter」をONに
3. 必要な情報：
   - **API Key**: Twitter Developer PortalのAPI Key
   - **API Secret**: Twitter Developer PortalのAPI Secret
4. **Callback URL**をコピー（Twitter Developer Portalに登録が必要）

### 4. 初期データの投入（テスト用）

以下のSQLを実行して、テスト用の弾データを作成：

```sql
-- テスト用の弾データ
INSERT INTO public.packs (id, name, release_date, box_price, packs_per_box, cards_per_pack)
VALUES ('24RP1', 'レジェンドスーパーデッキ 蒼龍革命', '2024-03-01', 5500, 1, 40);

-- テスト用のレアリティ
INSERT INTO public.rarities (pack_id, name, cards_per_box, total_cards, color, display_order)
VALUES 
    ('24RP1', 'SR（スーパーレア）', 2, 4, '#FFD700', 1),
    ('24RP1', 'VR（ベリーレア）', 4, 4, '#C0C0C0', 2),
    ('24RP1', 'R（レア）', 8, 8, '#CD853F', 3),
    ('24RP1', 'UC（アンコモン）', 12, 12, '#4169E1', 4),
    ('24RP1', 'C（コモン）', 14, 12, '#808080', 5);

-- Admin権限を自分のユーザーに付与（メールアドレスを自分のものに変更）
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### 5. ストレージバケットの作成

1. 左メニューの「Storage」をクリック
2. 「New bucket」をクリック
3. バケット名：`cards`
4. Public bucketにチェック
5. 「Create bucket」をクリック

### 6. 動作確認

1. 「Table Editor」で各テーブルが作成されていることを確認
2. 「Authentication」→「Users」で認証設定を確認

## ⚠️ 注意事項

- **OAuthプロバイダーの設定**は各プロバイダーのデベロッパーポータルでの事前設定が必要
- **本番環境**では必ずRLSポリシーを適切に設定すること
- **環境変数**は.env.localに保存し、絶対にGitにコミットしないこと

## 🔧 トラブルシューティング

### SQL実行エラーが出る場合
- エラーメッセージを確認し、既存のテーブルがある場合は削除してから再実行
- 拡張機能（uuid-ossp）のインストールエラーの場合は、Supabaseでは通常自動で有効

### 認証が動作しない場合
- Supabaseダッシュボードの「Settings」→「API」でURLとキーを再確認
- .env.localファイルの環境変数が正しいか確認

---

更新日：2025-07-24