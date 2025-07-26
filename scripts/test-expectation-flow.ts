// 期待値計算フロー全体のテスト

import { createClient } from '@supabase/supabase-js'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testExpectationFlow() {
  console.log('🧪 期待値計算フローテスト\n')
  
  // 1. テストユーザーとカードを準備
  const { data: users } = await supabase
    .from('users')
    .select('id, email')
    .limit(1)
  
  if (!users || users.length === 0) {
    console.log('❌ ユーザーが見つかりません')
    return
  }
  
  const userId = users[0].id
  console.log(`👤 テストユーザー: ${users[0].email}`)
  
  // 2. DM25-RP1のカードを取得
  const { data: cards } = await supabase
    .from('cards')
    .select('*, rarity:rarities(*), parameters')
    .eq('pack_id', 'DM25-RP1')
    .limit(10) // テスト用に10枚だけ
  
  if (!cards || cards.length === 0) {
    console.log('❌ カードが見つかりません')
    return
  }
  
  console.log(`\n📊 テスト対象カード: ${cards.length}枚`)
  
  // 3. テスト用価格データを保存
  const testPrices = cards.map((card, index) => ({
    user_id: userId,
    card_id: card.id,
    price: (index + 1) * 100 // 100, 200, 300... とテスト価格を設定
  }))
  
  console.log('\n💾 テスト価格を保存中...')
  
  // 既存の価格をクリア
  await supabase
    .from('user_prices')
    .delete()
    .eq('user_id', userId)
    .in('card_id', cards.map(c => c.id))
  
  // 新しい価格を保存
  const { error: saveError } = await supabase
    .from('user_prices')
    .insert(testPrices)
  
  if (saveError) {
    console.log('❌ 価格保存エラー:', saveError)
    return
  }
  
  console.log('✅ 価格保存完了')
  
  // 4. 保存された価格を確認
  const { data: savedPrices } = await supabase
    .from('user_prices')
    .select('*')
    .eq('user_id', userId)
    .in('card_id', cards.map(c => c.id))
  
  console.log(`\n📋 保存確認: ${savedPrices?.length}件の価格データ`)
  savedPrices?.slice(0, 5).forEach(p => {
    const card = cards.find(c => c.id === p.card_id)
    console.log(`  - ${card?.name}: ¥${p.price}`)
  })
  
  // 5. getUserPricesをシミュレート
  const priceMap = new Map<string, number>()
  savedPrices?.forEach(p => {
    priceMap.set(p.card_id, p.price)
  })
  
  console.log(`\n🗺️ 価格マップ: ${priceMap.size}件`)
  
  // 6. 期待値計算をシミュレート
  const { calculateExpectedValue } = await import('@/lib/supabase/cards')
  
  const allCards = await supabase
    .from('cards')
    .select('*, rarity:rarities(*), parameters')
    .eq('pack_id', 'DM25-RP1')
  
  if (allCards.data) {
    // フルの価格マップを作成
    const fullPriceMap = new Map<string, number>()
    
    // 保存された価格を設定
    savedPrices?.forEach(p => {
      fullPriceMap.set(p.card_id, p.price)
    })
    
    // 残りのカードはデータベースの価格を使用
    allCards.data.forEach(card => {
      if (!fullPriceMap.has(card.id)) {
        fullPriceMap.set(card.id, card.parameters?.buyback_price || 0)
      }
    })
    
    console.log(`\n💰 最終価格マップ: ${fullPriceMap.size}件`)
    
    const boxPrice = 5500
    const result = await calculateExpectedValue(
      allCards.data,
      fullPriceMap,
      boxPrice
    )
    
    console.log('\n🎯 期待値計算結果:')
    console.log(`  - BOX価格: ¥${boxPrice}`)
    console.log(`  - 期待値: ¥${result.expectedValue}`)
    console.log(`  - プラス確率: ${result.profitProbability}%`)
  }
}

testExpectationFlow()