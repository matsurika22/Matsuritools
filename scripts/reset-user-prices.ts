// ユーザー価格をリセットしてデータベース価格を使用

import { createClient } from '@supabase/supabase-js'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function resetUserPrices() {
  console.log('🔄 ユーザー価格をリセット\n')
  
  // ユーザーを取得
  const { data: users } = await supabase
    .from('users')
    .select('id, email')
    .limit(1)
  
  const userId = users![0].id
  console.log(`👤 ユーザー: ${users![0].email}`)
  
  // 現在の価格を削除
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
  
  // カードとデータベース価格を取得
  const { data: cards } = await supabase
    .from('cards')
    .select('id, name, card_number, parameters, rarity:rarities(name)')
    .eq('pack_id', 'DM25-RP1')
  
  console.log(`\n📊 カード数: ${cards?.length}枚`)
  
  // データベース価格があるカードのみ価格を設定
  const newPrices = cards!
    .filter(card => card.parameters?.buyback_price > 0)
    .map(card => ({
      user_id: userId,
      card_id: card.id,
      price: card.parameters.buyback_price
    }))
  
  console.log(`\n💰 データベース価格のあるカード: ${newPrices.length}件`)
  
  if (newPrices.length > 0) {
    // 価格を保存
    const { error: insertError } = await supabase
      .from('user_prices')
      .insert(newPrices)
    
    if (insertError) {
      console.error('保存エラー:', insertError)
    } else {
      console.log('✅ 保存完了')
    }
    
    // レアリティ別に確認
    const rarityGroups: Record<string, number[]> = {}
    
    cards?.forEach(card => {
      if (card.parameters?.buyback_price > 0) {
        const rarity = (card.rarity && !Array.isArray(card.rarity) ? (card.rarity as any).name : 'Unknown') || 'Unknown'
        if (!rarityGroups[rarity]) rarityGroups[rarity] = []
        rarityGroups[rarity].push(card.parameters.buyback_price)
      }
    })
    
    console.log('\n📋 レアリティ別平均価格:')
    Object.entries(rarityGroups).forEach(([rarity, prices]) => {
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length
      console.log(`  ${rarity}: ${prices.length}枚, 平均¥${Math.round(avg)}`)
    })
  }
  
  // 期待値を再計算
  console.log('\n🎯 期待値を再計算...')
  const { getUserPrices, getPackCards, calculateExpectedValue } = await import('@/lib/supabase/cards')
  
  const packCards = await getPackCards('DM25-RP1')
  const priceMap = await getUserPrices(userId, 'DM25-RP1')
  
  const result = await calculateExpectedValue(packCards, priceMap, 6000)
  console.log(`\n期待値: ¥${result.expectedValue}`)
  console.log(`プラス確率: ${result.profitProbability}%`)
}

resetUserPrices()