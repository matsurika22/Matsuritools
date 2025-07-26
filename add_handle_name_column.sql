-- usersテーブルにhandle_nameカラムを追加
ALTER TABLE users ADD COLUMN IF NOT EXISTS handle_name VARCHAR(50);

-- handle_nameにNOT NULL制約を追加（既存データがある場合はデフォルト値を設定）
UPDATE users SET handle_name = 'User' || SUBSTRING(id::text, 1, 8) WHERE handle_name IS NULL;
ALTER TABLE users ALTER COLUMN handle_name SET NOT NULL;

-- ハンドルネームのユニーク制約を追加（オプション）
-- ALTER TABLE users ADD CONSTRAINT unique_handle_name UNIQUE (handle_name);

-- 確認クエリ
SELECT id, email, handle_name, role, created_at FROM users;