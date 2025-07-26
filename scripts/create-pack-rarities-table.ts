// pack_rarities テーブルを作成するスクリプト
// 弾×レアリティごとの封入率を管理

import { createClient } from '@supabase/supabase-js'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createPackRaritiesTable() {
  console.log('📦 pack_rarities テーブルを作成中...')
  
  // SQLを直接実行できないため、データ構造の説明と手動作成の手順を表示
  console.log('\n📋 Supabase管理画面で以下のSQLを実行してください:\n')
  
  const sql = `
-- pack_rarities テーブル作成
CREATE TABLE IF NOT EXISTS pack_rarities (
  id SERIAL PRIMARY KEY,
  pack_id TEXT NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  rarity_id INTEGER NOT NULL REFERENCES rarities(id) ON DELETE CASCADE,
  box_rate DECIMAL(10, 4) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(pack_id, rarity_id)
);

-- インデックス作成
CREATE INDEX idx_pack_rarities_pack_id ON pack_rarities(pack_id);
CREATE INDEX idx_pack_rarities_rarity_id ON pack_rarities(rarity_id);

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
  `
  
  console.log(sql)
  
  console.log('\n✅ テーブル作成後、以下のコマンドで初期データを投入できます:')
  console.log('   npm run init-pack-rarities')
}

createPackRaritiesTable()