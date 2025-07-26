-- packsテーブルにdisplay_rarity_idsカラムを追加
ALTER TABLE packs 
ADD COLUMN IF NOT EXISTS display_rarity_ids TEXT[] DEFAULT NULL;

-- コメントを追加
COMMENT ON COLUMN packs.display_rarity_ids IS '買取金額入力画面に表示するレアリティIDの配列（NULLの場合はすべて表示）';