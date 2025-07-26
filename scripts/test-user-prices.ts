// ユーザー価格の保存と期待値計算のテスト

import { createClient } from '@supabase/supabase-js'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testUserPrices() {
  console.log('💰 ユーザー価格と期待値計算のテスト')
  
  // テストユーザーを取得
  const { data: users } = await supabase
    .from('users')
    .select('id, email')
    .limit(1)
  
  if (!users || users.length === 0) {
    console.log('❌ ユーザーが見つかりません')
    return
  }
  
  const user = users[0]
  console.log(`\n👤 テストユーザー: ${user.email}`)
  
  // ユーザーの保存価格を確認
  const { data: userPrices } = await supabase
    .from('user_prices')
    .select('card_id, price')
    .eq('user_id', user.id)
  
  console.log(`\n💾 保存済み価格: ${userPrices?.length || 0}件`)
  
  // カードデータを取得
  const { data: cards } = await supabase
    .from('cards')
    .select('*, rarity:rarities(name), parameters')
    .eq('pack_id', 'DM25-RP1')
  
  console.log(`\n📊 カード総数: ${cards?.length}枚`)
  
  // 価格マップを作成
  const priceMap = new Map<string, number>()
  
  // ユーザー価格がある場合はそれを使用
  userPrices?.forEach(up => {
    priceMap.set(up.card_id, up.price)
  })
  
  // ユーザー価格がない場合はデータベースの価格を使用
  cards?.forEach(card => {
    if (!priceMap.has(card.id)) {
      priceMap.set(card.id, card.parameters?.buyback_price || 0)
    }
  })
  
  console.log(`\n💰 価格設定状況:`)
  let totalWithPrice = 0
  let totalPrice = 0
  
  cards?.forEach(card => {
    const price = priceMap.get(card.id) || 0
    if (price > 0) {
      totalWithPrice++
      totalPrice += price
    }
  })
  
  console.log(`  - 価格設定済み: ${totalWithPrice}枚`)
  console.log(`  - 価格合計: ¥${totalPrice}`)
  
  // pack_rarity_detailsを確認
  const { data: packRarities } = await supabase
    .from('pack_rarity_details')
    .select('*')
    .eq('pack_id', 'DM25-RP1')
  
  console.log(`\n📦 封入率設定: ${packRarities?.length}件`)
  
  // 期待値計算のシミュレーション
  if (packRarities && packRarities.length > 0) {
    let expectedValue = 0
    
    // レアリティごとに期待値を計算
    packRarities.forEach(pr => {
      const rarityCards = cards?.filter(c => c.rarity?.name === pr.rarity_name) || []
      const cardsPerBox = pr.cards_per_box || 0
      
      if (rarityCards.length > 0 && cardsPerBox > 0) {
        const avgPrice = rarityCards.reduce((sum, card) => {
          return sum + (priceMap.get(card.id) || 0)
        }, 0) / rarityCards.length
        
        const rarityExpectedValue = avgPrice * cardsPerBox
        expectedValue += rarityExpectedValue
        
        console.log(`\n  ${pr.rarity_name}: ${rarityCards.length}種類, ${cardsPerBox}枚/BOX`)
        console.log(`    平均価格: ¥${Math.round(avgPrice)}`)
        console.log(`    期待値寄与: ¥${Math.round(rarityExpectedValue)}`)
      }
    })
    
    console.log(`\n💎 計算された期待値: ¥${Math.round(expectedValue)}`)
  }
}

testUserPrices()