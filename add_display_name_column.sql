-- レアリティテーブルにdisplay_nameカラムを追加
ALTER TABLE rarities ADD COLUMN IF NOT EXISTS display_name TEXT;

-- 既存データに表示名を設定
UPDATE rarities SET display_name = 'コモン' WHERE name = 'C';
UPDATE rarities SET display_name = 'アンコモン' WHERE name = 'UC';
UPDATE rarities SET display_name = 'レア' WHERE name = 'R';
UPDATE rarities SET display_name = 'ベリーレア' WHERE name = 'VR';
UPDATE rarities SET display_name = 'スーパーレア' WHERE name = 'SR';
UPDATE rarities SET display_name = 'マスターレア' WHERE name = 'MR';
UPDATE rarities SET display_name = '黒トレジャー' WHERE name = 'T';
UPDATE rarities SET display_name = 'ドリームレア' WHERE name = 'DM';
UPDATE rarities SET display_name = 'オーバーレア' WHERE name = 'OR';
UPDATE rarities SET display_name = 'シークレットドリームレア' WHERE name = 'DM㊙';
UPDATE rarities SET display_name = 'シークレットレア' WHERE name = '㊙';
UPDATE rarities SET display_name = 'キャラプレミアムトレジャー' WHERE name = 'TD';
UPDATE rarities SET display_name = '金トレジャー' WHERE name = 'SP';
UPDATE rarities SET display_name = '銀トレジャー' WHERE name = 'TR';
UPDATE rarities SET display_name = 'シークレットレア' WHERE name = 'S';

-- 結果確認
SELECT name, display_name, display_order FROM rarities ORDER BY display_order;