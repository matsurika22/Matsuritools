-- 管理者権限を付与するSQL
-- SupabaseのSQL Editorで実行してください

-- まずroleカラムを追加（既に存在する場合はエラーが出ますが問題ありません）
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'friend'));

-- 自分のメールアドレスを管理者に設定
UPDATE users SET role = 'admin' WHERE email = 'mk0207yu1111@gmail.com';

-- 確認用：現在のユーザーロールを表示
SELECT email, role, created_at FROM users ORDER BY created_at DESC;