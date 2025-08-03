// 新しいレアリティを追加するスクリプト

import { createClient } from '@supabase/supabase-js'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addNewRarities() {
  console.log('🔧 新しいレアリティを追加中...')
  
  // 新しいレアリティの定義
  const newRarities = [
    {
      name: 'SPR',
      display_name: 'ヒロインレア',
      color: '#FF69B4', // Hot Pink
      display_order: 8
    },
    {
      name: 'MC',
      display_name: '分類不明',
      color: '#708090', // Slate Gray
      display_order: 15
    },
    {
      name: 'SPR㊙',
      display_name: '大先生シークレット',
      color: '#FFD700', // Gold
      display_order: 9
    },
    {
      name: 'PR',
      display_name: 'キャラトレジャー',
      color: '#FF6347', // Tomato
      display_order: 14
    }
  ]
  
  console.log('📌 以下のレアリティを追加します:')
  newRarities.forEach(r => {
    console.log(`  - ${r.name} (${r.display_name})`)
  })
  
  let successCount = 0
  let errorCount = 0
  
  for (const rarity of newRarities) {
    // まず既存のレアリティをチェック
    const { data: existing, error: checkError } = await supabase
      .from('rarities')
      .select('id, name')
      .eq('name', rarity.name)
      .single()
    
    if (existing) {
      console.log(`⚠️ レアリティ「${rarity.name}」は既に存在します。スキップします。`)
      continue
    }
    
    // 新規追加
    const { data, error } = await supabase
      .from('rarities')
      .insert(rarity)
      .select()
    
    if (error) {
      console.error(`❌ レアリティ「${rarity.name}」追加エラー:`, error.message)
      errorCount++
    } else {
      console.log(`✅ レアリティ「${rarity.name} (${rarity.display_name})」を追加しました`)
      successCount++
    }
  }
  
  // 結果表示
  console.log('\n📊 処理結果:')
  console.log(`  成功: ${successCount}件`)
  console.log(`  エラー: ${errorCount}件`)
  
  // 現在のレアリティ一覧を表示
  const { data: allRarities } = await supabase
    .from('rarities')
    .select('name, display_name, display_order')
    .order('display_order')
  
  console.log('\n📋 現在のレアリティ一覧:')
  allRarities?.forEach(r => {
    console.log(`  ${r.display_order.toString().padStart(2)}: ${r.name.padEnd(6)} - ${r.display_name || '(未設定)'}`)
  })
}

addNewRarities()