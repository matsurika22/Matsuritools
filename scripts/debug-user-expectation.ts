// ユーザーの実際の価格データで期待値を計算してデバッグ

import { createClient } from '@supabase/supabase-js'
import { calculateBoxExpectation, allowsDuplicates } from '@/lib/utils/expectation-calculator'

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugUserExpectation() {
  console.log('🔍 ユーザー価格での期待値計算デバッグ\n')
  
  const packId = 'DM25-RP1'
  
  // 最新のユーザーを取得
  const { data: users } = await supabase
    .from('users')
    .select('id, email')
    .order('created_at', { ascending: false })
    .limit(1)
  
  if (!users || users.length === 0) {
    console.log('ユーザーが見つかりません')
    return
  }
  
  const userId = users[0].id
  console.log(`👤 ユーザー: ${users[0].email || 'ゲスト'}\n`)
  
  // カードデータ取得
  const { data: cards } = await supabase
    .from('cards')
    .select('*, rarity:rarities(*), parameters')
    .eq('pack_id', packId)
  
  if (!cards) return
  
  // ユーザー価格を取得
  const { data: userPrices } = await supabase
    .from('user_prices')
    .select('card_id, price')
    .eq('user_id', userId)
  
  console.log(`💰 ユーザー価格: ${userPrices?.length || 0}件`)
  
  // 価格マップを作成
  const priceMap = new Map<string, number>()
  userPrices?.forEach(p => priceMap.set(p.card_id, p.price))
  
  // カードに価格を設定（ユーザー価格 > 買取価格の優先順位）
  const cardsWithPrices = cards.map(card => {
    const userPrice = priceMap.get(card.id)
    const buybackPrice = card.parameters?.buyback_price || 0
    const finalPrice = userPrice !== undefined ? userPrice : buybackPrice
    
    return {
      ...card,
      buyback_price: finalPrice
    }
  })
  
  // 価格が設定されているカードのみをフィルタリング（問題のある実装）
  const cardsWithPricesOnly = cardsWithPrices.filter(c => c.buyback_price > 0)
  
  console.log(`\n📊 カード統計:`)
  console.log(`  - 全カード数: ${cards.length}`)
  console.log(`  - 価格設定済み（フィルタ後）: ${cardsWithPricesOnly.length}`)
  
  // 封入率データ取得
  const { data: packRarities } = await supabase
    .from('pack_rarity_details')
    .select('*')
    .eq('pack_id', packId)
  
  if (!packRarities) return
  
  // レアリティ情報を準備
  const rarityInfo = packRarities.map(pr => ({
    rarity_name: pr.rarity_name,
    total_types: pr.total_types || 0,
    cards_per_box: pr.cards_per_box || 0,
    allows_duplicates: allowsDuplicates(pr.rarity_name)
  }))
  
  console.log('\n⚠️  問題のある計算（価格設定済みカードのみ）:')
  console.log('─'.repeat(60))
  
  const problemResult = calculateBoxExpectation(
    cardsWithPricesOnly,  // 問題: 価格設定済みのカードのみ
    rarityInfo,
    6000
  )
  
  console.log(`期待値: ¥${Math.round(problemResult.expectedValue)}`)
  
  console.log('\n✅ 正しい計算（全カード）:')
  console.log('─'.repeat(60))
  
  const correctResult = calculateBoxExpectation(
    cardsWithPrices,  // 正しい: 全カード（価格0も含む）
    rarityInfo,
    6000
  )
  
  console.log(`期待値: ¥${Math.round(correctResult.expectedValue)}`)
  
  console.log('\n📊 レアリティ別の詳細比較:')
  console.log('─'.repeat(80))
  console.log('レアリティ | DB種類数 | 価格設定済み | 問題のある期待値 | 正しい期待値')
  console.log('─'.repeat(80))
  
  rarityInfo.forEach(ri => {
    const allCards = cardsWithPrices.filter(c => c.rarity?.name === ri.rarity_name)
    const priceCards = cardsWithPricesOnly.filter(c => c.rarity?.name === ri.rarity_name)
    const problemBreakdown = problemResult.breakdown.find(b => b.rarity === ri.rarity_name)
    const correctBreakdown = correctResult.breakdown.find(b => b.rarity === ri.rarity_name)
    
    console.log(
      `${ri.rarity_name.padEnd(10)} | ` +
      `${String(ri.total_types).padStart(8)} | ` +
      `${String(priceCards.length).padStart(12)} | ` +
      `¥${String(Math.round(problemBreakdown?.expectedValue || 0)).padStart(15)} | ` +
      `¥${Math.round(correctBreakdown?.expectedValue || 0)}`
    )
  })
  
  console.log('─'.repeat(80))
}

debugUserExpectation()