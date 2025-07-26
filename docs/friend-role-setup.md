# Friend Role Setup Guide

## 概要
知り合い用のロール（`friend`）を設定することで、アクセスコードなしで全ての弾にアクセスできるようになります。

## セットアップ手順

### 1. Supabaseデータベースの更新

SupabaseのSQL Editorで以下のSQLを実行してください：

```sql
-- usersテーブルにroleカラムを追加
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'friend'));

-- 既存のユーザーのroleをuserに設定
UPDATE users SET role = 'user' WHERE role IS NULL;
```

### 2. 特定ユーザーをfriendロールに設定

知り合いのメールアドレスを使って、以下のSQLを実行：

```sql
-- 例：mk0207yu1111@gmail.comをfriendロールに設定
UPDATE users SET role = 'friend' WHERE email = 'mk0207yu1111@gmail.com';
```

### 3. 動作確認

1. friendロールに設定したユーザーでログイン
2. ダッシュボードから「弾選択」画面へ
3. アクセスコードを登録していなくても、全ての弾が表示されることを確認

## ロールの種類

- **user**: 通常ユーザー（デフォルト）- アクセスコードが必要
- **friend**: 知り合い用 - アクセスコード不要で全弾アクセス可能
- **admin**: 管理者 - 全機能にアクセス可能（今後実装）

## 注意事項

- friendロールの設定は管理者のみが行えます
- 本番環境では慎重に運用してください
- roleカラムがない場合は、上記のSQLで追加してください