// 価格保存処理のテスト

import { createClient } from '@supabase/supabase-js'
import { saveUserPrices } from '@/lib/supabase/cards'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testSavePrices() {
  console.log('💾 価格保存処理のテスト\n')
  
  // テストユーザーを取得
  const { data: users } = await supabase
    .from('users')
    .select('id, email')
    .limit(1)
  
  if (!users || users.length === 0) {
    console.log('❌ ユーザーが見つかりません')
    return
  }
  
  const userId = users[0].id
  console.log(`👤 ユーザー: ${users[0].email}`)
  
  // DM25-RP1のカードを取得
  const { data: cards } = await supabase
    .from('cards')
    .select('id, name, card_number')
    .eq('pack_id', 'DM25-RP1')
    .limit(5) // テスト用に5枚だけ
  
  if (!cards || cards.length === 0) {
    console.log('❌ カードが見つかりません')
    return
  }
  
  console.log(`\n📊 テスト対象カード: ${cards.length}枚`)
  cards.forEach(card => {
    console.log(`  - ${card.card_number} ${card.name}`)
  })
  
  // テスト価格データを作成
  const testPrices = cards.map((card, index) => ({
    cardId: card.id,
    price: (index + 1) * 1000 // 1000, 2000, 3000...
  }))
  
  console.log('\n💾 価格を保存中...')
  console.log('保存データ:', testPrices)
  
  try {
    await saveUserPrices(userId, testPrices)
    console.log('✅ 保存完了')
  } catch (error) {
    console.error('❌ 保存エラー:', error)
    return
  }
  
  // 保存結果を確認
  console.log('\n📋 保存結果を確認...')
  
  const { data: savedPrices } = await supabase
    .from('user_prices')
    .select('*')
    .eq('user_id', userId)
    .in('card_id', cards.map(c => c.id))
  
  console.log(`保存された価格: ${savedPrices?.length || 0}件`)
  
  if (savedPrices && savedPrices.length > 0) {
    savedPrices.forEach(price => {
      const card = cards.find(c => c.id === price.card_id)
      console.log(`  - ${card?.name}: ¥${price.price}`)
    })
  }
  
  // getUserPricesでも確認
  const { getUserPrices } = await import('@/lib/supabase/cards')
  const priceMap = await getUserPrices(userId, 'DM25-RP1')
  
  console.log(`\n🗺️ getUserPrices結果: ${priceMap.size}件`)
  
  // 全件確認
  const { data: allPrices } = await supabase
    .from('user_prices')
    .select('*')
    .eq('user_id', userId)
  
  console.log(`\n📊 ユーザーの全価格データ: ${allPrices?.length || 0}件`)
}

testSavePrices()