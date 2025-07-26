// 封入率の修正

import { createClient } from '@supabase/supabase-js'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updatePackRarities() {
  console.log('📦 封入率を修正中...')
  
  // DM25-RP1の正しい封入率
  const correctRates = [
    { rarity: 'DM㊙', cards_per_box: 0.0625 },  // 16BOXに1枚
    { rarity: 'SP', cards_per_box: 0.5 },       // 2BOXに1枚
  ]
  
  for (const rate of correctRates) {
    // レアリティIDを取得
    const { data: rarity } = await supabase
      .from('rarities')
      .select('id')
      .eq('name', rate.rarity)
      .single()
    
    if (!rarity) continue
    
    // 封入率を更新
    const { error } = await supabase
      .from('pack_rarities')
      .update({ cards_per_box: rate.cards_per_box })
      .eq('pack_id', 'DM25-RP1')
      .eq('rarity_id', rarity.id)
    
    if (error) {
      console.error(`❌ ${rate.rarity} 更新エラー:`, error)
    } else {
      console.log(`✅ ${rate.rarity}: ${rate.cards_per_box}枚/BOX に修正`)
    }
  }
  
  // 確認
  const { data: updated } = await supabase
    .from('pack_rarity_details')
    .select('rarity_name, cards_per_box')
    .eq('pack_id', 'DM25-RP1')
    .order('display_order')
  
  console.log('\n📊 更新後の封入率:')
  updated?.forEach(pr => {
    console.log(`  - ${pr.rarity_name}: ${pr.cards_per_box}枚/BOX`)
  })
}

updatePackRarities()