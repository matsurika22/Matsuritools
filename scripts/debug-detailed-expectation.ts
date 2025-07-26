// 期待値計算の詳細デバッグ

import { createClient } from '@supabase/supabase-js'
import { calculateBoxExpectation, allowsDuplicates } from '@/lib/utils/expectation-calculator'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugDetailedExpectation() {
  console.log('🔍 期待値計算詳細デバッグ\n')
  
  // カードデータ取得
  const { data: cards } = await supabase
    .from('cards')
    .select('*, rarity:rarities(*), parameters')
    .eq('pack_id', 'DM25-RP1')
  
  if (!cards) return
  
  console.log(`📊 カード総数: ${cards.length}枚`)
  
  // 封入率データ取得
  const { data: packRarities } = await supabase
    .from('pack_rarity_details')
    .select('*')
    .eq('pack_id', 'DM25-RP1')
  
  if (!packRarities) return
  
  console.log(`📦 封入率設定: ${packRarities.length}件\n`)
  
  // カードに価格を設定（parametersから）
  const cardsWithPrices = cards.map(card => ({
    ...card,
    buyback_price: card.parameters?.buyback_price || 0
  }))
  
  // レアリティ別に確認
  console.log('📋 レアリティ別カード数と価格:')
  const rarityGroups: Record<string, any[]> = {}
  cardsWithPrices.forEach(card => {
    const rarityName = card.rarity?.name || 'Unknown'
    if (!rarityGroups[rarityName]) {
      rarityGroups[rarityName] = []
    }
    rarityGroups[rarityName].push(card)
  })
  
  Object.entries(rarityGroups).forEach(([rarity, cards]) => {
    const withPrice = cards.filter(c => c.buyback_price > 0)
    const totalPrice = cards.reduce((sum, c) => sum + c.buyback_price, 0)
    console.log(`\n${rarity}: ${cards.length}種類`)
    console.log(`  - 価格設定済み: ${withPrice.length}枚`)
    console.log(`  - 合計価格: ¥${totalPrice}`)
    if (withPrice.length > 0) {
      console.log(`  - 平均価格: ¥${Math.round(totalPrice / withPrice.length)}`)
    }
  })
  
  // 封入率情報を準備
  console.log('\n📦 封入率情報:')
  const rarityInfo = packRarities.map(pr => {
    console.log(`${pr.rarity_name}: ${pr.total_types}種類中${pr.cards_per_box}枚/BOX`)
    return {
      rarity_name: pr.rarity_name,
      total_types: pr.total_types || 0,
      cards_per_box: pr.cards_per_box || 0,
      allows_duplicates: allowsDuplicates(pr.rarity_name)
    }
  })
  
  // 期待値計算を実行
  console.log('\n💎 期待値計算実行...')
  const boxPrice = 5500
  const result = calculateBoxExpectation(
    cardsWithPrices,
    rarityInfo,
    boxPrice
  )
  
  console.log('\n🎯 計算結果:')
  console.log(`  - BOX価格: ¥${boxPrice}`)
  console.log(`  - 期待値: ¥${Math.round(result.expectedValue)}`)
  console.log(`  - プラス確率: ${result.plusProbability}%`)
  
  console.log('\n📊 レアリティ別期待値寄与:')
  result.breakdown.forEach(item => {
    console.log(`  - ${item.rarity}: ¥${Math.round(item.expectedValue)} (${item.contribution.toFixed(1)}%)`)
  })
  
  // 問題の特定
  console.log('\n⚠️  デバッグ情報:')
  
  // rarityInfoとrarityGroupsのマッピング確認
  rarityInfo.forEach(info => {
    const cards = rarityGroups[info.rarity_name]
    if (!cards) {
      console.log(`❌ ${info.rarity_name}: カードデータなし`)
    } else if (info.total_types === 0) {
      console.log(`❌ ${info.rarity_name}: total_types = 0`)
    } else if (info.cards_per_box === 0) {
      console.log(`❌ ${info.rarity_name}: cards_per_box = 0`)
    } else {
      console.log(`✅ ${info.rarity_name}: 正常`)
    }
  })
}

debugDetailedExpectation()