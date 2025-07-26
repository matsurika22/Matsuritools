-- レアリティの表示順序を正しく設定
-- 一般的なデュエル・マスターズのレアリティ順序：高レア→低レア

UPDATE rarities SET display_order = 1 WHERE name = 'DM㊙';     -- シークレットドリームレア（最高レア）
UPDATE rarities SET display_order = 2 WHERE name = 'DM';      -- ドリームレア
UPDATE rarities SET display_order = 3 WHERE name = '㊙';      -- シークレットレア
UPDATE rarities SET display_order = 4 WHERE name = 'OR';      -- オーバーレア
UPDATE rarities SET display_order = 5 WHERE name = 'SR';      -- スーパーレア
UPDATE rarities SET display_order = 6 WHERE name = 'VR';      -- ベリーレア
UPDATE rarities SET display_order = 7 WHERE name = 'R';       -- レア
UPDATE rarities SET display_order = 8 WHERE name = 'TD';      -- キャラプレミアムトレジャー
UPDATE rarities SET display_order = 9 WHERE name = 'SP';      -- 金トレジャー
UPDATE rarities SET display_order = 10 WHERE name = 'TR';     -- 銀トレジャー
UPDATE rarities SET display_order = 11 WHERE name = 'T';      -- 黒トレジャー
UPDATE rarities SET display_order = 12 WHERE name = 'MR';     -- マスターレア
UPDATE rarities SET display_order = 13 WHERE name = 'UC';     -- アンコモン
UPDATE rarities SET display_order = 14 WHERE name = 'U';      -- アンコモン（旧）
UPDATE rarities SET display_order = 15 WHERE name = 'C';      -- コモン

-- 確認クエリ
SELECT name, display_name, display_order 
FROM rarities 
ORDER BY display_order ASC;