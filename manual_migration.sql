-- 必要なカラムを手動で追加するSQL

-- custom_card_idsカラムを追加（存在しない場合のみ）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'packs' AND column_name = 'custom_card_ids'
    ) THEN
        ALTER TABLE packs ADD COLUMN custom_card_ids TEXT[] DEFAULT '{}';
        COMMENT ON COLUMN packs.custom_card_ids IS 'カスタムカードとして「その他（R以下）」に表示するカードIDの配列';
    END IF;
END $$;

-- display_rarity_idsカラムを追加（存在しない場合のみ）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'packs' AND column_name = 'display_rarity_ids'
    ) THEN
        ALTER TABLE packs ADD COLUMN display_rarity_ids TEXT[] DEFAULT NULL;
        COMMENT ON COLUMN packs.display_rarity_ids IS '買取金額入力画面に表示するレアリティIDの配列（NULLの場合はすべて表示）';
    END IF;
END $$;