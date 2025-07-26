-- 既存の全ユーザーのメール認証を完了状態にする（開発環境用）

-- auth.usersテーブルの全ユーザーのメール認証を完了にする
UPDATE auth.users
SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmed_at = COALESCE(confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- 確認：認証されていないユーザー数
SELECT COUNT(*) as unconfirmed_count
FROM auth.users
WHERE email_confirmed_at IS NULL;

-- 確認：最近作成されたユーザーの状態
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;