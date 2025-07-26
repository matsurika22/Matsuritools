// 価格保存フローの完全テスト

import { createClient } from '@supabase/supabase-js'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testPriceSaveFlow() {
  console.log('💾 価格保存フローの完全テスト\n')
  
  // テストユーザー
  const { data: users } = await supabase
    .from('users')
    .select('id, email')
    .limit(1)
  
  const userId = users![0].id
  console.log(`👤 ユーザー: ${users![0].email}`)
  
  // 1. 現在の価格を全削除（テスト用）
  console.log('\n🗑️  既存の価格を削除...')
  const { error: deleteError } = await supabase
    .from('user_prices')
    .delete()
    .eq('user_id', userId)
  
  if (deleteError) {
    console.error('削除エラー:', deleteError)
  } else {
    console.log('✅ 削除完了')
  }
  
  // 2. DM25-RP1のカードを取得
  const { data: cards } = await supabase
    .from('cards')
    .select('id, name, card_number')
    .eq('pack_id', 'DM25-RP1')
    .limit(144) // 全144枚
  
  console.log(`\n📊 対象カード: ${cards?.length}枚`)
  
  // 3. テスト価格を作成（全カードに価格を設定）
  const testPrices = cards!.map((card, index) => ({
    user_id: userId,
    card_id: card.id,
    price: (index + 1) * 10 // 10, 20, 30... という価格
  }))
  
  console.log(`\n💰 保存する価格データ: ${testPrices.length}件`)
  console.log('サンプル:')
  testPrices.slice(0, 3).forEach(p => {
    const card = cards!.find(c => c.id === p.card_id)
    console.log(`  - ${card?.name}: ¥${p.price}`)
  })
  
  // 4. 価格を保存
  console.log('\n💾 価格を保存中...')
  const { error: insertError, count } = await supabase
    .from('user_prices')
    .insert(testPrices)
    .select('*')
  
  if (insertError) {
    console.error('❌ 保存エラー:', insertError)
    console.error('エラー詳細:', JSON.stringify(insertError, null, 2))
  } else {
    console.log(`✅ 保存完了: ${count}件`)
  }
  
  // 5. 保存結果を確認
  console.log('\n📋 保存結果の確認...')
  const { data: savedPrices, count: savedCount } = await supabase
    .from('user_prices')
    .select('*')
    .eq('user_id', userId)
  
  console.log(`保存された価格: ${savedCount}件`)
  
  // 6. getUserPricesで取得
  const { getUserPrices } = await import('@/lib/supabase/cards')
  const priceMap = await getUserPrices(userId, 'DM25-RP1')
  
  console.log(`\ngetUserPrices結果: ${priceMap.size}件`)
  
  // 7. 期待値計算をテスト
  const { getPackCards, calculateExpectedValue } = await import('@/lib/supabase/cards')
  const packCards = await getPackCards('DM25-RP1')
  
  console.log(`\n🎯 期待値計算テスト:`)
  console.log(`  - カード数: ${packCards.length}`)
  console.log(`  - 価格数: ${priceMap.size}`)
  
  const result = await calculateExpectedValue(packCards, priceMap, 5500)
  console.log(`  - 期待値: ¥${result.expectedValue}`)
  console.log(`  - プラス確率: ${result.profitProbability}%`)
  
  // 8. 価格の合計を確認
  let totalPrice = 0
  priceMap.forEach(price => {
    totalPrice += price
  })
  console.log(`\n💰 価格合計: ¥${totalPrice}`)
}

testPriceSaveFlow()