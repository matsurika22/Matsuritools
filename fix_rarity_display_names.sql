-- レアリティの表示名を正しく修正するSQL
-- SRの表示名を修正

UPDATE rarities SET display_name = 'スーパーレア' WHERE name = 'SR';

-- 他のレアリティも確認して修正（必要に応じて）
UPDATE rarities SET display_name = 'ベリーレア' WHERE name = 'VR';
UPDATE rarities SET display_name = 'レア' WHERE name = 'R';
UPDATE rarities SET display_name = 'アンコモン' WHERE name = 'UC';
UPDATE rarities SET display_name = 'コモン' WHERE name = 'C';

-- 確認クエリ
SELECT name, display_name, display_order 
FROM rarities 
ORDER BY CAST(display_order AS INTEGER) ASC;