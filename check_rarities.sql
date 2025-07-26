-- レアリティマスターの現在の状況を確認
SELECT id, name, display_name, display_order 
FROM rarities 
WHERE name IN ('DM㊙', 'DM', '㊙', 'OR', 'SR', 'VR', 'R', 'UC', 'C')
ORDER BY display_order;