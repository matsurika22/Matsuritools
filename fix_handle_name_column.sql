-- 既存のhandle_nameカラムを削除（エラーが出ても無視）
ALTER TABLE users DROP COLUMN IF EXISTS handle_name;

-- handle_nameカラムを正しいサイズで再作成
ALTER TABLE users ADD COLUMN handle_name VARCHAR(50);

-- 既存ユーザーにデフォルト値を設定
UPDATE users SET handle_name = 'User' || SUBSTRING(id::text, 1, 8) WHERE handle_name IS NULL;

-- NOT NULL制約を追加
ALTER TABLE users ALTER COLUMN handle_name SET NOT NULL;

-- 確認クエリ
SELECT id, email, handle_name, role, created_at FROM users;