// レアリティとカード分布をチェック

import { createClient } from '@supabase/supabase-js'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkRarities() {
  console.log('📋 現在のレアリティ一覧:')
  
  const { data: rarities } = await supabase
    .from('rarities')
    .select('*')
    .order('display_order')
  
  rarities?.forEach(r => {
    console.log(`  - ${r.name} (${r.color}) - 表示順: ${r.display_order}`)
  })
  
  console.log('\n📊 カードのレアリティ分布:')
  
  const { data: cards } = await supabase
    .from('cards')
    .select('rarity_id, rarity:rarities(name)')
  
  const rarityCount: Record<string, number> = {}
  cards?.forEach(card => {
    const name = (card.rarity && !Array.isArray(card.rarity) ? (card.rarity as any).name : 'Unknown') || 'Unknown'
    rarityCount[name] = (rarityCount[name] || 0) + 1
  })
  
  Object.entries(rarityCount).forEach(([name, count]) => {
    console.log(`  - ${name}: ${count}枚`)
  })
  
  console.log('\n📝 不足しているレアリティ:')
  console.log('  - T (ツインパクト) - Google Sheetsで使用されているが、DBに存在しない')
}

checkRarities()