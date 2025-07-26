-- シンプルなRLSポリシーに変更

-- 既存のポリシーをすべて削除
DO $$
DECLARE
    policy_name text;
BEGIN
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

-- トリガー関数を最もシンプルに（RLSをバイパス）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER -- SUPERUSERの権限で実行
SET search_path = public
AS $$
BEGIN
  -- RLSを無視してusersテーブルに挿入
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
END;
$$ LANGUAGE plpgsql;

-- 既存のトリガーを削除して再作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- RLSを再度有効化
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 最小限のポリシー

-- 1. 全ての認証済みユーザーは読み取り可能
CREATE POLICY "Anyone can view profiles" 
ON public.users FOR SELECT 
USING (true);

-- 2. サービスロールは全て可能
CREATE POLICY "Service role bypass" 
ON public.users FOR ALL 
USING (auth.jwt()->>'role' = 'service_role');

-- 3. ユーザーは自分のプロフィールを更新可能
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);