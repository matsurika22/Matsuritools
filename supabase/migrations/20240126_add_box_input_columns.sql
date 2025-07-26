-- pack_raritiesテーブルにbox_input_xとbox_input_yカラムを追加
ALTER TABLE pack_rarities 
ADD COLUMN IF NOT EXISTS box_input_x TEXT,
ADD COLUMN IF NOT EXISTS box_input_y TEXT;

-- 既存データに初期値を設定
UPDATE pack_rarities 
SET box_input_x = '1', 
    box_input_y = cards_per_box::text 
WHERE box_input_x IS NULL;