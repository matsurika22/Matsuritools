// データベース修正スクリプト
// raritiesテーブルにsort_orderカラムを追加

import { createClient } from '@supabase/supabase-js'

// 環境変数の読み込み
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixDatabase() {
  console.log('🔧 データベース構造を修正しています...')
  
  try {
    // 1. sort_orderカラムを追加
    console.log('📊 raritiesテーブルにsort_orderカラムを追加中...')
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.rarities 
        ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
        
        UPDATE public.rarities 
        SET sort_order = COALESCE(display_order, 0) 
        WHERE sort_order = 0;
        
        ALTER TABLE public.rarities 
        ALTER COLUMN pack_id DROP NOT NULL;
      `
    })

    if (alterError) {
      console.log('⚠️ SQL実行エラー（手動で実行が必要かもしれません）:', alterError.message)
    }

    // 2. 基本レアリティデータを直接挿入
    console.log('📊 基本レアリティデータを挿入中...')
    
    const rarities = [
      { name: 'C', color: '#6B7280', sort_order: 1 },
      { name: 'U', color: '#10B981', sort_order: 2 },
      { name: 'R', color: '#3B82F6', sort_order: 3 },
      { name: 'VR', color: '#8B5CF6', sort_order: 4 },
      { name: 'SR', color: '#F59E0B', sort_order: 5 },
      { name: 'MR', color: '#EF4444', sort_order: 6 }
    ]

    for (const rarity of rarities) {
      const { error } = await supabase
        .from('rarities')
        .upsert({
          ...rarity,
          pack_id: null
        }, { 
          onConflict: 'name',
          ignoreDuplicates: false 
        })
      
      if (error) {
        console.error(`レアリティ ${rarity.name} の挿入エラー:`, error.message)
      } else {
        console.log(`✅ レアリティ ${rarity.name} を挿入`)
      }
    }

    // 3. cardsテーブルにcard_numberとreference_priceカラムを追加
    console.log('🃏 cardsテーブルの構造を更新中...')
    
    const { error: cardError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.cards 
        ADD COLUMN IF NOT EXISTS card_number TEXT,
        ADD COLUMN IF NOT EXISTS reference_price INTEGER,
        ADD COLUMN IF NOT EXISTS buyback_price INTEGER;
        
        UPDATE public.cards 
        SET reference_price = market_price 
        WHERE market_price IS NOT NULL AND reference_price IS NULL;
      `
    })

    if (cardError && !cardError.message.includes('already exists')) {
      console.log('⚠️ cardsテーブル更新エラー:', cardError.message)
    }

    console.log('🎉 データベース修正が完了しました！')
    
    // 確認
    const { data: raritiesData } = await supabase
      .from('rarities')
      .select('*')
      .order('sort_order')
    
    console.log('\n📊 現在のレアリティデータ:')
    raritiesData?.forEach(r => {
      console.log(`  - ${r.name}: ${r.color} (順番: ${r.sort_order})`)
    })

  } catch (error) {
    console.error('❌ データベース修正エラー:', error)
  }
}

fixDatabase()