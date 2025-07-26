// Google Sheetsで使用されているすべてのレアリティを追加

import { createClient } from '@supabase/supabase-js'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addAllRarities() {
  console.log('🔧 Google Sheetsで使用されているすべてのレアリティを追加中...')
  
  // Google Sheetsのエラーから抽出したレアリティ一覧
  const missingRarities = [
    { name: 'DM', color: '#DC2626', display_order: 8 },      // Red
    { name: 'OR', color: '#F97316', display_order: 9 },      // Orange  
    { name: 'UC', color: '#22C55E', display_order: 10 },     // Green (Uncommon)
    { name: 'DM㊙', color: '#991B1B', display_order: 11 },   // Dark Red
    { name: '㊙', color: '#7C3AED', display_order: 12 },     // Purple
    { name: 'TD', color: '#0EA5E9', display_order: 13 },     // Sky Blue
    { name: 'SP', color: '#FBBF24', display_order: 14 },     // Amber
    { name: 'TR', color: '#EC4899', display_order: 15 }      // Pink
  ]
  
  let addedCount = 0
  let errorCount = 0
  
  for (const rarity of missingRarities) {
    const { data, error } = await supabase
      .from('rarities')
      .insert(rarity)
      .select()
    
    if (error) {
      console.error(`❌ レアリティ ${rarity.name} 追加エラー:`, error.message)
      errorCount++
    } else {
      console.log(`✅ レアリティ「${rarity.name}」を追加しました`)
      addedCount++
    }
  }
  
  console.log(`\n📊 結果:`)
  console.log(`  - 追加成功: ${addedCount}件`)
  console.log(`  - エラー: ${errorCount}件`)
  
  // すべてのレアリティを確認
  const { data: allRarities } = await supabase
    .from('rarities')
    .select('*')
    .order('display_order')
  
  console.log('\n📋 現在のレアリティ一覧:')
  allRarities?.forEach(r => {
    console.log(`  - ${r.name} (${r.color}) - 表示順: ${r.display_order}`)
  })
}

addAllRarities()