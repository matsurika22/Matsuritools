-- 現在のRLSポリシーを確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users';

-- auth.users にテストユーザーが存在するか確認
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- public.users の内容を確認
SELECT * FROM public.users LIMIT 5;

-- 手動でテストインサート（UUIDは実際のauth.usersのIDに置き換えてください）
-- INSERT INTO public.users (id, email, role) 
-- VALUES ('実際のUUID', 'test@example.com', 'user');