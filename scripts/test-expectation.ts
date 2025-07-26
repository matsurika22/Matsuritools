// 期待値計算のテスト

import { createClient } from '@supabase/supabase-js'
import { calculateBoxExpectation, allowsDuplicates } from '../lib/utils/expectation-calculator'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testExpectation() {
  console.log('📊 期待値計算テスト')
  
  // テストデータ
  const { data: cards } = await supabase
    .from('cards')
    .select('*, rarity:rarities(*), parameters')
    .eq('pack_id', 'DM25-RP1')
    .limit(10)
  
  const { data: packRarities } = await supabase
    .from('pack_rarity_details')
    .select('*')
    .eq('pack_id', 'DM25-RP1')
  
  console.log('\n📋 サンプルカード:')
  cards?.slice(0, 5).forEach(card => {
    console.log(`  - ${card.name} (${card.rarity?.name}): ¥${card.parameters?.buyback_price || 0}`)
  })
  
  console.log('\n📦 封入率設定:')
  packRarities?.forEach(pr => {
    console.log(`  - ${pr.rarity_name}: ${pr.total_types}種類中${pr.cards_per_box}枚`)
  })
  
  // 期待値計算
  const cardsWithPrices = cards?.map(card => ({
    id: card.id,
    name: card.name,
    rarity: card.rarity,
    buyback_price: card.parameters?.buyback_price || 0
  })) || []
  
  const rarityInfo = packRarities?.map(pr => ({
    rarity_name: pr.rarity_name,
    total_types: pr.total_types || 0,
    cards_per_box: pr.cards_per_box || 0,
    allows_duplicates: allowsDuplicates(pr.rarity_name)
  })) || []
  
  const result = calculateBoxExpectation(
    cardsWithPrices,
    rarityInfo,
    6000
  )
  
  console.log('\n💰 計算結果:')
  console.log(`  - 期待値: ¥${result.expectedValue}`)
  console.log(`  - プラス確率: ${result.plusProbability}%`)
  console.log('\n📊 レアリティ別内訳:')
  result.breakdown.forEach(item => {
    console.log(`  - ${item.rarity}: ¥${item.expectedValue} (${item.contribution.toFixed(1)}%)`)
  })
}

testExpectation()