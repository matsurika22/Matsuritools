-- テスト用の弾データを投入
INSERT INTO public.packs (id, name, release_date, box_price, packs_per_box, cards_per_pack, is_active) 
VALUES 
    ('24RP1', 'レジェンドスーパーデッキ 蒼龍革命', '2024-03-01', 5500, 1, 40, true),
    ('24EX1', 'エクストラブースター 覇闘', '2024-02-15', 4950, 30, 5, true)
ON CONFLICT (id) DO NOTHING;

-- テスト用のレアリティデータ（24RP1用）
INSERT INTO public.rarities (pack_id, name, cards_per_box, total_cards, color, display_order) 
VALUES 
    ('24RP1', 'SR（スーパーレア）', 2, 4, '#FFD700', 1),
    ('24RP1', 'VR（ベリーレア）', 4, 4, '#C0C0C0', 2),
    ('24RP1', 'R（レア）', 8, 8, '#CD853F', 3),
    ('24RP1', 'UC（アンコモン）', 12, 12, '#4169E1', 4),
    ('24RP1', 'C（コモン）', 14, 12, '#808080', 5)
ON CONFLICT DO NOTHING;

-- テスト用のアクセスコードを作成
-- 形式: XXXX-XXXX-XXXX (例: 24RP-TEST-0001)
INSERT INTO public.access_codes (code, pack_id, valid_from, valid_until, max_uses, created_by)
VALUES 
    ('24RP-TEST-0001', '24RP1', NOW(), NOW() + INTERVAL '30 days', 100, 
        (SELECT id FROM public.users WHERE email = 'mk0207yu1111@gmail.com' LIMIT 1)),
    ('24EX-TEST-0001', '24EX1', NOW(), NOW() + INTERVAL '30 days', 100, 
        (SELECT id FROM public.users WHERE email = 'mk0207yu1111@gmail.com' LIMIT 1)),
    ('DEMO-FREE-2024', NULL, NOW(), NOW() + INTERVAL '365 days', 1000, 
        (SELECT id FROM public.users WHERE email = 'mk0207yu1111@gmail.com' LIMIT 1))
ON CONFLICT (code) DO NOTHING;

-- テスト用カードデータ（サンプル）
INSERT INTO public.cards (id, pack_id, rarity_id, card_number, name, box_rate) 
VALUES 
    ('DM24RP1-S01', '24RP1', 
        (SELECT id FROM public.rarities WHERE pack_id = '24RP1' AND name = 'SR（スーパーレア）' LIMIT 1),
        'S01', '轟炎の竜皇 ボルシャック・NEX', 0.5),
    ('DM24RP1-S02', '24RP1', 
        (SELECT id FROM public.rarities WHERE pack_id = '24RP1' AND name = 'SR（スーパーレア）' LIMIT 1),
        'S02', '覇道の革命 ボルシャック・ライダー', 0.5),
    ('DM24RP1-V01', '24RP1', 
        (SELECT id FROM public.rarities WHERE pack_id = '24RP1' AND name = 'VR（ベリーレア）' LIMIT 1),
        'V01', '火之鳥 ボルシャック・フェニックス', 1.0),
    ('DM24RP1-R01', '24RP1', 
        (SELECT id FROM public.rarities WHERE pack_id = '24RP1' AND name = 'R（レア）' LIMIT 1),
        'R01', 'ボルシャック・ドラゴン', 1.0)
ON CONFLICT (id) DO NOTHING;

-- 確認用：投入されたデータを表示
SELECT 'Packs:' as table_name, COUNT(*) as count FROM public.packs
UNION ALL
SELECT 'Rarities:', COUNT(*) FROM public.rarities
UNION ALL
SELECT 'Access Codes:', COUNT(*) FROM public.access_codes
UNION ALL
SELECT 'Cards:', COUNT(*) FROM public.cards;