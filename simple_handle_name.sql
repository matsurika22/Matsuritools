-- シンプル版: 既存ユーザーには単純なデフォルト値を設定

-- handle_nameカラムを追加（まだ存在しない場合）
ALTER TABLE users ADD COLUMN IF NOT EXISTS handle_name VARCHAR(50);

-- 既存ユーザーにシンプルなデフォルト値を設定
UPDATE users SET handle_name = 'ユーザー' WHERE handle_name IS NULL;

-- NOT NULL制約を追加
ALTER TABLE users ALTER COLUMN handle_name SET NOT NULL;

-- 確認クエリ
SELECT id, email, handle_name, role, created_at FROM users;