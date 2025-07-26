-- 緊急修正：レアリティの順序と表示名を確実に修正
UPDATE rarities SET display_order = 1 WHERE name = 'DM㊙';
UPDATE rarities SET display_order = 2 WHERE name = 'DM';
UPDATE rarities SET display_order = 3 WHERE name = '㊙';
UPDATE rarities SET display_order = 4 WHERE name = 'OR';
UPDATE rarities SET display_order = 5, display_name = 'スーパーレア' WHERE name = 'SR';
UPDATE rarities SET display_order = 6 WHERE name = 'VR';
UPDATE rarities SET display_order = 7 WHERE name = 'R';
UPDATE rarities SET display_order = 8 WHERE name = 'UC';
UPDATE rarities SET display_order = 9 WHERE name = 'C';
UPDATE rarities SET display_order = 3, display_name = 'シークレットレア' WHERE name = 'S';

-- 確認
SELECT name, display_name, display_order FROM rarities ORDER BY CAST(display_order AS INTEGER);