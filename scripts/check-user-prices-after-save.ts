// ユーザー価格保存後の確認スクリプト

import { createClient } from '@supabase/supabase-js'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUserPricesAfterSave() {
  console.log('💰 ユーザー価格保存後の確認\n')
  
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
  console.log(`👤 ユーザー: ${user.email}`)
  
  // 保存されているすべての価格を確認
  const { data: allPrices } = await supabase
    .from('user_prices')
    .select('card_id, price, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  console.log(`\n💾 保存済み価格: ${allPrices?.length || 0}件`)
  
  if (allPrices && allPrices.length > 0) {
    // カード情報と結合して表示
    const cardIds = allPrices.map(p => p.card_id)
    const { data: cards } = await supabase
      .from('cards')
      .select('id, name, card_number, pack_id')
      .in('id', cardIds)
    
    const cardMap = new Map(cards?.map(c => [c.id, c]) || [])
    
    // パックごとに分類
    const pricesByPack: Record<string, any[]> = {}
    
    allPrices.forEach(price => {
      const card = cardMap.get(price.card_id)
      if (card) {
        if (!pricesByPack[card.pack_id]) {
          pricesByPack[card.pack_id] = []
        }
        pricesByPack[card.pack_id].push({
          ...price,
          card
        })
      }
    })
    
    console.log('\n📦 パックごとの保存価格:')
    Object.entries(pricesByPack).forEach(([packId, prices]) => {
      console.log(`\n${packId}: ${prices.length}件`)
      prices.slice(0, 5).forEach(p => {
        console.log(`  - ${p.card.card_number} ${p.card.name}: ¥${p.price}`)
        console.log(`    保存日時: ${new Date(p.created_at).toLocaleString('ja-JP')}`)
      })
      if (prices.length > 5) {
        console.log(`  ... 他${prices.length - 5}件`)
      }
    })
    
    // 最新の保存を確認
    const latestPrice = allPrices[0]
    console.log(`\n🕐 最新の保存:`)
    console.log(`  日時: ${new Date(latestPrice.created_at).toLocaleString('ja-JP')}`)
    
    // DM25-RP1の価格のみを抽出
    const dm25Prices = pricesByPack['DM25-RP1'] || []
    console.log(`\n🎯 DM25-RP1の保存価格: ${dm25Prices.length}件`)
    
    if (dm25Prices.length === 0) {
      console.log('  ⚠️  DM25-RP1の価格データが保存されていません！')
    }
  }
  
  // getUserPrices関数をテスト
  const { getUserPrices } = await import('@/lib/supabase/cards')
  const priceMap = await getUserPrices(user.id, 'DM25-RP1')
  
  console.log(`\n🗺️ getUserPrices('DM25-RP1')の結果: ${priceMap.size}件`)
}

checkUserPricesAfterSave()