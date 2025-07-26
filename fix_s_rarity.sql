-- Sレアリティの設定を修正
UPDATE rarities 
SET display_order = 3, display_name = 'シークレットレア'
WHERE name = 'S';

-- SRレアリティの表示名を修正
UPDATE rarities 
SET display_name = 'スーパーレア'
WHERE name = 'SR';

-- 確認
SELECT name, display_name, display_order 
FROM rarities 
WHERE name IN ('S', 'SR', 'VR', 'R')
ORDER BY display_order;