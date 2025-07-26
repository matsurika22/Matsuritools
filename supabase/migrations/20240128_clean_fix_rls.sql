-- まず既存のポリシーを確認
DO $$
DECLARE
    policy_name text;
BEGIN
    -- usersテーブルの全てのポリシーを削除
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', policy_name);
    END LOOP;
END $$;

-- RLSを一時的に無効化
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- RLSを再度有効化
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 新しいポリシーを作成

-- 1. ユーザーは自分のデータを読める
CREATE POLICY "enable_read_for_users" 
ON public.users FOR SELECT 
USING (
    auth.uid() = id 
    OR auth.role() = 'authenticated'  -- 認証済みユーザーは他のユーザーの存在確認可能
);

-- 2. ユーザーは自分のプロフィールを作成できる
CREATE POLICY "enable_insert_for_users" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 3. ユーザーは自分のプロフィールを更新できる
CREATE POLICY "enable_update_for_users" 
ON public.users FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. サービスロールはすべて操作可能
CREATE POLICY "enable_all_for_service_role" 
ON public.users FOR ALL 
USING (auth.jwt()->>'role' = 'service_role');

-- トリガー関数を更新（SECURITY DEFINERで実行）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- ログ出力
  RAISE NOTICE 'handle_new_user triggered for user %', new.id;
  
  -- usersテーブルに挿入を試みる
  INSERT INTO public.users (id, email, handle_name, role, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'handle_name', split_part(new.email, '@', 1)),
    'user',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    handle_name = COALESCE(EXCLUDED.handle_name, public.users.handle_name),
    updated_at = NOW();
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- エラーをログに記録
    RAISE NOTICE 'Error in handle_new_user for user %: %', new.id, SQLERRM;
    -- エラーが発生してもauth.usersへの挿入は続行
    RETURN new;
END;
$$ LANGUAGE plpgsql;

-- 既存のトリガーを削除して再作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();