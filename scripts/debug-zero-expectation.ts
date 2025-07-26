// 期待値が0円になる原因を徹底調査

import { createClient } from '@supabase/supabase-js'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugZeroExpectation() {
  console.log('🔍 期待値0円問題の徹底調査\n')
  
  // 1. ユーザーとカードの確認
  const { data: users } = await supabase
    .from('users')
    .select('id, email')
    .limit(1)
  
  const userId = users![0].id
  console.log(`👤 ユーザー: ${users![0].email}`)
  
  // 2. 保存された価格の確認
  const { data: userPrices } = await supabase
    .from('user_prices')
    .select('card_id, price')
    .eq('user_id', userId)
    .gt('price', 0) // 価格が0より大きいものだけ
  
  console.log(`\n💰 0円以上の保存価格: ${userPrices?.length || 0}件`)
  
  if (userPrices && userPrices.length > 0) {
    console.log('サンプル:')
    userPrices.slice(0, 5).forEach(p => {
      console.log(`  - ${p.card_id}: ¥${p.price}`)
    })
  }
  
  // 3. カードデータの構造を確認
  const { data: cards } = await supabase
    .from('cards')
    .select('*, rarity:rarities(*)')
    .eq('pack_id', 'DM25-RP1')
    .limit(5)
  
  console.log('\n📊 カードデータの構造:')
  if (cards && cards.length > 0) {
    console.log('サンプルカード:', JSON.stringify(cards[0], null, 2))
  }
  
  // 4. pack_rarity_detailsの確認
  const { data: packRarities } = await supabase
    .from('pack_rarity_details')
    .select('*')
    .eq('pack_id', 'DM25-RP1')
    .gt('cards_per_box', 0)
  
  console.log('\n📦 封入率データ:')
  packRarities?.forEach(pr => {
    console.log(`  - ${pr.rarity_name}: ${pr.total_types}種類中${pr.cards_per_box}枚/BOX`)
  })
  
  // 5. 実際の計算をシミュレート
  console.log('\n💎 計算シミュレーション:')
  
  // getUserPrices関数をテスト
  const { getUserPrices } = await import('@/lib/supabase/cards')
  const priceMap = await getUserPrices(userId, 'DM25-RP1')
  console.log(`getUserPrices結果: ${priceMap.size}件`)
  
  // 価格が設定されているか確認
  let priceCount = 0
  let totalPrice = 0
  priceMap.forEach((price, cardId) => {
    if (price > 0) {
      priceCount++
      totalPrice += price
    }
  })
  console.log(`  - 0円以上の価格: ${priceCount}件`)
  console.log(`  - 価格合計: ¥${totalPrice}`)
  
  // getPackCards関数をテスト
  const { getPackCards } = await import('@/lib/supabase/cards')
  const packCards = await getPackCards('DM25-RP1')
  console.log(`\ngetPackCards結果: ${packCards.length}件`)
  
  // rarityが含まれているか確認
  const cardsWithRarity = packCards.filter(c => c.rarity)
  console.log(`  - rarityあり: ${cardsWithRarity.length}件`)
  
  if (packCards.length > 0) {
    console.log('  - サンプル:', {
      id: packCards[0].id,
      name: packCards[0].name,
      rarityId: packCards[0].rarityId,
      rarity: packCards[0].rarity ? 'あり' : 'なし',
      rarityName: packCards[0].rarity?.name
    })
  }
  
  // 6. カードとレアリティの結合が正しいか確認
  const { data: testJoin } = await supabase
    .from('cards')
    .select(`
      id,
      name,
      rarity_id,
      rarities (
        id,
        name,
        color
      )
    `)
    .eq('pack_id', 'DM25-RP1')
    .limit(5)
  
  console.log('\n🔗 JOIN結果の確認:')
  testJoin?.forEach(card => {
    console.log(`  - ${card.name}: rarity_id=${card.rarity_id}, rarities=${JSON.stringify(card.rarities)}`)
  })
  
  // 7. calculateExpectedValueを直接テスト
  const { calculateExpectedValue } = await import('@/lib/supabase/cards')
  
  // テスト用のカードデータを作成（rarityを確実に含む）
  const testCards = packCards.map(card => ({
    ...card,
    rarity: card.rarity || { 
      id: card.rarityId,
      name: 'Unknown',
      color: '#808080',
      packId: card.packId,
      cardsPerBox: 0,
      totalCards: 0,
      displayOrder: 999,
      createdAt: '',
      updatedAt: ''
    }
  }))
  
  const result = await calculateExpectedValue(testCards, priceMap, 5500)
  console.log('\n🎯 calculateExpectedValue結果:')
  console.log(`  - 期待値: ¥${result.expectedValue}`)
  console.log(`  - プラス確率: ${result.profitProbability}%`)
}

debugZeroExpectation()