// pack_rarities テーブルを作成するスクリプト（詳細版）
// 弾×レアリティごとの封入率を「全種類数」と「BOX排出枚数」で管理

import { createClient } from '@supabase/supabase-js'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createPackRaritiesTable() {
  console.log('📦 pack_rarities テーブル（詳細版）を作成中...')
  
  console.log('\n📋 Supabase管理画面で以下のSQLを実行してください:\n')
  
  const sql = `
-- 既存のpack_raritiesテーブルがある場合は削除
DROP TABLE IF EXISTS pack_rarities CASCADE;

-- pack_rarities テーブル作成（詳細版）
CREATE TABLE pack_rarities (
  id SERIAL PRIMARY KEY,
  pack_id TEXT NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  rarity_id INTEGER NOT NULL REFERENCES rarities(id) ON DELETE CASCADE,
  
  -- 封入率情報（管理者が設定）
  cards_per_box DECIMAL(10, 4) NOT NULL DEFAULT 0, -- 1BOXあたりの排出枚数
  
  -- メタ情報
  notes TEXT,  -- 特記事項（例：「SR以上確定パック」など）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  
  UNIQUE(pack_id, rarity_id)
);

-- インデックス作成
CREATE INDEX idx_pack_rarities_pack_id ON pack_rarities(pack_id);
CREATE INDEX idx_pack_rarities_rarity_id ON pack_rarities(rarity_id);

-- updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pack_rarities_updated_at 
  BEFORE UPDATE ON pack_rarities 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLSポリシー
ALTER TABLE pack_rarities ENABLE ROW LEVEL SECURITY;

-- 読み取りは全員可能
CREATE POLICY "pack_rarities_read_all" ON pack_rarities
  FOR SELECT USING (true);

-- 管理者のみ更新可能
CREATE POLICY "pack_rarities_admin_all" ON pack_rarities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- ビューを作成（カード数と封入率を結合して表示）
CREATE OR REPLACE VIEW pack_rarity_details AS
SELECT 
  pr.*,
  p.name as pack_name,
  r.name as rarity_name,
  r.color as rarity_color,
  r.display_order,
  -- 実際のカード種類数を自動カウント
  (
    SELECT COUNT(DISTINCT c.id) 
    FROM cards c 
    WHERE c.pack_id = pr.pack_id 
    AND c.rarity_id = pr.rarity_id
  ) as total_types,
  -- 1種類あたりの封入率を計算
  CASE 
    WHEN (
      SELECT COUNT(DISTINCT c.id) 
      FROM cards c 
      WHERE c.pack_id = pr.pack_id 
      AND c.rarity_id = pr.rarity_id
    ) > 0 THEN 
      pr.cards_per_box::DECIMAL / (
        SELECT COUNT(DISTINCT c.id) 
        FROM cards c 
        WHERE c.pack_id = pr.pack_id 
        AND c.rarity_id = pr.rarity_id
      )
    ELSE 0 
  END as rate_per_card
FROM pack_rarities pr
JOIN packs p ON pr.pack_id = p.id
JOIN rarities r ON pr.rarity_id = r.id
ORDER BY p.name, r.display_order;
  `
  
  console.log(sql)
  
  console.log('\n✅ テーブル作成後、以下のコマンドで初期データを投入できます:')
  console.log('   npm run init-pack-rarities-detailed')
}

createPackRaritiesTable()