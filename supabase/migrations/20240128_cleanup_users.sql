-- admin (mk0207yu1111@gmail.com) 以外のユーザーを削除

-- 1. まず削除対象を確認
SELECT id, email, created_at 
FROM auth.users 
WHERE email != 'mk0207yu1111@gmail.com'
ORDER BY created_at DESC;

-- 2. public.usersから削除（外部キー制約があるため先に実行）
DELETE FROM public.users
WHERE email != 'mk0207yu1111@gmail.com';

-- 3. その他のテーブルからも削除（もし関連データがあれば）
-- access_code_usages
DELETE FROM public.access_code_usages
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email != 'mk0207yu1111@gmail.com'
);

-- 4. auth.usersから削除
DELETE FROM auth.users
WHERE email != 'mk0207yu1111@gmail.com';

-- 5. 削除後の確認
SELECT COUNT(*) as remaining_users FROM auth.users;
SELECT id, email, role, email_confirmed_at FROM auth.users;