-- カードテーブルに型番カラムと参考販売価格カラムを追加
-- market_price を reference_price にリネーム

-- 1. 型番カラムを追加
ALTER TABLE public.cards 
ADD COLUMN IF NOT EXISTS card_number TEXT;

-- 2. 参考販売価格カラムを追加（まず追加）
ALTER TABLE public.cards 
ADD COLUMN IF NOT EXISTS reference_price INTEGER;

-- 3. 既存のmarket_priceデータをreference_priceにコピー
UPDATE public.cards 
SET reference_price = market_price 
WHERE market_price IS NOT NULL AND reference_price IS NULL;

-- 4. market_priceカラムを削除（もし存在する場合）
ALTER TABLE public.cards 
DROP COLUMN IF EXISTS market_price;

-- 5. インデックスの追加（検索性能向上）
CREATE INDEX IF NOT EXISTS idx_cards_card_number ON public.cards(card_number);

-- 6. コメントを追加
COMMENT ON COLUMN public.cards.card_number IS 'カードの型番（例: DM01-001）';
COMMENT ON COLUMN public.cards.reference_price IS '参考販売価格（円）';

-- 7. 変更後のテーブル構造を確認
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'cards'
ORDER BY ordinal_position;