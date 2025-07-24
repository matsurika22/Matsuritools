-- 既存のINSERTポリシーを確認
SELECT policyname, cmd, with_check
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'INSERT';

-- 既存のINSERTポリシーを削除
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;

-- 新しいINSERTポリシーを作成（より明確な条件）
CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT 
    WITH CHECK (
        -- 挿入しようとしているIDが現在のユーザーIDと一致
        auth.uid() = id
    );

-- 念のため、すべてのポリシーを再確認
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd;