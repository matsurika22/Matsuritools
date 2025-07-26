-- pack_rarity_detailsビューを再作成（box_input_x, box_input_yを含む）
DROP VIEW IF EXISTS pack_rarity_details;

CREATE VIEW pack_rarity_details AS
SELECT 
  pr.id,
  pr.pack_id,
  pr.rarity_id,
  pr.cards_per_box,
  pr.notes,
  pr.box_input_x,
  pr.box_input_y,
  r.name as rarity_name,
  r.color as rarity_color,
  r.display_order,
  COUNT(DISTINCT c.id) as total_types,
  CASE 
    WHEN COUNT(DISTINCT c.id) > 0 
    THEN pr.cards_per_box / COUNT(DISTINCT c.id)::numeric
    ELSE 0
  END as rate_per_card
FROM pack_rarities pr
LEFT JOIN rarities r ON pr.rarity_id = r.id
LEFT JOIN cards c ON c.pack_id = pr.pack_id AND c.rarity_id = pr.rarity_id
GROUP BY 
  pr.id, pr.pack_id, pr.rarity_id, pr.cards_per_box, pr.notes, 
  pr.box_input_x, pr.box_input_y,
  r.name, r.color, r.display_order;