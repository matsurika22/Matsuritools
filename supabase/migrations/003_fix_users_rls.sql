-- RLSが有効か確認
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- RLSを一旦無効化してから有効化
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを全て削除
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;

-- 新しいポリシーを作成（より緩い設定）
-- 認証されたユーザーは自分のプロフィールを挿入できる
CREATE POLICY "Enable insert for authenticated users" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 認証されたユーザーは自分のプロフィールを見られる
CREATE POLICY "Enable select for users based on user_id" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- 認証されたユーザーは自分のプロフィールを更新できる
CREATE POLICY "Enable update for users based on user_id" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- テスト用：一時的にRLSを無効化（開発環境のみ）
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;