-- アクセスコードのRLSポリシーを修正
-- ユーザーがアクセスコードを検証できるようにする

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Admin can manage access codes" ON public.access_codes;

-- 新しいポリシーを作成
-- 誰でもアクセスコードを読み取れる（検証のため）
CREATE POLICY "Anyone can view access codes" ON public.access_codes
    FOR SELECT USING (true);

-- 管理者のみがアクセスコードを作成・更新・削除できる
CREATE POLICY "Admin can insert access codes" ON public.access_codes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY "Admin can update access codes" ON public.access_codes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY "Admin can delete access codes" ON public.access_codes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );