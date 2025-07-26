-- packsテーブルにcustom_card_idsカラムを追加
ALTER TABLE packs 
ADD COLUMN IF NOT EXISTS custom_card_ids TEXT[] DEFAULT '{}';

-- コメントを追加
COMMENT ON COLUMN packs.custom_card_ids IS 'カスタム表示するカードIDの配列';