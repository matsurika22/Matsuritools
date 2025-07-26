-- 本番環境用RLS（Row Level Security）ポリシーの有効化
-- ⚠️ 注意: このマイグレーションは本番環境デプロイ前に実行すること

-- ===== USERS テーブルのRLS =====
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のプロフィールのみ閲覧可能
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- ユーザーは自分のプロフィールのみ更新可能
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 管理者は全ユーザーを閲覧可能
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 管理者は全ユーザーを更新可能
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ===== PACKS テーブルのRLS =====
ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが弾情報を閲覧可能
DROP POLICY IF EXISTS "Anyone can view packs" ON public.packs;
CREATE POLICY "Anyone can view packs" ON public.packs
    FOR SELECT USING (true);

-- 管理者のみ弾情報を作成・更新・削除可能
DROP POLICY IF EXISTS "Admins can manage packs" ON public.packs;
CREATE POLICY "Admins can manage packs" ON public.packs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ===== RARITIES テーブルのRLS =====
ALTER TABLE public.rarities ENABLE ROW LEVEL SECURITY;

-- 全ユーザーがレアリティ情報を閲覧可能
DROP POLICY IF EXISTS "Anyone can view rarities" ON public.rarities;
CREATE POLICY "Anyone can view rarities" ON public.rarities
    FOR SELECT USING (true);

-- 管理者のみレアリティ情報を管理可能
DROP POLICY IF EXISTS "Admins can manage rarities" ON public.rarities;
CREATE POLICY "Admins can manage rarities" ON public.rarities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ===== CARDS テーブルのRLS =====
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- 全ユーザーがカード情報を閲覧可能
DROP POLICY IF EXISTS "Anyone can view cards" ON public.cards;
CREATE POLICY "Anyone can view cards" ON public.cards
    FOR SELECT USING (true);

-- 管理者のみカード情報を管理可能
DROP POLICY IF EXISTS "Admins can manage cards" ON public.cards;
CREATE POLICY "Admins can manage cards" ON public.cards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ===== ACCESS_CODES テーブルのRLS =====
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分が作成したアクセスコードを閲覧可能
DROP POLICY IF EXISTS "Users can view own access codes" ON public.access_codes;
CREATE POLICY "Users can view own access codes" ON public.access_codes
    FOR SELECT USING (created_by = auth.uid());

-- 管理者は全アクセスコードを管理可能
DROP POLICY IF EXISTS "Admins can manage access codes" ON public.access_codes;
CREATE POLICY "Admins can manage access codes" ON public.access_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- アクセスコード検証用（アプリケーションで使用）
DROP POLICY IF EXISTS "Anyone can verify access codes" ON public.access_codes;
CREATE POLICY "Anyone can verify access codes" ON public.access_codes
    FOR SELECT USING (
        -- 有効期限内で使用可能回数以内のコードのみ
        (valid_until IS NULL OR valid_until > NOW()) AND
        (max_uses IS NULL OR current_uses < max_uses)
    );

-- ===== USER_CODES テーブルのRLS =====
ALTER TABLE public.user_codes ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のアクセスコード履歴のみ閲覧可能
DROP POLICY IF EXISTS "Users can view own user codes" ON public.user_codes;
CREATE POLICY "Users can view own user codes" ON public.user_codes
    FOR SELECT USING (user_id = auth.uid());

-- ユーザーは自分のアクセスコードのみ作成可能
DROP POLICY IF EXISTS "Users can create own user codes" ON public.user_codes;
CREATE POLICY "Users can create own user codes" ON public.user_codes
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 管理者は全ユーザーコードを管理可能
DROP POLICY IF EXISTS "Admins can manage user codes" ON public.user_codes;
CREATE POLICY "Admins can manage user codes" ON public.user_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ===== セキュリティ強化 =====

-- アクセスコード使用回数の更新（アプリケーション用）
DROP POLICY IF EXISTS "Update access code usage" ON public.access_codes;
CREATE POLICY "Update access code usage" ON public.access_codes
    FOR UPDATE USING (
        -- 認証済みユーザーがcurrent_usesのみ更新可能
        auth.uid() IS NOT NULL
    ) WITH CHECK (
        -- current_usesの増加のみ許可
        current_uses >= OLD.current_uses
    );

-- ===== 関数の作成 =====

-- 管理者権限チェック関数
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- フレンド権限チェック関数
CREATE OR REPLACE FUNCTION public.is_friend_or_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = user_id AND role IN ('friend', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- アクセスコード検証関数
CREATE OR REPLACE FUNCTION public.verify_access_code(code_value TEXT, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    code_record public.access_codes%ROWTYPE;
BEGIN
    -- コードの存在確認
    SELECT * INTO code_record 
    FROM public.access_codes 
    WHERE code = code_value;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- 有効期限チェック
    IF code_record.valid_until IS NOT NULL AND code_record.valid_until < NOW() THEN
        RETURN FALSE;
    END IF;
    
    -- 使用回数チェック
    IF code_record.max_uses IS NOT NULL AND code_record.current_uses >= code_record.max_uses THEN
        RETURN FALSE;
    END IF;
    
    -- 既に使用済みかチェック
    IF EXISTS (
        SELECT 1 FROM public.user_codes 
        WHERE user_id = verify_access_code.user_id AND code = code_value
    ) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== インデックスの作成（パフォーマンス向上） =====

-- よく使われる検索条件にインデックス作成
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_access_codes_valid_until ON public.access_codes(valid_until);
CREATE INDEX IF NOT EXISTS idx_access_codes_pack_id ON public.access_codes(pack_id);
CREATE INDEX IF NOT EXISTS idx_user_codes_user_id ON public.user_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_pack_id ON public.cards(pack_id);
CREATE INDEX IF NOT EXISTS idx_cards_rarity_id ON public.cards(rarity_id);

-- RLS有効化完了の確認
SELECT 
    schemaname,
    tablename,
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'packs', 'rarities', 'cards', 'access_codes', 'user_codes')
ORDER BY tablename;