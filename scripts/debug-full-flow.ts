// 期待値計算の全体的な流れをデバッグ

import { createClient } from '@supabase/supabase-js'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugFullFlow() {
  console.log('🔍 期待値計算フロー完全デバッグ\n')
  
  // 1. ユーザー確認
  const { data: users } = await supabase
    .from('users')
    .select('id, email')
    .limit(1)
  
  if (!users || users.length === 0) {
    console.log('❌ ユーザーが見つかりません')
    return
  }
  
  const userId = users[0].id
  console.log(`👤 ユーザー: ${users[0].email} (ID: ${userId})`)
  
  // 2. カード確認
  const { data: cards } = await supabase
    .from('cards')
    .select('*, rarity:rarities(*), parameters')
    .eq('pack_id', 'DM25-RP1')
  
  console.log(`\n📊 DM25-RP1のカード: ${cards?.length || 0}枚`)
  
  // 3. user_pricesテーブルの確認
  const { data: allUserPrices } = await supabase
    .from('user_prices')
    .select('*')
    .eq('user_id', userId)
  
  console.log(`\n💾 user_pricesテーブル内の全価格: ${allUserPrices?.length || 0}件`)
  
  if (allUserPrices && allUserPrices.length > 0) {
    // カード情報と結合
    const cardIds = allUserPrices.map(p => p.card_id)
    const { data: priceCards } = await supabase
      .from('cards')
      .select('id, name, card_number, pack_id')
      .in('id', cardIds)
    
    console.log('\n保存されている価格のカード情報:')
    allUserPrices.slice(0, 5).forEach(price => {
      const card = priceCards?.find(c => c.id === price.card_id)
      if (card) {
        console.log(`  - ${card.pack_id} / ${card.card_number} ${card.name}: ¥${price.price}`)
      }
    })
  }
  
  // 4. DM25-RP1専用の価格取得テスト
  console.log('\n🎯 DM25-RP1専用の価格取得:')
  
  // カードIDリストを作成
  const dm25CardIds = cards?.map(c => c.id) || []
  console.log(`  - DM25-RP1のカードID数: ${dm25CardIds.length}`)
  
  // user_pricesから該当カードの価格を取得
  const { data: dm25Prices } = await supabase
    .from('user_prices')
    .select('card_id, price')
    .eq('user_id', userId)
    .in('card_id', dm25CardIds)
  
  console.log(`  - DM25-RP1の保存価格: ${dm25Prices?.length || 0}件`)
  
  // 5. 封入率の確認
  const { data: packRarities } = await supabase
    .from('pack_rarity_details')
    .select('*')
    .eq('pack_id', 'DM25-RP1')
    .order('display_order')
  
  console.log(`\n📦 封入率設定: ${packRarities?.length || 0}件`)
  packRarities?.forEach(pr => {
    console.log(`  - ${pr.rarity_name}: ${pr.total_types}種類中${pr.cards_per_box}枚/BOX`)
  })
  
  // 6. calculation_logsの確認
  const { data: logs } = await supabase
    .from('calculation_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('pack_id', 'DM25-RP1')
    .order('created_at', { ascending: false })
    .limit(5)
  
  console.log(`\n📈 最近の計算ログ:`)
  logs?.forEach((log, i) => {
    console.log(`  ${i+1}. ${new Date(log.created_at).toLocaleString('ja-JP')}`)
    console.log(`     BOX価格: ¥${log.box_price}, 期待値: ¥${log.expected_value}`)
  })
  
  // 7. 手動で期待値計算をテスト
  console.log('\n💎 手動計算テスト:')
  
  // 価格マップ作成
  const priceMap = new Map<string, number>()
  
  // 保存された価格
  dm25Prices?.forEach(p => {
    priceMap.set(p.card_id, p.price)
  })
  
  // 保存されていないカードはparametersから取得
  cards?.forEach(card => {
    if (!priceMap.has(card.id) && card.parameters?.buyback_price) {
      priceMap.set(card.id, card.parameters.buyback_price)
    }
  })
  
  console.log(`  - 価格設定数: ${priceMap.size}件`)
  
  // レアリティ別に期待値を計算
  let totalExpectation = 0
  const rarityGroups: Record<string, any[]> = {}
  
  cards?.forEach(card => {
    const rarityName = card.rarity?.name || 'Unknown'
    if (!rarityGroups[rarityName]) {
      rarityGroups[rarityName] = []
    }
    rarityGroups[rarityName].push({
      ...card,
      price: priceMap.get(card.id) || 0
    })
  })
  
  packRarities?.forEach(pr => {
    const rarityCards = rarityGroups[pr.rarity_name] || []
    if (rarityCards.length > 0 && pr.cards_per_box > 0) {
      const avgPrice = rarityCards.reduce((sum: number, card: any) => sum + card.price, 0) / rarityCards.length
      const contribution = avgPrice * pr.cards_per_box
      totalExpectation += contribution
      console.log(`  - ${pr.rarity_name}: 平均¥${Math.round(avgPrice)} × ${pr.cards_per_box}枚 = ¥${Math.round(contribution)}`)
    }
  })
  
  console.log(`\n  合計期待値: ¥${Math.round(totalExpectation)}`)
}

debugFullFlow()