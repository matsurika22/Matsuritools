-- 【緊急修正】SRの表示名を確実に修正
UPDATE rarities SET display_name = 'スーパーレア' WHERE name = 'SR';

-- SがSレアの場合も修正
UPDATE rarities SET display_name = 'シークレットレア' WHERE name = 'S';

-- 他の主要レアリティも確実に設定
UPDATE rarities SET display_name = 'ベリーレア' WHERE name = 'VR';
UPDATE rarities SET display_name = 'レア' WHERE name = 'R';
UPDATE rarities SET display_name = 'アンコモン' WHERE name = 'UC';
UPDATE rarities SET display_name = 'コモン' WHERE name = 'C';

-- 確認クエリ
SELECT name, display_name, display_order FROM rarities WHERE name IN ('S', 'SR', 'VR', 'R', 'UC', 'C') ORDER BY display_order;