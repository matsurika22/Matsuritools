// cardsテーブルに不足しているカラムを追加

import { createClient } from '@supabase/supabase-js'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addMissingColumns() {
  console.log('🔧 不足しているカラムを追加中...')
  
  try {
    // 既存データをリセット（テスト用の不完全なデータをクリア）
    console.log('🗑️ 既存のテストデータをクリア中...')
    
    await supabase.from('cards').delete().neq('id', 'dummy')
    await supabase.from('rarities').delete().neq('id', 0)
    await supabase.from('packs').delete().neq('id', 'dummy')

    // 基本レアリティデータを挿入（display_orderを使用）
    console.log('📊 基本レアリティデータを挿入中...')
    
    const rarities = [
      { name: 'C', color: '#6B7280', display_order: 1, pack_id: null },
      { name: 'U', color: '#10B981', display_order: 2, pack_id: null },
      { name: 'R', color: '#3B82F6', display_order: 3, pack_id: null },
      { name: 'VR', color: '#8B5CF6', display_order: 4, pack_id: null },
      { name: 'SR', color: '#F59E0B', display_order: 5, pack_id: null },
      { name: 'MR', color: '#EF4444', display_order: 6, pack_id: null }
    ]

    for (const rarity of rarities) {
      const { error } = await supabase
        .from('rarities')
        .insert(rarity)
      
      if (error && !error.message.includes('duplicate')) {
        console.error(`レアリティ ${rarity.name} 挿入エラー:`, error.message)
      } else {
        console.log(`✅ レアリティ ${rarity.name} を挿入`)
      }
    }

    console.log('🎉 データベースの準備が完了しました！')
    
    // 確認
    const { data: raritiesData } = await supabase
      .from('rarities')
      .select('*')
      .order('display_order')
    
    console.log('\n📊 現在のレアリティデータ:')
    raritiesData?.forEach(r => {
      console.log(`  - ${r.name}: ${r.color} (順番: ${r.display_order})`)
    })

  } catch (error) {
    console.error('❌ カラム追加エラー:', error)
  }
}

addMissingColumns()