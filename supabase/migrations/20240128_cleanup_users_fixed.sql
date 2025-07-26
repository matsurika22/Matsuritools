-- admin (mk0207yu1111@gmail.com) 以外のユーザーを削除

-- 1. まず削除対象を確認
SELECT id, email, created_at 
FROM auth.users 
WHERE email != 'mk0207yu1111@gmail.com'
ORDER BY created_at DESC;

-- 2. public.usersから削除（外部キー制約があるため先に実行）
DELETE FROM public.users
WHERE email != 'mk0207yu1111@gmail.com';

-- 3. access_code_usagesテーブルが存在する場合のみ削除
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'access_code_usages'
    ) THEN
        DELETE FROM public.access_code_usages
        WHERE user_id IN (
            SELECT id FROM auth.users WHERE email != 'mk0207yu1111@gmail.com'
        );
    END IF;
END $$;

-- 4. user_access_codesテーブルが存在する場合のみ削除
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_access_codes'
    ) THEN
        DELETE FROM public.user_access_codes
        WHERE user_id IN (
            SELECT id FROM auth.users WHERE email != 'mk0207yu1111@gmail.com'
        );
    END IF;
END $$;

-- 5. auth.usersから削除
DELETE FROM auth.users
WHERE email != 'mk0207yu1111@gmail.com';

-- 6. 削除後の確認
SELECT COUNT(*) as remaining_users FROM auth.users;
SELECT id, email, role, email_confirmed_at FROM auth.users;

-- 7. public.usersの状態も確認
SELECT id, email, handle_name, role FROM public.users;