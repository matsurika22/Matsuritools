// カードデータ構造の詳細確認

import { createClient } from '@supabase/supabase-js'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugCardStructure() {
  console.log('🔍 カードデータ構造の詳細確認\n')
  
  // 1. getPackCardsの動作確認
  const { getPackCards } = await import('@/lib/supabase/cards')
  const cards = await getPackCards('DM25-RP1')
  
  console.log(`📊 getPackCards結果: ${cards.length}件`)
  
  if (cards.length > 0) {
    console.log('\nカード[0]の全フィールド:')
    Object.keys(cards[0]).forEach(key => {
      const value = (cards[0] as any)[key]
      if (typeof value === 'object' && value !== null) {
        console.log(`  ${key}: ${JSON.stringify(value)}`)
      } else {
        console.log(`  ${key}: ${value}`)
      }
    })
    
    // rarityIdとrarityの確認
    console.log('\nrarityフィールドの詳細:')
    cards.slice(0, 3).forEach((card, i) => {
      console.log(`カード[${i}]:`)
      console.log(`  rarityId: ${card.rarityId}`)
      console.log(`  rarity: ${JSON.stringify(card.rarity)}`)
    })
  }
  
  // 2. 直接SQLでカードを取得
  console.log('\n📋 直接SQLでカードを取得:')
  const { data: directCards } = await supabase
    .from('cards')
    .select('*')
    .eq('pack_id', 'DM25-RP1')
    .limit(3)
  
  if (directCards) {
    console.log('カード[0]のフィールド:')
    Object.keys(directCards[0]).forEach(key => {
      console.log(`  ${key}: ${directCards[0][key]}`)
    })
  }
  
  // 3. TypeScriptの型定義を確認
  console.log('\n📝 Card型の定義:')
  console.log('  - id, packId, rarityId, cardNumber, name...')
  console.log('  - rarityはオプショナル')
  
  // 4. 価格保存の問題を調査
  console.log('\n💰 価格保存の調査:')
  
  // テストユーザーを取得
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .limit(1)
  
  if (users) {
    const userId = users[0].id
    
    // 最近の価格保存を確認
    const { data: recentPrices } = await supabase
      .from('user_prices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    
    console.log(`最近保存された価格: ${recentPrices?.length || 0}件`)
    if (recentPrices && recentPrices.length > 0) {
      console.log(`最新の保存: ${new Date(recentPrices[0].created_at).toLocaleString('ja-JP')}`)
    }
    
    // 全価格データの統計
    const { data: allPrices, count } = await supabase
      .from('user_prices')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
    
    console.log(`\nユーザーの全価格データ: ${count}件`)
    
    // パックごとの価格数を確認
    if (allPrices) {
      const pricesByPack: Record<string, number> = {}
      
      for (const price of allPrices) {
        // card_idからパックを推定
        const { data: card } = await supabase
          .from('cards')
          .select('pack_id')
          .eq('id', price.card_id)
          .single()
        
        if (card) {
          pricesByPack[card.pack_id] = (pricesByPack[card.pack_id] || 0) + 1
        }
      }
      
      console.log('\nパックごとの価格数:')
      Object.entries(pricesByPack).forEach(([packId, count]) => {
        console.log(`  ${packId}: ${count}件`)
      })
    }
  }
}

debugCardStructure()