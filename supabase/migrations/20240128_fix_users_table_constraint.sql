-- まず外部キー制約を削除
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_id_fkey;

-- RLSポリシーも一時的に無効化
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- トリガー関数を更新（エラーハンドリング追加）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
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
  WHEN foreign_key_violation THEN
    -- 外部キー違反の場合はログを出力して続行
    RAISE NOTICE 'Foreign key violation for user %: %', new.id, SQLERRM;
    RETURN new;
  WHEN OTHERS THEN
    -- その他のエラーもログを出力して続行
    RAISE NOTICE 'Error creating user record for %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLSを再度有効化
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;
DROP POLICY IF EXISTS "System can insert users" ON public.users;

-- ポリシーの再作成
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Service role can manage all users" ON public.users
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- システム用のINSERTポリシー（トリガー用）
CREATE POLICY "System can insert users" ON public.users
  FOR INSERT WITH CHECK (true);