-- pack_raritiesテーブルに再録用の封入率カラムを追加

-- 再録カード用の封入率カラムを追加
ALTER TABLE pack_rarities 
ADD COLUMN IF NOT EXISTS cards_per_box_reprint NUMERIC DEFAULT 0;

-- 再録カード用の入力フィールドを追加  
ALTER TABLE pack_rarities 
ADD COLUMN IF NOT EXISTS box_input_x_reprint TEXT;

ALTER TABLE pack_rarities 
ADD COLUMN IF NOT EXISTS box_input_y_reprint TEXT;

-- 再録用の特記事項カラムを追加
ALTER TABLE pack_rarities 
ADD COLUMN IF NOT EXISTS notes_reprint TEXT;

-- pack_rarity_detailsビューを再作成（再録カラムを含む）
DROP VIEW IF EXISTS pack_rarity_details;

CREATE VIEW pack_rarity_details AS
SELECT 
  pr.id,
  pr.pack_id,
  pr.rarity_id,
  pr.cards_per_box,
  pr.cards_per_box_reprint,
  pr.notes,
  pr.notes_reprint,
  pr.box_input_x,
  pr.box_input_y,
  pr.box_input_x_reprint,
  pr.box_input_y_reprint,
  r.name as rarity_name,
  r.color as rarity_color,
  r.display_order,
  COUNT(DISTINCT CASE WHEN (c.parameters->>'reprint_flag')::boolean = false OR c.parameters->>'reprint_flag' IS NULL THEN c.id END) as total_types_new,
  COUNT(DISTINCT CASE WHEN (c.parameters->>'reprint_flag')::boolean = true THEN c.id END) as total_types_reprint,
  COUNT(DISTINCT c.id) as total_types,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN (c.parameters->>'reprint_flag')::boolean = false OR c.parameters->>'reprint_flag' IS NULL THEN c.id END) > 0 
    THEN pr.cards_per_box / COUNT(DISTINCT CASE WHEN (c.parameters->>'reprint_flag')::boolean = false OR c.parameters->>'reprint_flag' IS NULL THEN c.id END)::numeric
    ELSE 0
  END as rate_per_card_new,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN (c.parameters->>'reprint_flag')::boolean = true THEN c.id END) > 0 
    THEN pr.cards_per_box_reprint / COUNT(DISTINCT CASE WHEN (c.parameters->>'reprint_flag')::boolean = true THEN c.id END)::numeric
    ELSE 0
  END as rate_per_card_reprint,
  CASE 
    WHEN COUNT(DISTINCT c.id) > 0 
    THEN (pr.cards_per_box + COALESCE(pr.cards_per_box_reprint, 0)) / COUNT(DISTINCT c.id)::numeric
    ELSE 0
  END as rate_per_card
FROM pack_rarities pr
LEFT JOIN rarities r ON pr.rarity_id = r.id
LEFT JOIN cards c ON c.pack_id = pr.pack_id AND c.rarity_id = pr.rarity_id
GROUP BY 
  pr.id, pr.pack_id, pr.rarity_id, pr.cards_per_box, pr.cards_per_box_reprint, 
  pr.notes, pr.notes_reprint, pr.box_input_x, pr.box_input_y, 
  pr.box_input_x_reprint, pr.box_input_y_reprint,
  r.name, r.color, r.display_order;