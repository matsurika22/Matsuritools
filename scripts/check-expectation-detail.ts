// 期待値計算の詳細を確認

import { createClient } from '@supabase/supabase-js'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkExpectationDetail() {
  console.log('🔍 期待値計算の詳細確認\n')
  
  // ユーザーの価格データを取得
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .limit(1)
  
  const userId = users![0].id
  
  // 保存された価格を確認
  const { data: userPrices } = await supabase
    .from('user_prices')
    .select('card_id, price')
    .eq('user_id', userId)
  
  console.log(`💰 保存価格: ${userPrices?.length}件`)
  
  // カードと価格を結合
  const { data: cards } = await supabase
    .from('cards')
    .select('*, rarity:rarities(name)')
    .eq('pack_id', 'DM25-RP1')
  
  // 価格マップ作成
  const priceMap = new Map<string, number>()
  userPrices?.forEach(p => priceMap.set(p.card_id, p.price))
  
  // レアリティごとに集計
  const rarityStats: Record<string, {
    cards: any[],
    totalPrice: number,
    avgPrice: number
  }> = {}
  
  cards?.forEach(card => {
    const rarityName = card.rarity?.name || 'Unknown'
    if (!rarityStats[rarityName]) {
      rarityStats[rarityName] = {
        cards: [],
        totalPrice: 0,
        avgPrice: 0
      }
    }
    
    const price = priceMap.get(card.id) || 0
    rarityStats[rarityName].cards.push({ ...card, price })
    rarityStats[rarityName].totalPrice += price
  })
  
  // 平均価格を計算
  Object.values(rarityStats).forEach(stat => {
    stat.avgPrice = stat.cards.length > 0 ? stat.totalPrice / stat.cards.length : 0
  })
  
  // 封入率データを取得
  const { data: packRarities } = await supabase
    .from('pack_rarity_details')
    .select('*')
    .eq('pack_id', 'DM25-RP1')
    .order('display_order')
  
  console.log('\n📊 レアリティ別期待値計算:')
  console.log('─'.repeat(80))
  console.log('レアリティ | 種類数 | BOX枚数 | 平均価格 | 期待値計算式 | 期待値')
  console.log('─'.repeat(80))
  
  let totalExpectation = 0
  
  packRarities?.forEach(pr => {
    const stat = rarityStats[pr.rarity_name]
    if (!stat || pr.cards_per_box === 0) return
    
    // 期待値計算
    const expectation = stat.avgPrice * pr.cards_per_box
    totalExpectation += expectation
    
    console.log(
      `${pr.rarity_name.padEnd(10)} | ` +
      `${String(stat.cards.length).padStart(6)} | ` +
      `${String(pr.cards_per_box).padStart(7)} | ` +
      `¥${String(Math.round(stat.avgPrice)).padStart(7)} | ` +
      `¥${Math.round(stat.avgPrice)} × ${pr.cards_per_box} | ` +
      `¥${Math.round(expectation)}`
    )
  })
  
  console.log('─'.repeat(80))
  console.log(`合計期待値: ¥${Math.round(totalExpectation)}`)
  
  // 高額カードを確認
  console.log('\n💎 高額カード（¥1000以上）:')
  cards?.forEach(card => {
    const price = priceMap.get(card.id) || 0
    if (price >= 1000) {
      console.log(`  - ${card.rarity.name} ${card.card_number} ${card.name}: ¥${price}`)
    }
  })
  
  // データベースの買取価格も確認
  console.log('\n📋 データベースの買取価格（parameters）:')
  const dbPrices = cards?.filter(c => c.parameters?.buyback_price > 0)
  console.log(`  - 価格設定済み: ${dbPrices?.length}件`)
  
  if (dbPrices && dbPrices.length > 0) {
    const dbTotal = dbPrices.reduce((sum, c) => sum + (c.parameters.buyback_price || 0), 0)
    console.log(`  - 合計: ¥${dbTotal}`)
    console.log(`  - 平均: ¥${Math.round(dbTotal / dbPrices.length)}`)
  }
}

checkExpectationDetail()