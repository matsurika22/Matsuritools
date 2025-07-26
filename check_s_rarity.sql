-- DM25-RP1パックのSレアリティカードを確認
SELECT c.card_number, c.name, r.name as rarity_name, r.display_name, r.display_order
FROM cards c
JOIN rarities r ON c.rarity_id = r.id
WHERE c.pack_id = 'DM25-RP1' AND r.name = 'S'
ORDER BY c.card_number;

-- レアリティマスターでSの情報を確認
SELECT * FROM rarities WHERE name = 'S';