-- Access codes table (アクセスコード) - 存在しない場合のみ作成
CREATE TABLE IF NOT EXISTS public.access_codes (
    code TEXT PRIMARY KEY, -- 12桁コード
    pack_id TEXT REFERENCES public.packs(id) ON DELETE CASCADE,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User codes table (ユーザー保有コード) - 存在しない場合のみ作成
CREATE TABLE IF NOT EXISTS public.user_codes (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    code TEXT REFERENCES public.access_codes(code) ON DELETE CASCADE,
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, code)
);

-- RLSを無効化（開発環境用）
ALTER TABLE public.access_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_codes DISABLE ROW LEVEL SECURITY;

-- テスト用アクセスコードを再投入
INSERT INTO public.access_codes (code, pack_id, valid_from, valid_until, max_uses, created_by)
VALUES 
    ('24RP-TEST-0001', '24RP1', NOW(), NOW() + INTERVAL '30 days', 100, 
        (SELECT id FROM public.users WHERE email = 'mk0207yu1111@gmail.com' LIMIT 1)),
    ('24EX-TEST-0001', '24EX1', NOW(), NOW() + INTERVAL '30 days', 100, 
        (SELECT id FROM public.users WHERE email = 'mk0207yu1111@gmail.com' LIMIT 1)),
    ('DEMO-FREE-2024', NULL, NOW(), NOW() + INTERVAL '365 days', 1000, 
        (SELECT id FROM public.users WHERE email = 'mk0207yu1111@gmail.com' LIMIT 1))
ON CONFLICT (code) DO NOTHING;

-- 投入されたデータを確認
SELECT * FROM public.access_codes;