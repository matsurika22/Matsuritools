-- レアリティテーブルにdisplay_nameカラムを追加
ALTER TABLE rarities 
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- デフォルト値を設定
UPDATE rarities SET display_name = CASE
  WHEN name = 'DM' THEN 'ドリームレア'
  WHEN name = 'OR' THEN 'オーバーレア'
  WHEN name = 'SR' THEN 'スーパーレア'
  WHEN name = 'VR' THEN 'ベリーレア'
  WHEN name = 'R' THEN 'レア'
  WHEN name = 'UC' THEN 'アンコモン'
  WHEN name = 'C' THEN 'コモン'
  WHEN name = 'DM㊙' THEN 'シークレットドリームレア'
  WHEN name = '㊙' THEN 'シークレットレア'
  WHEN name = 'TD' THEN 'キャラプレミアムトレジャー'
  WHEN name = 'SP' THEN '金トレジャー'
  WHEN name = 'TR' THEN '銀トレジャー'
  WHEN name = 'T' THEN '黒トレジャー'
  WHEN name = 'U' THEN 'アンコモン（旧）'
  WHEN name = 'MR' THEN 'マスターレア'
  ELSE name
END
WHERE display_name IS NULL;

-- pack_rarity_detailsビューを更新して表示名も含める
DROP VIEW IF EXISTS pack_rarity_details;

CREATE VIEW pack_rarity_details AS
SELECT 
  pr.pack_id,
  pr.rarity_id,
  r.name as rarity_name,
  r.display_name as rarity_display_name,
  r.color as rarity_color,
  r.display_order,
  pr.cards_per_box,
  pr.notes,
  COUNT(c.id) as total_types,
  CASE 
    WHEN COUNT(c.id) > 0 AND pr.cards_per_box > 0 
    THEN pr.cards_per_box::float / COUNT(c.id)::float 
    ELSE 0 
  END as rate_per_card
FROM pack_rarities pr
JOIN rarities r ON pr.rarity_id = r.id
LEFT JOIN cards c ON c.pack_id = pr.pack_id AND c.rarity_id = pr.rarity_id
GROUP BY pr.pack_id, pr.rarity_id, r.name, r.display_name, r.color, r.display_order, pr.cards_per_box, pr.notes
ORDER BY r.display_order;