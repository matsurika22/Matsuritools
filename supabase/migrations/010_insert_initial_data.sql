-- 初期データの投入
-- デュエル・マスターズ第1弾のデータを登録

-- ===== レアリティデータの挿入 =====
INSERT INTO public.rarities (name, color, sort_order) VALUES
('C', '#6B7280', 1),   -- コモン (グレー)
('U', '#10B981', 2),   -- アンコモン (緑)
('R', '#3B82F6', 3),   -- レア (青)
('VR', '#8B5CF6', 4),  -- ベリーレア (紫)
('SR', '#F59E0B', 5),  -- スーパーレア (オレンジ)
('MR', '#EF4444', 6)   -- マスターレア (赤)
ON CONFLICT (name) DO UPDATE SET
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order;

-- ===== 弾データの挿入 =====
INSERT INTO public.packs (
  name, 
  release_date, 
  box_price, 
  packs_per_box, 
  cards_per_pack
) VALUES
('第1弾 聖拳編', '2002-05-30', 12000, 24, 11)
ON CONFLICT (name) DO UPDATE SET
  release_date = EXCLUDED.release_date,
  box_price = EXCLUDED.box_price,
  packs_per_box = EXCLUDED.packs_per_box,
  cards_per_pack = EXCLUDED.cards_per_pack;

-- ===== カードデータの挿入 =====
-- 第1弾の主要カード（抜粋）

-- MRカード
WITH pack_id AS (SELECT id FROM public.packs WHERE name = '第1弾 聖拳編'),
     mr_rarity AS (SELECT id FROM public.rarities WHERE name = 'MR')
INSERT INTO public.cards (name, pack_id, rarity_id, buyback_price, market_price) 
SELECT 
  card_name,
  pack_id.id,
  mr_rarity.id,
  buyback_price,
  market_price
FROM pack_id, mr_rarity, (VALUES 
  ('ボルメテウス・ホワイト・ドラゴン', 8000, 12000),
  ('アルカディア・スパーク', 5000, 8000),
  ('超竜バジュラ', 4000, 7000),
  ('ヘブンズ・ゲート', 3000, 5000)
) AS cards(card_name, buyback_price, market_price)
ON CONFLICT (name, pack_id) DO UPDATE SET
  buyback_price = EXCLUDED.buyback_price,
  market_price = EXCLUDED.market_price;

-- SRカード
WITH pack_id AS (SELECT id FROM public.packs WHERE name = '第1弾 聖拳編'),
     sr_rarity AS (SELECT id FROM public.rarities WHERE name = 'SR')
INSERT INTO public.cards (name, pack_id, rarity_id, buyback_price, market_price) 
SELECT 
  card_name,
  pack_id.id,
  sr_rarity.id,
  buyback_price,
  market_price
FROM pack_id, sr_rarity, (VALUES 
  ('聖霊王アルファディオス', 2500, 4000),
  ('ダイヤモンド・ソード', 2000, 3500),
  ('コッコ・ルピア', 1800, 3000),
  ('フォース・アゲイン', 1500, 2500),
  ('スピリット・クエイク', 1200, 2000),
  ('ライトニング・ソード', 1000, 1800)
) AS cards(card_name, buyback_price, market_price)
ON CONFLICT (name, pack_id) DO UPDATE SET
  buyback_price = EXCLUDED.buyback_price,
  market_price = EXCLUDED.market_price;

-- VRカード
WITH pack_id AS (SELECT id FROM public.packs WHERE name = '第1弾 聖拳編'),
     vr_rarity AS (SELECT id FROM public.rarities WHERE name = 'VR')
INSERT INTO public.cards (name, pack_id, rarity_id, buyback_price, market_price) 
SELECT 
  card_name,
  pack_id.id,
  vr_rarity.id,
  buyback_price,
  market_price
FROM pack_id, vr_rarity, (VALUES 
  ('ボルシャック・ドラゴン', 800, 1500),
  ('青銅の鎧', 600, 1200),
  ('ディメンション・ゲート', 500, 1000),
  ('エマージェンシー・タイフーン', 400, 800),
  ('アクア・サーファー', 350, 700),
  ('炎槍と水剣の裁', 300, 600),
  ('森羅の意志', 250, 500),
  ('霊騎コルテオ', 200, 400)
) AS cards(card_name, buyback_price, market_price)
ON CONFLICT (name, pack_id) DO UPDATE SET
  buyback_price = EXCLUDED.buyback_price,
  market_price = EXCLUDED.market_price;

-- Rカード（主要なもの）
WITH pack_id AS (SELECT id FROM public.packs WHERE name = '第1弾 聖拳編'),
     r_rarity AS (SELECT id FROM public.rarities WHERE name = 'R')
INSERT INTO public.cards (name, pack_id, rarity_id, buyback_price, market_price) 
SELECT 
  card_name,
  pack_id.id,
  r_rarity.id,
  buyback_price,
  market_price
FROM pack_id, r_rarity, (VALUES 
  ('ホーリー・スパーク', 150, 300),
  ('バトル・スペード', 120, 250),
  ('ヘル・スラッシュ', 100, 200),
  ('スパイラル・ゲート', 80, 180),
  ('コロコッタ', 60, 150),
  ('スカルガイ', 50, 120),
  ('ライトニング・ソード', 40, 100),
  ('ガイアール・カイザー', 30, 80)
) AS cards(card_name, buyback_price, market_price)
ON CONFLICT (name, pack_id) DO UPDATE SET
  buyback_price = EXCLUDED.buyback_price,
  market_price = EXCLUDED.market_price;

-- Uカード（代表的なもの）
WITH pack_id AS (SELECT id FROM public.packs WHERE name = '第1弾 聖拳編'),
     u_rarity AS (SELECT id FROM public.rarities WHERE name = 'U')
INSERT INTO public.cards (name, pack_id, rarity_id, buyback_price, market_price) 
SELECT 
  card_name,
  pack_id.id,
  u_rarity.id,
  buyback_price,
  market_price
FROM pack_id, u_rarity, (VALUES 
  ('クリムゾン・ハンマー', 20, 50),
  ('ブルー・ソルジャー', 15, 40),
  ('フレイム・スラッシュ', 12, 35),
  ('アース・スピア', 10, 30),
  ('ウォーター・ガン', 8, 25),
  ('パワー・アタック', 5, 20)
) AS cards(card_name, buyback_price, market_price)
ON CONFLICT (name, pack_id) DO UPDATE SET
  buyback_price = EXCLUDED.buyback_price,
  market_price = EXCLUDED.market_price;

-- Cカード（代表的なもの）
WITH pack_id AS (SELECT id FROM public.packs WHERE name = '第1弾 聖拳編'),
     c_rarity AS (SELECT id FROM public.rarities WHERE name = 'C')
INSERT INTO public.cards (name, pack_id, rarity_id, buyback_price, market_price) 
SELECT 
  card_name,
  pack_id.id,
  c_rarity.id,
  buyback_price,
  market_price
FROM pack_id, c_rarity, (VALUES 
  ('ファイター・デュエル', 5, 10),
  ('ピーコック', 3, 8),
  ('バトル・キック', 2, 5),
  ('フレイム・アタック', 1, 3)
) AS cards(card_name, buyback_price, market_price)
ON CONFLICT (name, pack_id) DO UPDATE SET
  buyback_price = EXCLUDED.buyback_price,
  market_price = EXCLUDED.market_price;

-- ===== アクセスコードのサンプル作成 =====
WITH pack_id AS (SELECT id FROM public.packs WHERE name = '第1弾 聖拳編')
INSERT INTO public.access_codes (
  code,
  pack_id,
  max_uses,
  valid_until,
  created_by
) 
SELECT 
  code_value,
  pack_id.id,
  max_uses,
  valid_until,
  (SELECT id FROM auth.users WHERE email LIKE '%admin%' LIMIT 1)
FROM pack_id, (VALUES 
  ('DEMO2024', 100, '2024-12-31 23:59:59'::timestamp),
  ('FRIEND2024', 50, '2024-12-31 23:59:59'::timestamp),
  ('TEST2024', 10, '2024-08-31 23:59:59'::timestamp)
) AS codes(code_value, max_uses, valid_until)
ON CONFLICT (code) DO UPDATE SET
  max_uses = EXCLUDED.max_uses,
  valid_until = EXCLUDED.valid_until;

-- ===== データ投入完了の確認 =====
SELECT 
  'rarities' as table_name, 
  COUNT(*) as record_count 
FROM public.rarities
UNION ALL
SELECT 
  'packs' as table_name, 
  COUNT(*) as record_count 
FROM public.packs
UNION ALL
SELECT 
  'cards' as table_name, 
  COUNT(*) as record_count 
FROM public.cards
UNION ALL
SELECT 
  'access_codes' as table_name, 
  COUNT(*) as record_count 
FROM public.access_codes
ORDER BY table_name;