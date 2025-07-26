-- RLSポリシーを一時的に無効化してテーブルを再構築
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 既存のポリシーをすべて削除
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;
DROP POLICY IF EXISTS "System can insert users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- RLSを再度有効化
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 新しいポリシーを作成

-- 1. ユーザーは自分のデータを読める
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

-- 2. ユーザーは自分のプロフィールを作成できる（サインアップ時）
CREATE POLICY "Users can insert own profile on signup" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 3. ユーザーは自分のプロフィールを更新できる
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- 4. サービスロールはすべて操作可能
CREATE POLICY "Service role has full access" 
ON public.users FOR ALL 
USING (auth.jwt()->>'role' = 'service_role');

-- 5. 認証されたユーザーはメールアドレスで他のユーザーを検索できる（重複チェック用）
CREATE POLICY "Authenticated users can check email existence" 
ON public.users FOR SELECT 
USING (auth.role() = 'authenticated');

-- トリガー関数も更新（SECURITY DEFINERで実行）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
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
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql;

-- トリガーが存在しない場合は作成
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;