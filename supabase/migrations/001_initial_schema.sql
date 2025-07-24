-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'editor', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Packs table (弾情報)
CREATE TABLE IF NOT EXISTS public.packs (
    id TEXT PRIMARY KEY, -- 例: 24RP1
    name TEXT NOT NULL, -- 弾名
    release_date DATE, -- 発売日
    box_price INTEGER, -- 定価
    packs_per_box INTEGER, -- 1箱のパック数
    cards_per_pack INTEGER, -- 1パックのカード数
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rarities table (レアリティ)
CREATE TABLE IF NOT EXISTS public.rarities (
    id SERIAL PRIMARY KEY,
    pack_id TEXT REFERENCES public.packs(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- レアリティ名
    cards_per_box DECIMAL(10,4), -- 箱あたり封入枚数
    total_cards INTEGER, -- 総カード種類数
    color TEXT, -- 表示色（例: #FFD700 for gold）
    display_order INTEGER DEFAULT 0, -- 表示順
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cards table (カード情報)
CREATE TABLE IF NOT EXISTS public.cards (
    id TEXT PRIMARY KEY, -- 例: DM24RP1-001
    pack_id TEXT REFERENCES public.packs(id) ON DELETE CASCADE,
    rarity_id INTEGER REFERENCES public.rarities(id) ON DELETE CASCADE,
    card_number TEXT NOT NULL,
    name TEXT NOT NULL,
    image_url TEXT,
    box_rate DECIMAL(10,6), -- 箱封入率
    parameters JSONB DEFAULT '{}', -- 可変パラメータ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Access codes table (アクセスコード)
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

-- User codes table (ユーザー保有コード)
CREATE TABLE IF NOT EXISTS public.user_codes (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    code TEXT REFERENCES public.access_codes(code) ON DELETE CASCADE,
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, code)
);

-- User prices table (ユーザーが入力した買取価格)
CREATE TABLE IF NOT EXISTS public.user_prices (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    card_id TEXT REFERENCES public.cards(id) ON DELETE CASCADE,
    price INTEGER NOT NULL DEFAULT 10, -- 買取価格（円）
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, card_id)
);

-- Calculation logs table (計算履歴)
CREATE TABLE IF NOT EXISTS public.calculation_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    pack_id TEXT REFERENCES public.packs(id) ON DELETE CASCADE,
    box_price INTEGER, -- 購入価格
    expected_value DECIMAL(10,2), -- 期待値
    profit_probability DECIMAL(5,2), -- プラス確率（%）
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_cards_pack_id ON public.cards(pack_id);
CREATE INDEX idx_cards_rarity_id ON public.cards(rarity_id);
CREATE INDEX idx_user_codes_user_id ON public.user_codes(user_id);
CREATE INDEX idx_user_prices_user_id ON public.user_prices(user_id);
CREATE INDEX idx_calculation_logs_user_id ON public.calculation_logs(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_packs_updated_at BEFORE UPDATE ON public.packs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rarities_updated_at BEFORE UPDATE ON public.rarities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON public.cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rarities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculation_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Packs policies (everyone can read active packs)
CREATE POLICY "Anyone can view active packs" ON public.packs
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage packs" ON public.packs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Rarities policies
CREATE POLICY "Anyone can view rarities" ON public.rarities
    FOR SELECT USING (true);

CREATE POLICY "Admin can manage rarities" ON public.rarities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Cards policies
CREATE POLICY "Anyone can view cards" ON public.cards
    FOR SELECT USING (true);

CREATE POLICY "Admin can manage cards" ON public.cards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Access codes policies
CREATE POLICY "Admin can manage access codes" ON public.access_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- User codes policies
CREATE POLICY "Users can view own codes" ON public.user_codes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can activate codes" ON public.user_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User prices policies
CREATE POLICY "Users can manage own prices" ON public.user_prices
    FOR ALL USING (auth.uid() = user_id);

-- Calculation logs policies
CREATE POLICY "Users can view own logs" ON public.calculation_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own logs" ON public.calculation_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);