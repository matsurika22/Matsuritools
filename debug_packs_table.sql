-- packsテーブルの構造を確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'packs' 
ORDER BY ordinal_position;

-- display_rarity_idsカラムが存在するか確認
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_name = 'packs' 
  AND column_name = 'display_rarity_ids'
) as display_rarity_ids_exists;

-- custom_card_idsカラムが存在するか確認
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_name = 'packs' 
  AND column_name = 'custom_card_ids'
) as custom_card_ids_exists;