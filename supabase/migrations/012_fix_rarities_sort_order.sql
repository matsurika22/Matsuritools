-- raritiesテーブルのsort_orderカラム追加とpack_idの修正

-- 1. sort_orderカラムを追加（display_orderがあるので、sort_orderに名前変更または追加）
ALTER TABLE public.rarities 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 2. 既存のdisplay_orderデータをsort_orderにコピー
UPDATE public.rarities 
SET sort_order = display_order 
WHERE sort_order = 0 AND display_order IS NOT NULL;

-- 3. pack_id制約を一時的に無効化（グローバルレアリティ対応）
ALTER TABLE public.rarities 
ALTER COLUMN pack_id DROP NOT NULL;

-- 4. 既存のレアリティデータをクリーンアップ
DELETE FROM public.rarities WHERE name NOT IN ('C', 'U', 'R', 'VR', 'SR', 'MR');

-- 5. 基本レアリティデータを挿入（pack_id = NULLでグローバル設定）
INSERT INTO public.rarities (name, color, sort_order, pack_id) VALUES
('C', '#6B7280', 1, NULL),   -- コモン (グレー)
('U', '#10B981', 2, NULL),   -- アンコモン (緑) 
('R', '#3B82F6', 3, NULL),   -- レア (青)
('VR', '#8B5CF6', 4, NULL),  -- ベリーレア (紫)
('SR', '#F59E0B', 5, NULL),  -- スーパーレア (オレンジ)
('MR', '#EF4444', 6, NULL)   -- マスターレア (赤)
ON CONFLICT (id) DO UPDATE SET
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order;

-- 6. インデックスの追加
CREATE INDEX IF NOT EXISTS idx_rarities_sort_order ON public.rarities(sort_order);
CREATE INDEX IF NOT EXISTS idx_rarities_name ON public.rarities(name);

-- 7. 変更確認
SELECT id, name, color, sort_order, pack_id 
FROM public.rarities 
ORDER BY sort_order;