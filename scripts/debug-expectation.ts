// 期待値計算のデバッグ

import { createClient } from '@supabase/supabase-js'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugExpectation() {
  console.log('🔍 期待値計算デバッグ')
  
  // カードデータ確認
  const { data: cards } = await supabase
    .from('cards')
    .select('*, rarity:rarities(*), parameters')
    .eq('pack_id', 'DM25-RP1')
  
  console.log(`\n📊 カード総数: ${cards?.length}枚`)
  
  // レアリティ別集計
  const rarityGroups: Record<string, any[]> = {}
  cards?.forEach(card => {
    const rarityName = card.rarity?.name || 'Unknown'
    if (!rarityGroups[rarityName]) {
      rarityGroups[rarityName] = []
    }
    rarityGroups[rarityName].push(card)
  })
  
  console.log('\n📋 レアリティ別カード数と価格分布:')
  Object.entries(rarityGroups).forEach(([rarity, cards]) => {
    const withPrice = cards.filter(c => c.parameters?.buyback_price > 0)
    const totalPrice = cards.reduce((sum, c) => sum + (c.parameters?.buyback_price || 0), 0)
    const avgPrice = withPrice.length > 0 ? totalPrice / withPrice.length : 0
    
    console.log(`\n${rarity}: ${cards.length}枚`)
    console.log(`  - 価格設定済み: ${withPrice.length}枚`)
    console.log(`  - 平均価格: ¥${Math.round(avgPrice)}`)
    console.log(`  - 価格例:`)
    cards.slice(0, 3).forEach(c => {
      console.log(`    - ${c.name}: ¥${c.parameters?.buyback_price || 0}`)
    })
  })
  
  // ユーザー価格テスト
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .limit(1)
  
  if (users?.[0]) {
    const { data: userPrices } = await supabase
      .from('user_prices')
      .select('*')
      .eq('user_id', users[0].id)
    
    console.log(`\n💾 ユーザー保存価格: ${userPrices?.length || 0}件`)
  }
}

debugExpectation()