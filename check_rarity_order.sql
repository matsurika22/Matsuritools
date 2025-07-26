-- レアリティマスターの現在の順序を確認
SELECT id, name, display_name, display_order 
FROM rarities 
ORDER BY display_order ASC;

-- DM25-RP1に存在するレアリティを確認
SELECT DISTINCT r.name, r.display_order, COUNT(c.id) as card_count
FROM cards c
JOIN rarities r ON c.rarity_id = r.id
WHERE c.pack_id = 'DM25-RP1'
GROUP BY r.name, r.display_order
ORDER BY r.display_order ASC;